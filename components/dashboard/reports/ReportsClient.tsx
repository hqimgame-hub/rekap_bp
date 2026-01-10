'use client';

import { useState, useEffect, useCallback } from 'react';
import { getRecords, RecordsFilter } from '@/app/dashboard/reports/actions';
import { Button } from '@/components/ui/Button';
import { FileText, Filter, Download } from 'lucide-react';
import styles from './ReportsClient.module.css';

interface ClassOption {
    id: string;
    name: string;
}

interface Record {
    id: string;
    point: number;
    input_date: string;
    created_at: string;
    student: { id: string; name: string; gender: string; nisn?: string | null };
    class: { id: string; name: string };
    aspect: { id: string; name: string; type: string };
    rule: { id: string; name: string };
}

export default function ReportsClient({ classes }: { classes: ClassOption[] }) {
    const [records, setRecords] = useState<Record[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]); // Default today
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [classId, setClassId] = useState('');
    const [type, setType] = useState<string>('');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const filter: RecordsFilter = {
                startDate,
                endDate,
                classId: classId || undefined,
                type: type as any || undefined
            };
            const data = await getRecords(filter);
            setRecords(data as any || []);
        } catch (error) {
            console.error(error);
            alert('Gagal mengambil data laporan');
        }
        setIsLoading(false);
    }, [startDate, endDate, classId, type]);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Stats Calculation
    const stats = records.reduce((acc, curr) => {
        if (curr.point > 0) acc.positive += curr.point;
        else acc.negative += curr.point;
        return acc;
    }, { positive: 0, negative: 0 });

    const netScore = stats.positive + stats.negative;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Rekapitulasi Budaya Positif</h1>
                    <p className={styles.subtitle}>Laporan pelanggaran dan prestasi siswa</p>
                </div>
                {/* Export buttons */}
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" disabled title="Coming Soon">
                        <Download size={16} /> Export Excel
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={!classId}
                        onClick={async () => {
                            if (!classId) {
                                alert('Pilih kelas terlebih dahulu untuk export PDF');
                                return;
                            }
                            const params = new URLSearchParams({
                                classId,
                                startDate,
                                endDate,
                                ...(type && { type })
                            });
                            try {
                                const res = await fetch(`/api/reports/export-pdf?${params.toString()}`);
                                if (!res.ok) throw new Error('Gagal mengunduh PDF');
                                const blob = await res.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `Laporan_Poin_Kelas_${classId}.pdf`;
                                a.click();
                                window.URL.revokeObjectURL(url);
                            } catch (e: any) {
                                console.error(e);
                                alert(e.message);
                            }
                        }}
                    >
                        <Download size={16} /> Export PDF
                    </Button>
                </div>
            </div>

            {/* Filter Section */}
            <div className={styles.filterCard}>
                <div className={styles.filterGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Tanggal Mulai</label>
                        <input
                            type="date"
                            className={styles.input}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Tanggal Akhir</label>
                        <input
                            type="date"
                            className={styles.input}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Kelas</label>
                        <select
                            className={styles.select}
                            value={classId}
                            onChange={(e) => setClassId(e.target.value)}
                        >
                            <option value="">Semua Kelas</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Tipe</label>
                        <select
                            className={styles.select}
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="">Semua Tipe</option>
                            <option value="positive">Positif (+)</option>
                            <option value="negative">Negatif (-)</option>
                        </select>
                    </div>
                    <div>
                        <Button onClick={fetchData} isLoading={isLoading} size="sm">
                            <Filter size={16} /> Terapkan Filter
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total Poin Positif</div>
                    <div className={`${styles.statValue} ${styles.statPositive}`}>
                        +{stats.positive}
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total Poin Negatif</div>
                    <div className={`${styles.statValue} ${styles.statNegative}`}>
                        {stats.negative}
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Net Skor Periode Ini</div>
                    <div className={`${styles.statValue} ${netScore >= 0 ? styles.statPositive : styles.statNegative}`}>
                        {netScore > 0 ? '+' : ''}{netScore}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className={styles.tableContainer}>
                {records.length > 0 ? (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>NISN</th>
                                <th>Nama Siswa</th>
                                <th>Kelas</th>
                                <th>Aspek</th>
                                <th>Perilaku</th>
                                <th className="text-right">Poin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((record) => (
                                <tr key={record.id}>
                                    <td>
                                        {new Date(record.input_date).toLocaleDateString('id-ID', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </td>
                                    <td>{record.student.nisn || '-'}</td>
                                    <td>{record.student.name}</td>
                                    <td>{record.class.name}</td>
                                    <td>
                                        <span className={`${styles.badge} ${record.aspect.type === 'positive' ? styles.badgePositive :
                                            record.aspect.type === 'negative' ? styles.badgeNegative : styles.badgeNeutral
                                            }`}>
                                            {record.aspect.name}
                                        </span>
                                    </td>
                                    <td>{record.rule.name}</td>
                                    <td className={`text-right font-bold ${record.point > 0 ? 'text-emerald-600' : 'text-red-600'
                                        }`}>
                                        {record.point > 0 ? '+' : ''}{record.point}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className={styles.emptyState}>
                        {isLoading ? 'Memuat data...' : 'Tidak ada data laporan untuk filter ini.'}
                    </div>
                )}
            </div>
        </div>
    );
}
