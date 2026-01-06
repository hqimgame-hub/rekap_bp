import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import styles from './layout.module.css';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch Profile to get role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, name')
        .eq('id', user.id)
        .single();

    // If no profile, they might need to complete registration or contact admin.
    // For now, we assume profile exists or redirect to a 'profile-setup' page (not yet implemented)
    if (!profile) {
        // Fallback or error page
        // redirect('/setup-profile'); 
    }

    const role = profile?.role || 'user'; // Default unsafe, but caught by logic

    return (
        <div className={styles.layout}>
            <Sidebar role={role} userEmail={user.email || ''} />
            <main className={styles.main}>
                <div className={styles.content}>
                    {children}
                </div>
            </main>
        </div>
    );
}
