import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { Card } from '@/components/ui/Card';
import { getDashboardStats } from './actions';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, name, class:classes(name)')
        .eq('id', user.id)
        .single();

    if (!profile) return null;

    const role = profile?.role;
    console.log('[DashboardPage] User:', user.id, 'Role:', role);

    if (role === 'petugas' || role === 'petugas_scan') {
        console.log('[DashboardPage] Server redirect to /dashboard/scan');
        redirect('/dashboard/scan');
    }

    if (role === 'petugas_input') {
        redirect('/dashboard/records');
    }

    const stats = await getDashboardStats();

    if (role === 'admin' || role === 'kepsek') {
        return <AdminDashboard stats={stats} role={role} />;
    }

    if (role === 'walas') {
        const maxViolation = Math.max(...(stats?.violationByAspect?.map((a: any) => a.points) || [1]));

        return (
            <div style={{ paddingBottom: '2rem' }}>
                <h1 className="text-2xl font-black mb-1">Dashboard Wali Kelas</h1>
                <p className="text-slate-500 font-medium mb-6">Selamat datang, {profile.name} (Wali Kelas {(profile as any).class?.name || '-'})</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <Card title="Siswa di Kelas" className="border-l-4 border-l-blue-500">
                        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                            {stats?.totalStudents || 0}
                        </p>
                    </Card>
                    <Card title="Catatan Positif (Hari Ini)" className="border-l-4 border-l-emerald-500">
                        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981', margin: '0.5rem 0' }}>
                            {stats?.pointsToday || 0}
                        </p>
                    </Card>
                    <Card title="Pelanggaran (Hari Ini)" className="border-l-4 border-l-rose-500">
                        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444', margin: '0.5rem 0' }}>
                            {stats?.negativePointsToday || 0}
                        </p>
                    </Card>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                    {/* Top Violations in Class */}
                    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.5rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📊 Top Pelanggaran di Kelas
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {stats?.violationByAspect?.length > 0 ? (
                                stats.violationByAspect.map((item: any, i: number) => (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8125rem' }}>
                                            <span style={{ fontWeight: '600', color: '#475569' }}>{item.name}</span>
                                            <span style={{ fontWeight: '700', color: '#ef4444' }}>{item.points} Poin</span>
                                        </div>
                                        <div style={{ height: '8px', background: '#f8fafc', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${(item.points / maxViolation) * 100}%`,
                                                background: 'linear-gradient(90deg, #ef4444, #f87171)',
                                                borderRadius: '4px'
                                            }} />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '20px 0' }}>Belum ada data pelanggaran</p>
                            )}
                        </div>
                    </div>

                    {/* Top Students with Violations */}
                    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            ⚠️ Siswa dengan Pelanggaran Terbanyak
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {stats?.topStudentsNegative?.length > 0 ? (
                                stats.topStudentsNegative.map((item: any, i: number) => (
                                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 4 ? '1px solid #f8fafc' : 'none' }}>
                                        <span style={{ fontWeight: '600', color: '#475569', fontSize: '0.875rem' }}>{item.name}</span>
                                        <span style={{ fontWeight: '700', color: '#ef4444' }}>{item.points} Poin</span>
                                    </li>
                                ))
                            ) : (
                                <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '20px 0' }}>Data tidak tersedia</p>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1>Selamat Datang, {profile?.name || role}</h1>
            <Card>
                <p>Anda berhasil login. Menu tersedia di sidebar.</p>
            </Card>
        </div>
    );
}
