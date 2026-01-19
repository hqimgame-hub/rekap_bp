'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    ClipboardList,
    QrCode,
    LogOut,
    Menu,
    X,
    FileText,
    Settings,
    UserCog
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './Sidebar.module.css';

type Role = 'admin' | 'kepsek' | 'walas' | 'petugas_input' | 'petugas_scan' | 'petugas';

interface SidebarProps {
    role: Role;
    userEmail: string;
}

export function Sidebar({ role, userEmail }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push('/login');
    };

    const menuItems = [
        {
            label: 'Dashboard',
            href: '/dashboard',
            icon: LayoutDashboard,
            roles: ['admin', 'kepsek', 'walas', 'petugas_input', 'petugas_scan', 'petugas']
        },
        {
            label: 'Data Kelas',
            href: '/dashboard/classes',
            icon: GraduationCap,
            roles: ['admin']
        },
        {
            label: 'Data Siswa',
            href: '/dashboard/students',
            icon: Users,
            roles: ['admin', 'walas']
        },
        {
            label: 'Aspek & Poin',
            href: '/dashboard/aspects',
            icon: ClipboardList,
            roles: ['admin']
        },
        {
            label: 'Catat Poin',
            href: '/dashboard/records',
            icon: ClipboardList,
            roles: ['admin', 'petugas_input']
        },
        {
            label: 'Scan QR',
            href: '/dashboard/scan',
            icon: QrCode,
            roles: ['admin', 'petugas_scan', 'petugas']
        },
        {
            label: 'Rekap & Laporan',
            href: '/dashboard/reports',
            icon: FileText,
            roles: ['admin', 'kepsek', 'walas']
        },
        {
            label: 'Manajemen Pengguna',
            href: '/dashboard/users',
            icon: UserCog,
            roles: ['admin']
        },
        {
            label: 'Pengaturan Sekolah',
            href: '/dashboard/settings',
            icon: Settings,
            roles: ['admin']
        }
    ];

    const filteredMenu = menuItems.filter(item => item.roles.includes(role));

    return (
        <>
            <button
                className={styles.mobileToggle}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle Menu"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                <div className={styles.header}>
                    <div className={styles.logo}>Budaya Positif</div>
                    <div className={styles.schoolName}>SMPN 32 SBY</div>
                    <div className={styles.roleBadge}>
                        {role === 'kepsek' ? 'HALAMAN MONITORING' : role.toUpperCase().replace('_', ' ')}
                    </div>
                </div>

                <nav className={styles.nav}>
                    {filteredMenu.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                                onClick={() => setIsOpen(false)}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.footer}>
                    <div className={styles.userInfo}>
                        <span className={styles.userEmail}>{userEmail}</span>
                    </div>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        <LogOut size={20} />
                        <span>Keluar</span>
                    </button>
                    <div className={styles.copyright}>
                        © 2026 SMPN 32 SBY
                    </div>
                </div>
            </aside>

            {isOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
