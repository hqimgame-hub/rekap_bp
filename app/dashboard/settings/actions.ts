'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getSettings() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .order('key');

    if (error) throw new Error(error.message);
    return data || [];
}

export async function updateSetting(key: string, value: string) {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthenticated');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        throw new Error('Unauthorized: Only Admin can change settings');
    }

    const { error } = await supabase
        .from('settings')
        .upsert({
            key,
            value,
            updated_at: new Date().toISOString()
        });

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/settings');
    return { success: true };
}

export async function updateAllSettings(settings: Record<string, string>) {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthenticated');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        throw new Error('Unauthorized: Hanya Admin yang diperbolehkan mengubah pengaturan');
    }

    for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
            .from('settings')
            .upsert({
                key,
                value,
                updated_at: new Date().toISOString()
            });

        if (error) throw new Error(`Failed to update ${key}: ${error.message}`);
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
}

export async function deleteData(
    type: 'all' | 'attendance' | 'violations',
    startDate?: string,
    endDate?: string
) {
    const supabase = await createClient();

    // Check if user is authorized (Double check)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthenticated');

    // Check role just in case
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin' && profile?.role !== 'kepsek') {
        throw new Error('Unauthorized: Only Admin or Kepsek can delete data');
    }

    // Get 'Kehadiran' aspect ID
    const { data: aspect } = await supabase
        .from('aspects')
        .select('id')
        .eq('name', 'Kehadiran')
        .single();

    const attendanceAspectId = aspect?.id;

    let query = supabase.from('records').delete();

    // 1. Filter by Type
    if (type === 'attendance') {
        if (!attendanceAspectId) throw new Error('Aspect "Kehadiran" not found');
        query = query.eq('aspect_id', attendanceAspectId);
    } else if (type === 'violations') {
        if (attendanceAspectId) {
            query = query.neq('aspect_id', attendanceAspectId);
        }
    }
    // if 'all', we don't filter by aspect_id

    // 2. Filter by Date
    if (startDate) {
        query = query.gte('input_date', startDate);
    }
    if (endDate) {
        query = query.lte('input_date', endDate);
    }

    // Execute
    const { error, count } = await query;

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard');
    return { success: true, count };
}
