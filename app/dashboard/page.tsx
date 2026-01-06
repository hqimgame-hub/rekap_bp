import { createClient } from '@/lib/supabase/server';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { Card } from '@/components/ui/Card';

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const role = profile?.role;

    if (role === 'admin') {
        return <AdminDashboard />;
    }

    if (role === 'kepsek') {
        return (
            <div>
                <h1>Dashboard Kepala Sekolah</h1>
                <Card>
                    <p>Welcome, Principal. Analytics will appear here.</p>
                </Card>
            </div>
        )
    }

    return (
        <div>
            <h1>Selamat Datang, {role}</h1>
            <Card>
                <p>Anda berhasil login. Menu tersedia di sidebar.</p>
            </Card>
        </div>
    );
}
