'use client';

import { Card } from '@/components/ui/Card';
import * as XLSX from 'xlsx';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function AdminDashboard({ stats, role }: { stats: any, role?: string }) {
    const maxViolation = Math.max(...(stats?.violationByAspect?.map((a: any) => a.points) || [1]));

    const handleExportRankings = () => {
        const positiveData = stats?.topClassesPositive?.map((item: any, i: number) => ({
            'Ranking': i + 1,
            'Nama Kelas': item.name,
            'Total Poin': item.points
        })) || [];

        const negativeData = stats?.topClassesNegative?.map((item: any, i: number) => ({
            'Ranking': i + 1,
            'Nama Kelas': item.name,
            'Total Poin Pelanggaran': item.points
        })) || [];

        const wb = XLSX.utils.book_new();

        const wsPositive = XLSX.utils.json_to_sheet(positiveData);
        XLSX.utils.book_append_sheet(wb, wsPositive, 'Top 5 Positif');

        const wsNegative = XLSX.utils.json_to_sheet(negativeData);
        XLSX.utils.book_append_sheet(wb, wsNegative, 'Top 5 Negatif');

        XLSX.writeFile(wb, `Ranking_Kelas_SMPN32SBY_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div style={{ paddingBottom: '2rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>
                    {role === 'kepsek' ? 'Monitoring Budaya Positif' : 'Admin Dashboard'}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Button
                        variant="success"
                        size="sm"
                        onClick={handleExportRankings}
                        className="flex items-center gap-2"
                    >
                        <FileDown size={16} /> Ekspor Ranking
                    </Button>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', background: '#f1f5f9', padding: '4px 12px', borderRadius: '100px' }}>
                        Real-time Data Active
                    </div>
                </div>
            </div>

            {/* Compact Summary Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                {[
                    { title: 'Total Siswa', value: stats?.totalStudents, icon: '👥', color: '#3b82f6' },
                    { title: 'Total Kelas', value: stats?.totalClasses, icon: '🏫', color: '#8b5cf6' },
                    { title: 'Positif (Hari Ini)', value: stats?.pointsToday, icon: '📈', color: '#10b981' },
                    { title: 'Negatif (Hari Ini)', value: stats?.negativePointsToday, icon: '📉', color: '#ef4444' }
                ].map((card, i) => (
                    <div key={i} style={{
                        background: 'white',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div style={{ fontSize: '1.5rem' }}>{card.icon}</div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>{card.title}</p>
                            <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#1e293b' }}>{card.value || 0}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                {/* 1. Perbandingan Pelanggaran (Graph) */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', gridColumn: 'span 1' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.5rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📊 Perbandingan Pelanggaran by Aspek
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
                                            borderRadius: '4px',
                                            transition: 'width 1s ease-out'
                                        }} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '20px 0' }}>Belum ada data pelanggaran</p>
                        )}
                    </div>
                </div>

                {/* 2. Top Classes (Positive) */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🏆 5 Kelas Poin Terbanyak
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {stats?.topClassesPositive?.length > 0 ? (
                            stats.topClassesPositive.map((item: any, i: number) => (
                                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 4 ? '1px solid #f8fafc' : 'none' }}>
                                    <span style={{ fontWeight: '500', color: '#475569' }}>{i + 1}. {item.name}</span>
                                    <span style={{ fontWeight: '700', color: '#10b981', background: '#ecfdf5', padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem' }}>{item.points} Pts</span>
                                </li>
                            ))
                        ) : (
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '20px 0' }}>Belum ada data</p>
                        )}
                    </ul>
                </div>

                {/* 3. Bottom Classes (Negative) */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📉 5 Kelas Poin Tersedikit
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {stats?.topClassesNegative?.length > 0 ? (
                            stats.topClassesNegative.map((item: any, i: number) => (
                                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 4 ? '1px solid #f8fafc' : 'none' }}>
                                    <span style={{ fontWeight: '500', color: '#475569' }}>{i + 1}. {item.name}</span>
                                    <span style={{ fontWeight: '700', color: '#ef4444', background: '#fef2f2', padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem' }}>{item.points} Pts</span>
                                </li>
                            ))
                        ) : (
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '20px 0' }}>Belum ada data</p>
                        )}
                    </ul>
                </div>

                {/* 4. Top Students (Positive) */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        ⭐ 5 Siswa Poin Terbanyak
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {stats?.topStudentsPositive?.length > 0 ? (
                            stats.topStudentsPositive.map((item: any, i: number) => (
                                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 4 ? '1px solid #f8fafc' : 'none' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '600', color: '#475569', fontSize: '0.875rem' }}>{item.name}</span>
                                    </div>
                                    <span style={{ fontWeight: '700', color: '#10b981', alignSelf: 'center' }}>+{item.points}</span>
                                </li>
                            ))
                        ) : (
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '20px 0' }}>Belum ada data</p>
                        )}
                    </ul>
                </div>

                {/* 5. Top Students (Negative) */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        ⚠️ 5 Siswa Poin Tersedikit
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {stats?.topStudentsNegative?.length > 0 ? (
                            stats.topStudentsNegative.map((item: any, i: number) => (
                                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 4 ? '1px solid #f8fafc' : 'none' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '600', color: '#475569', fontSize: '0.875rem' }}>{item.name}</span>
                                    </div>
                                    <span style={{ fontWeight: '700', color: '#ef4444', alignSelf: 'center' }}>{item.points}</span>
                                </li>
                            ))
                        ) : (
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '20px 0' }}>Belum ada data</p>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
