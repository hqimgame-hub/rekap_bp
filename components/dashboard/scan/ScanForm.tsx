'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Check, Calendar, Camera, CameraOff } from 'lucide-react';
import styles from './ScanForm.module.css';
import { recordFromQR } from '@/app/dashboard/scan/actions';

// Import Scanner dynamically to reduce bundle size and speed up compilation
const Scanner = dynamic(() => import('./Scanner'), {
    ssr: false,
    loading: () => <div className="h-[250px] flex items-center justify-center bg-slate-100 rounded-2xl animate-pulse text-slate-400 font-bold">Memuat Kamera...</div>
});

interface Aspect {
    id: string;
    name: string;
    type: 'positive' | 'negative' | 'neutral';
    aspect_rules: { id: string; name: string; point: number }[];
}

interface ClassOption {
    id: string;
    name: string;
}

export default function ScanForm({
    aspects,
    classes,
    role,
}: {
    aspects: Aspect[];
    classes: ClassOption[];
    role?: string;
}) {
    const isAutoMode = role === 'petugas_scan';
    const [token, setToken] = useState('');
    const [selectedAspectId, setSelectedAspectId] = useState('');
    const [selectedRuleId, setSelectedRuleId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(isAutoMode); // Auto-start for scan role
    const [scanResult, setScanResult] = useState<any | null>(null);
    const [isContinuous, setIsContinuous] = useState(true);

    const selectedAspect = aspects.find(a => a.id === selectedAspectId);
    const selectedRule = selectedAspect?.aspect_rules.find(r => r.id === selectedRuleId);

    async function onScanSuccess(decodedText: string) {
        if (isLoading) return; // Prevent double scans

        // Prevent scanning while result is being shown
        if (scanResult) return;

        setToken(decodedText);

        if (isAutoMode) {
            // Auto submit for attendance
            await handleAutoAttendance(decodedText);
        } else if (isContinuous && selectedAspectId && selectedRuleId) {
            // Auto submit for specific rule
            await handleManualSubmit(decodedText);
        } else {
            setIsScanning(false);
        }
    }

    const handleAutoAttendance = async (decToken: string) => {
        setIsLoading(true);
        try {
            const result = await recordFromQR(decToken);
            if (result?.success) {
                setScanResult(result);
                setToken('');
                setTimeout(() => setScanResult(null), 3000); // Reset for next scan
            }
        } catch (err: any) {
            alert('Gagal: ' + err.message);
        }
        setIsLoading(false);
    };

    const handleManualSubmit = async (decToken: string) => {
        setIsLoading(true);
        try {
            const result = await recordFromQR(decToken, selectedAspectId, selectedRuleId, date);
            if (result?.success) {
                setScanResult({ success: true, studentName: result.studentName || 'Siswa' });
                setToken('');
                setTimeout(() => setScanResult(null), 2000);
            }
        } catch (err: any) {
            alert('Gagal: ' + err.message);
        }
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        if (isAutoMode) {
            await handleAutoAttendance(token);
        } else {
            if (!selectedAspectId || !selectedRuleId) {
                alert('Lengkapi aspek dan aturan');
                return;
            }
            await handleManualSubmit(token);
        }
    };

    if (isAutoMode) {
        return (
            <div className={styles.container}>
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-slate-800">Scan Absensi Siswa</h2>
                    <p className="text-slate-500 font-medium">Otomatis deteksi keterlambatan</p>
                </div>

                <div className={styles.scannerSection}>
                    {/* Always render scanner, but maybe cover it? */}
                    <div className="relative">
                        <div className={styles.readerContainer}>
                            {isScanning ? (
                                <Scanner onScanSuccess={onScanSuccess} />
                            ) : (
                                <div className="absolute inset-0 bg-slate-100/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
                                    <Button onClick={() => setIsScanning(true)} variant="success" size="lg">
                                        <Camera className="mr-2" /> Buka Kamera
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Overlay Result */}
                        {scanResult && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm rounded-2xl animate-in fade-in duration-200">
                                <div className={`p-8 rounded-3xl border-4 flex flex-col items-center justify-center animate-in zoom-in duration-300 shadow-2xl ${scanResult.isLate ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-emerald-50 border-emerald-400 text-emerald-700'
                                    }`} style={{ width: '100%', height: '100%' }}>
                                    <div className="text-6xl mb-4">{scanResult.isLate ? '⚠️' : '✅'}</div>
                                    <h3 className="text-2xl font-black mb-2 text-center">{scanResult.studentName}</h3>
                                    <p className="text-lg font-bold opacity-80 mb-4 text-center">
                                        {scanResult.isLate
                                            ? `Terlambat ${scanResult.lateMinutes}m (${scanResult.point} Poin)`
                                            : 'Tepat Waktu'}
                                    </p>
                                    <div className="text-xs font-bold bg-white/50 px-4 py-2 rounded-full">
                                        Jam: {scanResult.arrivalTime}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 max-w-sm mx-auto">
                    <label className="block text-sm font-bold text-slate-500 mb-2">Input Manual UUID</label>
                    <div className="flex gap-2">
                        <Input
                            value={token}
                            onChange={e => setToken(e.target.value)}
                            placeholder="Input UUID manual jika kamera error"
                        />
                        <Button type="submit" isLoading={isLoading} disabled={!token}>Simpan</Button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={styles.container}>
            <div className="flex justify-between items-center mb-6">
                <h2 className={styles.title}>Scan QR / Input Manual</h2>
            </div>

            <div className={styles.scannerSection}>
                <div className="flex flex-col items-center gap-4 mb-4">
                    <Button
                        type="button"
                        variant={isScanning ? 'danger' : 'success'}
                        onClick={() => setIsScanning(!isScanning)}
                        className="flex items-center gap-2"
                    >
                        {isScanning ? <><CameraOff size={18} /> Berhenti Scan</> : <><Camera size={18} /> Buka Kamera QR</>}
                    </Button>

                    {scanResult && scanResult.success && (
                        <div className="bg-emerald-100 text-emerald-700 px-6 py-3 rounded-2xl font-black animate-bounce shadow-lg flex items-center gap-2">
                            <Check size={20} /> {scanResult.studentName} Tercatat!
                        </div>
                    )}
                </div>

                {isScanning && (
                    <div className={styles.readerContainer}>
                        <Scanner onScanSuccess={onScanSuccess} />
                    </div>
                )}
            </div>

            <div className={styles.field}>
                <label className={styles.label}>Token ID Siswa (dari QR)</label>
                <Input
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="Hasil scan atau input manual UUID"
                    required
                />
            </div>

            <div className={styles.field}>
                <label className={styles.label}>Aspek</label>
                <div className={styles.aspectGrid}>
                    {aspects.map(a => (
                        <div
                            key={a.id}
                            className={`${styles.aspectBtn} ${selectedAspectId === a.id ? styles.selected : ''}`}
                            onClick={() => {
                                setSelectedAspectId(a.id);
                                setSelectedRuleId('');
                            }}
                        >
                            <div className="font-medium">{a.name}</div>
                            <span className={styles.aspectType}>
                                {a.type === 'positive' ? 'POSITIF' : a.type === 'negative' ? 'NEGATIF' : 'NETRAL'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {selectedAspect && (
                <div className={styles.field}>
                    <label className={styles.label}>Aturan</label>
                    <select
                        className={styles.select}
                        value={selectedRuleId}
                        onChange={e => setSelectedRuleId(e.target.value)}
                        required
                    >
                        <option value="">-- Pilih Aturan --</option>
                        {selectedAspect.aspect_rules.map(r => (
                            <option key={r.id} value={r.id}>
                                {r.name} ({r.point > 0 ? '+' : ''}{r.point} poin)
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {selectedRule && (
                <div className={styles.field}>
                    <label className={styles.label}>Tanggal</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            type="date"
                            className={`${styles.select} pl-10`}
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            required
                        />
                    </div>
                </div>
            )}

            <div className="mt-6 flex justify-end">
                <Button type="submit" size="lg" isLoading={isLoading} variant={selectedAspect?.type === 'positive' ? 'success' : 'danger'}>
                    Simpan Poin
                </Button>
            </div>
        </form>
    );
}
