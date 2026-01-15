import { getSettings } from './actions';
import SettingsClient from './SettingsClient';
import { createClient } from '@/lib/supabase/server';

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch Profile to get role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

    const settings = await getSettings();
    const role = profile?.role || 'user';

    return <SettingsClient initialSettings={settings} role={role} />;
}
