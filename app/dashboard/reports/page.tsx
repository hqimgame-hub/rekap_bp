import { getClasses } from './actions';
import { createClient } from '@/lib/supabase/server';
import ReportsClient from '@/components/dashboard/reports/ReportsClient';

export default async function Page() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, class_id')
        .eq('id', user?.id)
        .single();

    const classes = await getClasses();

    // Filter classes for walas
    const filteredClasses = profile?.role === 'walas'
        ? (classes || []).filter(c => c.id === profile.class_id)
        : (classes || []);

    return (
        <ReportsClient classes={filteredClasses} />
    );
}
