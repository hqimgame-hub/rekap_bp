'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createRecord(prevState: any, formData: FormData) {
    const supabase = await createClient();

    const student_ids = formData.getAll('student_ids') as string[];
    const aspect_id = formData.get('aspect_id') as string;
    const rule_id = formData.get('rule_id') as string;
    const point = parseInt(formData.get('point') as string);
    const dateStr = formData.get('date') as string;

    // Get current user for input_by
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    if (!student_ids || student_ids.length === 0) {
        return { error: 'Pilih minimal satu siswa.' };
    }

    if (!aspect_id || !rule_id) {
        return { error: 'Pilih aspek dan aturan.' };
    }

    // Isolate component actions or just loop insert? Loop is fine for small batches.
    const recordsToInsert = [];

    // We need to fetch class_id for each student for denormalization
    const { data: studentsData } = await supabase
        .from('students')
        .select('id, class_id')
        .in('id', student_ids);

    if (!studentsData) return { error: 'Data siswa tidak ditemukan.' };

    const studentMap = new Map(studentsData.map(s => [s.id, s.class_id]));

    for (const student_id of student_ids) {
        const class_id = studentMap.get(student_id);
        if (!class_id) continue;

        recordsToInsert.push({
            student_id,
            class_id,
            aspect_id,
            rule_id,
            point,
            input_by: user.id, // Assuming profiles.id matches auth.users.id
            input_date: dateStr ? new Date(dateStr) : new Date(),
        });
    }

    const { error } = await supabase
        .from('records')
        .insert(recordsToInsert);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/records');
    return { success: true, count: recordsToInsert.length };
}

// Helper to fetch data needed for the form
export async function getFormProps() {
    const supabase = await createClient();

    const [aspectsRes, classesRes] = await Promise.all([
        supabase
            .from('aspects')
            .select(`
                id, name, type,
                aspect_rules ( id, name, point )
            `)
            .eq('active', true)
            .order('name'),
        supabase
            .from('classes')
            .select('id, name')
            .order('name')
    ]);

    if (aspectsRes.error) throw new Error(aspectsRes.error.message);
    if (classesRes.error) throw new Error(classesRes.error.message);

    return {
        aspects: aspectsRes.data,
        classes: classesRes.data
    };
}

export async function getStudentsByClass(class_id?: string) {
    const supabase = await createClient();
    let query = supabase
        .from('students')
        .select('id, name, gender');

    if (class_id) {
        query = query.eq('class_id', class_id);
    }

    const { data, error } = await query.order('name');

    if (error) throw new Error(error.message);
    return data;
}
