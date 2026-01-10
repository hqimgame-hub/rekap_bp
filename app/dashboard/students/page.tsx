import { getStudents } from './actions';
import { getClasses } from '../classes/actions';
import { createClient } from '@/lib/supabase/server';
import StudentsClient from '@/components/dashboard/students/StudentsClient';

export default async function Page() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch profile for role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

    const [students, classes] = await Promise.all([
        getStudents(),
        getClasses()
    ]);

    return (
        <StudentsClient
            initialData={students || []}
            classesOptions={classes || []}
            userRole={profile?.role as any}
        />
    );
}
