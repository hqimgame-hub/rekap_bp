'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getClasses() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('grade', { ascending: true })
        .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
}

export async function createClass(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;
    const grade = formData.get('grade') as string;

    const { error } = await supabase
        .from('classes')
        .insert({ name, grade });

    if (error) return { error: error.message };

    revalidatePath('/dashboard/classes');
    return { success: true };
}

export async function updateClass(id: string, formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;
    const grade = formData.get('grade') as string;

    const { error } = await supabase
        .from('classes')
        .update({ name, grade })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/classes');
    return { success: true };
}

export async function deleteClass(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/classes');
    return { success: true };
}

export async function bulkDeleteClasses(ids: string[]) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('classes')
        .delete()
        .in('id', ids);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/classes');
    return { success: true };
}
