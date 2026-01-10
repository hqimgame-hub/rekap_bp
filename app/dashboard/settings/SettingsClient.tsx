'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import styles from './Settings.module.css';
import { updateAllSettings } from './actions';

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
                    {message && (
                        <div className={`mr-4 self-center font-medium ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {message.text}
                        </div>
                    )}
                    <Button type="submit" size="lg" isLoading={isLoading}>
                        Simpan Perubahan
                    </Button>
                </div>
            </form>
        </div>
    );
}
