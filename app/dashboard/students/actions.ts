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
      ),
      records (
        point
      )
    `)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    // Calculate total points for each student
    const studentsWithPoints = data.map((student: any) => {
        const totalPoints = student.records?.reduce((sum: number, record: any) => sum + record.point, 0) || 0;
        // Remove records array to keep payload light, we only need the total
        const { records, ...rest } = student;
        return {
            ...rest,
            total_points: totalPoints
        };
    });

    return studentsWithPoints;
}

export async function getStudentHistory(studentId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('records')
        .select(`
            id,
            point,
            notes,
            input_date,
            created_at,
            aspect:aspects(name, type),
            rule:aspect_rules(name)
        `)
        .eq('student_id', studentId)
        .order('input_date', { ascending: false });

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

export async function importStudents(students: { id?: string; nisn: string | null; name: string; class_id: string; gender: string }[]) {
    const supabase = await createClient();

    // 1. Get unique class IDs to query existing students in those classes
    const classIds = Array.from(new Set(students.map(s => s.class_id)));

    // 2. Fetch existing students in those classes to match by name
    const { data: existingStudents, error: fetchError } = await supabase
        .from('students')
        .select('id, name, class_id')
        .in('class_id', classIds);

    if (fetchError) return { error: fetchError.message };

    // 3. Create a lookup map: key is "name_classid" in lowercase
    const lookup = new Map<string, string>();
    if (existingStudents) {
        for (const s of existingStudents) {
            const key = `${s.name.toLowerCase().trim()}_${s.class_id}`;
            lookup.set(key, s.id);
        }
    }

    // 4. Build upsert payload
    const upsertData = students.map(student => {
        let studentId = student.id;

        // If no ID is provided, try to match by name and class
        if (!studentId) {
            const key = `${student.name.toLowerCase().trim()}_${student.class_id}`;
            studentId = lookup.get(key);
        }

        if (studentId) {
            return {
                id: studentId,
                name: student.name,
                class_id: student.class_id,
                nisn: student.nisn,
                gender: student.gender
            };
        } else {
            return {
                name: student.name,
                class_id: student.class_id,
                nisn: student.nisn,
                gender: student.gender
            };
        }
    });

    // 5. Execute upsert
    const { error } = await supabase
        .from('students')
        .upsert(upsertData);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/students');
    return { success: true };
}
