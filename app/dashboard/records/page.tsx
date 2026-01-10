import { getFormProps } from './actions';
import { createClient } from '@/lib/supabase/server';
import RecordForm from '@/components/dashboard/records/RecordForm';

export default async function Page() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, class_id')
        .eq('id', user?.id)
        .single();

    const { aspects, classes } = await getFormProps();

    // Filter classes for walas
    const filteredClasses = profile?.role === 'walas'
        ? (classes || []).filter(c => c.id === profile.class_id)
        : (classes || []);

    return (
        <RecordForm
            initialAspects={aspects || []}
            initialClasses={filteredClasses}
        />
    );
}
