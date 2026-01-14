'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './Topbar.module.css';

interface TopbarProps {
    userEmail: string;
    role: string;
}

export function Topbar({ userEmail, role }: TopbarProps) {
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push('/login');
    };

    const displayRole = role === 'petugas_scan' ? 'PETUGAS ABSEN' : role.replace('_', ' ').toUpperCase();

    return (
        <header className={styles.topbar}>
            <div className={styles.leftSection}>
                <h1 className={styles.logo}>BUDAYA POSITIF</h1>
                <span className={styles.subTitle}>SMPN 32 SBY • {displayRole}</span>
            </div>

            <div className={styles.rightSection}>
                <span className={styles.userEmail}>{userEmail}</span>
                <button onClick={handleLogout} className={styles.exitButton}>
                    <LogOut size={18} />
                    <span>EXIT</span>
                </button>
            </div>
        </header>
    );
}
