'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getStudents() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('students')
        .select(`
      *,
      classes (
        id,
        name
      )
    `)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
}

export async function createStudent(formData: FormData) {
    const supabase = await createClient();
    const nisn = formData.get('nisn') as string || null;
    const name = formData.get('name') as string;
    const class_id = formData.get('class_id') as string;
    const gender = formData.get('gender') as string;

    const { error } = await supabase
        .from('students')
        .insert({ nisn, name, class_id, gender });

    if (error) return { error: error.message };

    revalidatePath('/dashboard/students');
    return { success: true };
}

export async function updateStudent(id: string, formData: FormData) {
    const supabase = await createClient();
    const nisn = formData.get('nisn') as string || null;
    const name = formData.get('name') as string;
    const class_id = formData.get('class_id') as string;
    const gender = formData.get('gender') as string;

    const { error } = await supabase
        .from('students')
        .update({ nisn, name, class_id, gender })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/students');
    return { success: true };
}

export async function deleteStudent(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/students');
    return { success: true };
}

export async function bulkDeleteStudents(ids: string[]) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('students')
        .delete()
        .in('id', ids);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/students');
    return { success: true };
}

export async function importStudents(students: { nisn: string | null; name: string; class_id: string; gender: string }[]) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('students')
        .insert(students);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/students');
    return { success: true };
}
