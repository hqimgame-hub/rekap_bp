'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import styles from './Settings.module.css';
import { updateAllSettings, deleteData } from './actions';

interface Setting {
    key: string;
    value: string;
    description: string;
}

export default function SettingsClient({ initialSettings }: { initialSettings: Setting[] }) {
    const [settings, setSettings] = useState<Record<string, string>>(
        initialSettings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {})
    );
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            await updateAllSettings(settings);
            setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Gagal menyimpan: ' + err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Pengaturan Sekolah</h1>

            <form onSubmit={handleSubmit}>
                <div className={styles.settingsGrid}>
                    <div className={styles.settingCard}>
                        <h3 className="font-bold mb-4 text-slate-700">Waktu Kedatangan</h3>
                        <div className="space-y-4">
                            <div>
                                <label className={styles.label}>Jam Masuk Sekolah</label>
                                <p className={styles.description}>Batas waktu siswa dianggap tepat waktu.</p>
                                <Input
                                    type="time"
                                    value={settings.school_start_time || '07:30'}
                                    onChange={(e) => handleChange('school_start_time', e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.settingCard}>
                        <h3 className="font-bold mb-4 text-slate-700">Penalti Keterlambatan</h3>
                        <div className="space-y-4">
                            <div>
                                <label className={styles.label}>Interval Menit</label>
                                <p className={styles.description}>Tiap kelipatan menit ini, poin akan dikurangi.</p>
                                <Input
                                    type="number"
                                    value={settings.late_penalty_minutes || '5'}
                                    onChange={(e) => handleChange('late_penalty_minutes', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className={styles.label}>Poin Denda</label>
                                <p className={styles.description}>Jumlah poin yang dikurangi tiap interval.</p>
                                <Input
                                    type="number"
                                    value={settings.late_penalty_points || '-1'}
                                    onChange={(e) => handleChange('late_penalty_points', e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <Button type="submit" size="lg" isLoading={isLoading}>
                        Simpan Perubahan
                    </Button>
                </div>
            </form>

            <DeleteDataSection onSuccess={(text) => {
                setMessage({ type: 'success', text });
                setTimeout(() => setMessage(null), 3000);
            }} />

            {message && (
                <div style={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    padding: '1rem',
                    background: message.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    zIndex: 50,
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    {message.text}
                </div>
            )}
        </div>
    );
}

function DeleteDataSection({ onSuccess }: { onSuccess: (msg: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [dataType, setDataType] = useState<'all' | 'attendance' | 'violations'>('attendance');
    const [dateRange, setDateRange] = useState('month'); // month, all, custom
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (confirmText !== 'DELETE') return;
        setIsDeleting(true);
        try {
            // Determine dates
            let start = undefined;
            let end = undefined;

            if (dateRange === 'month') {
                const now = new Date();
                // Start of month
                const startObj = new Date(now.getFullYear(), now.getMonth(), 1);
                // Adjust for timezone offset if strictly needed, but ISO string usually fine for 'YYYY-MM-DD' comparison if DB stores date only.
                // However, our DB stores `input_date` as DATE (likely).
                // So ISO string YYYY-MM-DDT... matches.
                start = startObj.toISOString().split('T')[0];

                const endObj = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                end = endObj.toISOString().split('T')[0];
            } else if (dateRange === 'custom') {
                start = startDate;
                end = endDate;
            }

            const res = await deleteData(dataType, start, end);
            if (res.success) {
                onSuccess(`Berhasil menghapus ${res.count ?? 'beberapa'} data.`);
                setIsOpen(false);
                setConfirmText('');
            }
        } catch (error: any) {
            alert('Gagal menghapus: ' + error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className={styles.dangerCard}>
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Danger Zone</h3>
                    <p className="text-slate-500 text-sm">Hapus data lama secara permanen</p>
                </div>
            </div>

            <div className="p-4 bg-white border border-rose-100 rounded-xl shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className={styles.label}>Jenis Data yang Dihapus</label>
                        <select
                            className={styles.select}
                            value={dataType}
                            onChange={(e) => setDataType(e.target.value as any)}
                        >
                            <option value="attendance">Hanya Absensi</option>
                            <option value="violations">Hanya Pelanggaran</option>
                            <option value="all">SEMUA DATA (Reset Total)</option>
                        </select>
                    </div>
                    <div>
                        <label className={styles.label}>Rentang Waktu</label>
                        <select
                            className={styles.select}
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                        >
                            <option value="month">Bulan Ini Saja</option>
                            <option value="all">Semua Waktu (Dari Awal)</option>
                            <option value="custom">Pilih Tanggal Manual...</option>
                        </select>
                    </div>
                </div>

                {dateRange === 'custom' && (
                    <div className="grid grid-cols-2 gap-4 mb-6 animate-in fade-in slide-in-from-top-2 p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div>
                            <label className={styles.label}>Dari Tanggal</label>
                            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div>
                            <label className={styles.label}>Sampai Tanggal</label>
                            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                    </div>
                )}

                {!isOpen ? (
                    <div className="flex justify-end">
                        <Button variant="danger" type="button" onClick={() => setIsOpen(true)}>
                            Mulai Penghapusan
                        </Button>
                    </div>
                ) : (
                    <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 animate-in zoom-in-95 duration-200">
                        <h4 className="font-bold text-rose-800 mb-2 flex items-center gap-2">
                            ⚠️ Konfirmasi Terakhir
                        </h4>
                        <p className="text-sm text-rose-700 mb-4 leading-relaxed">
                            Tindakan ini <strong>TIDAK DAPAT DIBATALKAN</strong>. <br />
                            Ketik kata <strong>DELETE</strong> di bawah ini untuk mengonfirmasi penghapusan data secara permanen.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Input
                                placeholder="Ketik DELETE di sini..."
                                value={confirmText}
                                onChange={e => setConfirmText(e.target.value)}
                                className="bg-white border-rose-300 focus:border-rose-500 focus:ring-rose-200"
                            />
                            <div className="flex gap-2">
                                <Button
                                    variant="danger"
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={confirmText !== 'DELETE' || isDeleting}
                                >
                                    {isDeleting ? 'Menghapus...' : 'HAPUS SEKARANG'}
                                </Button>
                                <Button
                                    variant="secondary"
                                    type="button"
                                    onClick={() => { setIsOpen(false); setConfirmText(''); }}
                                    disabled={isDeleting}
                                >
                                    Batal
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
