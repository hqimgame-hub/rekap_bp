import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import styles from './layout.module.css';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    console.log('[DashboardLayout] Starting layout...');

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        console.log('[DashboardLayout] No user, redirecting to login');
        redirect('/login');
    }

    console.log('[DashboardLayout] Fetching profile for user:', user.id);
    // Fetch Profile to get role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, name')
        .eq('id', user.id)
        .single();

    console.log('[DashboardLayout] Profile fetched:', profile?.role);

    const role = (profile?.role as any) || 'petugas_input';

    if (!profile) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold">Profil Tidak Ditemukan</h2>
                    <p className="text-slate-600">Hubungi Admin untuk aktivasi akun Anda.</p>
                </div>
            </div>
        );
    }

    const isPetugas = role === 'petugas_input' || role === 'petugas_scan' || role === 'petugas';

    return (
        <div className={isPetugas ? styles.layoutColumn : styles.layout}>
            {isPetugas ? (
                <Topbar role={role} userEmail={user.email || ''} />
            ) : (
                <Sidebar role={role} userEmail={user.email || ''} />
            )}
            <main className={isPetugas ? styles.mainFull : styles.main}>
                <div className={styles.content}>
                    {children}
                </div>
            </main>
        </div>
    );
}
