'use client';

import { Check, AlertTriangle, Clock } from 'lucide-react';

interface ScanResultProps {
    result: {
        success: boolean;
        studentName: string;
        arrivalTime?: string;
        isLate?: boolean;
        lateMinutes?: number;
        point?: number;
    } | null;
    onDismiss: () => void;
}

export default function ScanResult({ result, onDismiss }: ScanResultProps) {
    if (!result) return null;

    const isLate = result.isLate;
    const isSuccess = result.success;

    return (
        <div
            className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onDismiss}
        >
            <div
                className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl transform transition-all animate-in zoom-in-95 duration-200 ${isLate
                        ? 'bg-amber-50 border-4 border-amber-400'
                        : 'bg-emerald-50 border-4 border-emerald-400'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col items-center text-center">
                    <div className={`p-4 rounded-full mb-4 ${isLate ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                        {isLate ? <AlertTriangle size={48} strokeWidth={2.5} /> : <Check size={48} strokeWidth={3} />}
                    </div>

                    <h2 className={`text-2xl font-black mb-1 ${isLate ? 'text-amber-900' : 'text-emerald-900'
                        }`}>
                        {result.studentName}
                    </h2>

                    <div className={`text-lg font-bold mb-4 ${isLate ? 'text-amber-700/80' : 'text-emerald-700/80'
                        }`}>
                        {isLate ? 'Terlambat Masuk' : 'Berhasil Presensi'}
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full mb-4">
                        <div className="bg-white/60 p-3 rounded-xl">
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Poin</div>
                            <div className={`text-xl font-black ${(result.point || 0) < 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                {result.point ? (result.point > 0 ? `+${result.point}` : result.point) : '0'}
                            </div>
                        </div>
                        <div className="bg-white/60 p-3 rounded-xl">
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Waktu</div>
                            <div className="text-xl font-black text-slate-700">
                                {result.arrivalTime || '--:--'}
                            </div>
                        </div>
                    </div>

                    {isLate && (
                        <div className="w-full bg-red-100/50 text-red-700 px-4 py-2 rounded-lg text-sm font-medium mb-4 flex items-center justify-center gap-2">
                            <Clock size={16} />
                            Terlambat {result.lateMinutes} Menit
                        </div>
                    )}

                    <button
                        onClick={onDismiss}
                        className={`w-full py-3 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-transform ${isLate ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'
                            }`}
                    >
                        Scan Berikutnya
                    </button>
                </div>
            </div>
        </div>
    );
}
