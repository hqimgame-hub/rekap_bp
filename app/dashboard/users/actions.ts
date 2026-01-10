'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getUsers() {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') throw new Error('Unauthorized: Admin only');

    // Fetch profiles - Using adminClient to bypass RLS and ensure all accounts are visible
    const { data: profiles, error: profileError } = await adminClient
        .from('profiles')
        .select(`
            *,
            class:classes(id, name)
        `)
        .order('created_at', { ascending: false });

    if (profileError) throw new Error(profileError.message);

    // Fetch Auth Users to get emails
    const { data: { users: authUsers }, error: authError } = await adminClient.auth.admin.listUsers();

    if (authError) throw new Error(authError.message);

    // Combine profiles with auth emails
    const mergedUsers = profiles.map(p => {
        const authUser = authUsers.find(au => au.id === p.id);
        return {
            ...p,
            email: authUser?.email || 'N/A'
        };
    });

    return mergedUsers;
}

export async function createUser(formData: {
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'kepsek' | 'walas' | 'petugas_input' | 'petugas_scan';
    classId?: string | null;
}) {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // 1. Verify caller is admin
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) throw new Error('Unauthorized');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

    if (profile?.role !== 'admin') throw new Error('Unauthorized: Admin only');

    // 2. Create the user in Auth
    const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
            name: formData.name
        }
    });

    if (authError) throw new Error(authError.message);

    // 3. Update/Insert the profile
    const { error: profileError } = await adminClient
        .from('profiles')
        .upsert({
            id: newUser.user.id,
            role: formData.role,
            class_id: formData.classId || null,
            name: formData.name
        });

    if (profileError) {
        // Rollback
        await adminClient.auth.admin.deleteUser(newUser.user.id);
        throw new Error(`Profile setup failed: ${profileError.message}`);
    }

    revalidatePath('/dashboard/users');
    return { success: true };
}

export async function updateUser(userId: string, formData: {
    email?: string;
    password?: string;
    name: string;
    role: 'admin' | 'kepsek' | 'walas' | 'petugas_input' | 'petugas_scan';
    classId?: string | null;
}) {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Check admin
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser?.id)
        .single();

    if (profile?.role !== 'admin') throw new Error('Unauthorized');

    // Update Auth User if email or password is provided
    const authUpdatePayload: any = {
        user_metadata: { name: formData.name }
    };
    if (formData.email) authUpdatePayload.email = formData.email;
    if (formData.password) authUpdatePayload.password = formData.password;

    const { error: authError } = await adminClient.auth.admin.updateUserById(userId, authUpdatePayload);
    if (authError) throw new Error(authError.message);

    // Update Profile
    const { error: profileError } = await adminClient
        .from('profiles')
        .update({
            name: formData.name,
            role: formData.role,
            class_id: formData.role === 'walas' ? formData.classId : null
        })
        .eq('id', userId);

    if (profileError) throw new Error(profileError.message);

    revalidatePath('/dashboard/users');
    return { success: true };
}

export async function deleteUser(userId: string) {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Check admin
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser?.id)
        .single();

    if (profile?.role !== 'admin') throw new Error('Unauthorized');
    if (userId === currentUser?.id) throw new Error('Cannot delete yourself');

    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/users');
    return { success: true };
}
