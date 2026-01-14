'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Calendar, Camera, X } from 'lucide-react';
import { recordFromQR } from '@/app/dashboard/scan/actions';
import FloatingScanResult from './FloatingScanResult';

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

interface ScanManagerProps {
    aspects: Aspect[];
    classes: ClassOption[];
    role?: string;
}

export default function ScanManager({ aspects, classes, role }: ScanManagerProps) {
    const isAutoMode = role === 'petugas_scan';
    const scannerId = "reader-container-inline";

    // State
    const [isScanning, setIsScanning] = useState(false);
    const [manualToken, setManualToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastScanResult, setLastScanResult] = useState<any | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);

    // Manual Mode State
    const [selectedAspectId, setSelectedAspectId] = useState('');
    const [selectedRuleId, setSelectedRuleId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Refs for Scanner
    const scannerRef = useRef<any>(null); // Use any type to avoid import issues

    // Computed
    const selectedAspect = aspects.find(a => a.id === selectedAspectId);

    // Auto-start scanner for scan role
    useEffect(() => {
        if (isAutoMode) {
            setIsScanning(true);
        }
    }, [isAutoMode]);

    // Function to handle successful scan
    const handleScanProcess = useCallback(async (token: string) => {
        if (isLoading) return;
        if (lastScanResult) return; // Wait for user to dismiss
        if (!isAutoMode && (!selectedAspectId || !selectedRuleId)) {
            if (!selectedAspectId) {
                alert('Pilih aspek terlebih dahulu!');
                return;
            }
        }

        setIsLoading(true);
        try {
            console.log('[ScanManager] Processing:', token);

            const aspectToUse = isAutoMode ? undefined : selectedAspectId;
            const ruleToUse = isAutoMode ? undefined : selectedRuleId;
            const dateToUse = isAutoMode ? undefined : date;

            const result = await recordFromQR(token, aspectToUse, ruleToUse, dateToUse);

            if (result && result.success) {
                setLastScanResult(result);
                setManualToken('');

                // Auto dismiss after 3s
                setTimeout(() => {
                    setLastScanResult((prev: any) => {
                        return prev === result ? null : prev;
                    });
                }, 3000);
            }
        } catch (err: any) {
            console.error('[ScanManager] Error:', err);
            alert(`Gagal: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, lastScanResult, isAutoMode, selectedAspectId, selectedRuleId, date]);


    // Scanner Initialization Effect
    useEffect(() => {
        if (!isScanning) {
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear().catch((e: any) => console.warn('[ScanManager] Clear error', e));
                } catch (e) { }
                scannerRef.current = null;
            }
            return;
        }

        let isMounted = true;
        let initTimeout: NodeJS.Timeout;

        const initScanner = async () => {
            // Check if element exists
            const element = document.getElementById(scannerId);
            if (!element) {
                if (isMounted) initTimeout = setTimeout(initScanner, 200);
                return;
            }

            try {
                // Dynamic import logic inside effect to prevent SSR issues and improve load time
                const { Html5QrcodeScanner, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

                if (!isMounted) return;

                // Cleanup existing before creating new
                if (scannerRef.current) {
                    try {
                        await scannerRef.current.clear();
                    } catch (e) { }
                    scannerRef.current = null;
                }

                const scanner = new Html5QrcodeScanner(
                    scannerId,
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                        showTorchButtonIfSupported: true,
                        rememberLastUsedCamera: true,
                        supportedScanTypes: [0], // SCAN_TYPE_CAMERA
                        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
                    },
                    /* verbose= */ false
                );

                scannerRef.current = scanner;

                scanner.render(
                    (decodedText) => {
                        if (isMounted) handleScanProcess(decodedText);
                    },
                    (errorMessage) => {
                        // ignore noise
                    }
                );
            } catch (err: any) {
                console.error('[ScanManager] Init error:', err);
                if (isMounted) setScanError(err.message || 'Gagal memulai kamera');
            }
        };

        // Delay to ensure DOM update is finished
        initTimeout = setTimeout(initScanner, 300);

        return () => {
            isMounted = false;
            clearTimeout(initTimeout);
            if (scannerRef.current) {
                const scannerToClear = scannerRef.current;
                scannerRef.current = null;
                scannerToClear.clear().catch((e: any) => console.warn('[ScanManager] Unmount cleanup error', e));
            }
        };
    }, [isScanning, handleScanProcess]);

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualToken) return;
        handleScanProcess(manualToken);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Floating Result Display */}
            {lastScanResult && (
                <FloatingScanResult result={lastScanResult} onDismiss={() => setLastScanResult(null)} />
            )}

            {/* Header */}
            <div className="text-center">
                <h1 className="text-2xl font-black text-slate-800">
                    {isAutoMode ? 'Scan Presensi' : 'Input Poin Pelanggaran/Prestasi'}
                </h1>
                <p className="text-slate-500 font-medium">
                    {isAutoMode
                        ? 'Scan QR siswa untuk mencatat kehadiran otomatis'
                        : 'Pilih aspek, aturan, lalu scan atau input manual'
                    }
                </p>
            </div>

            {/* Manual Mode Selection UI */}
            {!isAutoMode && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                    {/* Aspect Selection */}
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Pilih Aspek</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {aspects.map(aspect => (
                                <button
                                    key={aspect.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedAspectId(aspect.id);
                                        setSelectedRuleId('');
                                    }}
                                    className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all ${selectedAspectId === aspect.id
                                        ? aspect.type === 'positive'
                                            ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                                            : aspect.type === 'negative'
                                                ? 'bg-red-100 border-red-400 text-red-700'
                                                : 'bg-blue-100 border-blue-400 text-blue-700'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    {aspect.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rule Selection */}
                    {selectedAspect && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="block text-sm font-bold text-slate-600 mb-2">Pilih Aturan</label>
                            <select
                                value={selectedRuleId}
                                onChange={(e) => setSelectedRuleId(e.target.value)}
                                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">-- Pilih Pelanggaran/Prestasi --</option>
                                {selectedAspect.aspect_rules.map(rule => (
                                    <option key={rule.id} value={rule.id}>
                                        {rule.name} ({rule.point > 0 ? '+' : ''}{rule.point} Poin)
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Date Picker */}
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Tanggal</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full pl-10 p-2.5 rounded-xl border border-slate-300 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Scanner Section */}
            <div className="relative bg-white rounded-3xl shadow-lg border-4 border-white overflow-hidden ring-1 ring-slate-200 min-h-[300px]">

                {/* Result Overlay (Replaced by Floating Component outside this container, but state is handled here) */}
                {/* Floating Result is placed at the top level */}

                {/* Error State */}
                {scanError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-red-50 text-red-600 z-10">
                        <p className="font-bold mb-2">Error Kamera</p>
                        <p className="text-sm mb-4">{scanError}</p>
                        <Button variant="danger" size="sm" onClick={() => window.location.reload()}>
                            Reload Halaman
                        </Button>
                    </div>
                )}

                {/* Scanner Content */}
                {isScanning ? (
                    <div className="relative w-full h-full bg-slate-100">
                        {/* ID must match the one used in Html5QrcodeScanner */}
                        <div id={scannerId} className="w-full h-full"></div>
                        <style jsx global>{`
                            #reader-container-inline video {
                                object-fit: cover;
                                border-radius: 0.75rem;
                                width: 100% !important;
                            }
                            #reader-container-inline__scan_region {
                                background: transparent !important;
                            }
                            #reader-container-inline__dashboard_section_csr button {
                                background-color: white;
                                border: 1px solid #e2e8f0;
                                border-radius: 0.5rem;
                                padding: 0.25rem 0.75rem;
                                font-size: 0.875rem;
                                margin-bottom: 0.5rem;
                            }
                        `}</style>

                        <button
                            onClick={() => setIsScanning(false)}
                            className="absolute top-4 right-4 bg-white/80 p-2 rounded-full shadow-lg hover:bg-white transition-colors z-10"
                        >
                            <X size={20} className="text-slate-600" />
                        </button>
                    </div>
                ) : (
                    <div className="h-[300px] flex flex-col items-center justify-center bg-slate-100 p-6 text-center">
                        <div className="bg-slate-200 p-4 rounded-full mb-4">
                            <Camera size={48} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-2">Kamera Nonaktif</h3>
                        <Button onClick={() => setIsScanning(true)} variant="primary">
                            Buka Kamera
                        </Button>
                    </div>
                )}
            </div>

            {/* Manual Input Footer */}
            <form onSubmit={handleManualSubmit} className="flex gap-2 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                <Input
                    placeholder="Input UUID Siswa Manual..."
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    className="flex-1"
                />
                <Button
                    type="submit"
                    isLoading={isLoading}
                    disabled={!manualToken || (!isAutoMode && (!selectedAspectId || !selectedRuleId))}
                    variant="primary"
                >
                    Simpan
                </Button>
            </form>

        </div>
    );
}
