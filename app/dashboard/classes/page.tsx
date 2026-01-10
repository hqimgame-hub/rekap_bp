import { getClasses } from './actions';
import { createClient } from '@/lib/supabase/server';
import ClassesClient from '@/components/dashboard/classes/ClassesClient';

export default async function Page() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch profile for role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

    const classes = await getClasses();

    return (
        <ClassesClient
            initialData={classes || []}
            userRole={profile?.role as any}
        />
    );
}
