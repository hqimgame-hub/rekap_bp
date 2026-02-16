'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { getStudentHistory } from '@/app/dashboard/students/actions';
import { Loader2, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';

interface StudentHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    studentName: string;
}

interface HistoryRecord {
    id: string;
    point: number;
    notes?: string;
    input_date: string;
    created_at: string;
    aspect: { name: string; type: string };
    rule: { name: string };
}

export function StudentHistoryModal({ isOpen, onClose, studentId, studentName }: StudentHistoryModalProps) {
    const [records, setRecords] = useState<HistoryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen && studentId) {
            fetchHistory();
        }
    }, [isOpen, studentId]);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const data = await getStudentHistory(studentId);
            setRecords(data as any || []);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate Stats
    const stats = records.reduce((acc, curr) => {
        if (curr.point > 0) acc.positive += curr.point;
        else acc.negative += curr.point;
        return acc;
    }, { positive: 0, negative: 0 });

    const netScore = stats.positive + stats.negative;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Riwayat Poin: ${studentName}`}
        >
            <div className="space-y-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-center">
                        <div className="text-xs text-emerald-600 font-medium uppercase mb-1 flex items-center justify-center gap-1">
                            <TrendingUp size={14} /> Positif
                        </div>
                        <div className="text-xl font-bold text-emerald-700">+{stats.positive}</div>
                    </div>
                    <div className="bg-rose-50 p-3 rounded-lg border border-rose-100 text-center">
                        <div className="text-xs text-rose-600 font-medium uppercase mb-1 flex items-center justify-center gap-1">
                            <TrendingDown size={14} /> Negatif
                        </div>
                        <div className="text-xl font-bold text-rose-700">{stats.negative}</div>
                    </div>
                    <div className={`p-3 rounded-lg border text-center ${netScore >= 0 ? 'bg-slate-50 border-slate-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="text-xs text-slate-500 font-medium uppercase mb-1 flex items-center justify-center gap-1">
                            <Minus size={14} /> Total
                        </div>
                        <div className={`text-xl font-bold ${netScore >= 0 ? 'text-slate-800' : 'text-red-700'}`}>
                            {netScore > 0 ? '+' : ''}{netScore}
                        </div>
                    </div>
                </div>

                {/* Timeline / List */}
                <div className="max-h-[60vh] overflow-y-auto pr-2">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin text-slate-400" size={24} />
                        </div>
                    ) : records.length > 0 ? (
                        <div className="relative border-l border-slate-200 ml-3 space-y-6">
                            {records.map((record) => (
                                <div key={record.id} className="relative pl-6">
                                    {/* Timeline Dot */}
                                    <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white box-content ${record.point > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                                        }`} />

                                    {/* Date Header */}
                                    <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(record.input_date).toLocaleDateString('id-ID', {
                                            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                        <span className="text-slate-300">•</span>
                                        <span className={`font-mono font-bold ${record.point > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {record.point > 0 ? '+' : ''}{record.point} Poin
                                        </span>
                                    </div>

                                    {/* Card */}
                                    <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm hover:border-slate-300 transition-colors">
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-800 mb-0.5">
                                                    {record.rule?.name || record.aspect.name}
                                                </h4>
                                                <p className="text-xs text-slate-500 line-clamp-2">
                                                    {record.notes || '-'}
                                                </p>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${record.aspect.type === 'positive'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                {record.aspect.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-lg">
                            <p className="text-sm">Belum ada riwayat poin.</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
