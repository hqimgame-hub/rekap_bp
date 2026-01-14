'use client';

import { useState, useEffect } from 'react';
import { Search, Clock, Users, ChevronDown, User, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getStudentsForInput, recordManualAttendance } from '@/app/dashboard/scan/actions';
import FloatingScanResult from './FloatingScanResult';
import styles from './ManualInputForm.module.css';

interface Student {
    id: string;
    name: string;
    nisn: string | null;
    class_id: string;
    class: { name: string } | null;
}

interface ManualInputFormProps {
    classes: { id: string; name: string }[];
}

import TimeInputModal from './TimeInputModal';

export default function ManualInputForm({ classes }: ManualInputFormProps) {
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingStudents, setIsFetchingStudents] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const [isClient, setIsClient] = useState(false);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStudents();
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedClass]);

    const fetchStudents = async () => {
        // Don't fetch if no filters apply
        if (!selectedClass && (!searchQuery || searchQuery.length < 3)) {
            setStudents([]);
            return;
        }

        setIsFetchingStudents(true);
        try {
            const data = await getStudentsForInput(selectedClass || undefined, searchQuery || undefined);
            const mappedData = (data || []).map((s: any) => ({
                ...s,
                class: Array.isArray(s.class) ? s.class[0] : s.class
            }));
            setStudents(mappedData);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setIsFetchingStudents(false);
        }
    };

    // Set client-side flag to prevent hydration mismatch
    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleModalSubmit = async (time: string) => {
        if (!selectedStudent || !time) return;

        setIsLoading(true);
        try {
            const resultData = await recordManualAttendance(selectedStudent.id, time);

            setResult(resultData);

            // Reset selection and Close modal
            setSelectedStudent(null);
            setShowTimeModal(false);
        } catch (error: any) {
            // Play error sound
            try {
                new Audio('/sounds/error.mp3').play().catch(() => { });
            } catch (e) { }
            alert(`Gagal: ${error.message}`);
            setIsLoading(false); // Stop loading if error
        } finally {
            // Loading state for success is handled by unmounting or transition
            if (!result) setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Input Kehadiran</h1>
                <p className={styles.subtitle}>Catat manual siswa terlambat</p>
            </div>

            <div className={styles.card}>
                {/* Class Filter */}
                <div className={styles.section}>
                    <label className={styles.label}>Filter Kelas</label>
                    <div className={styles.inputWrapper}>
                        <Users className={styles.icon} size={18} />
                        <select
                            value={selectedClass}
                            onChange={(e) => {
                                setSelectedClass(e.target.value);
                                setSelectedStudent(null);
                            }}
                            className={styles.select}
                        >
                            <option value="">Semua Kelas</option>
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                        <ChevronDown className={styles.icon} style={{ left: 'auto', right: '16px' }} size={18} />
                    </div>
                </div>

                {/* Search */}
                <div className={styles.section}>
                    <label className={styles.label}>Cari Siswa</label>
                    <div className={styles.inputWrapper}>
                        <Search className={styles.icon} size={18} />
                        <input
                            type="text"
                            placeholder="Ketik minimal 3 huruf..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.input}
                        />
                    </div>
                </div>

                {/* List */}
                <div className={styles.studentListWrapper}>
                    {isFetchingStudents ? (
                        <div className={styles.loadingState}>
                            <div className={styles.spinner}></div>
                            <span>mencari data...</span>
                        </div>
                    ) : students.length > 0 ? (
                        <div className={styles.studentList}>
                            {students.map(student => {
                                const isSelected = selectedStudent?.id === student.id;
                                return (
                                    <button
                                        key={student.id}
                                        type="button"
                                        onClick={() => setSelectedStudent(student)}
                                        className={`${styles.studentItem} ${isSelected ? styles.studentItemSelected : ''}`}
                                    >
                                        <div className={`${styles.avatar} ${isSelected ? styles.avatarSelected : ''}`}>
                                            {isSelected ? <CheckCircle2 size={20} /> : <User size={20} />}
                                        </div>
                                        <div className={styles.studentInfo}>
                                            <div className={`${styles.studentName} ${isSelected ? styles.studentNameSelected : ''}`}>
                                                {student.name}
                                            </div>
                                            <div className={styles.studentMeta}>
                                                <span className={styles.className}>{student.class?.name}</span>
                                                {student.nisn && <span>{student.nisn}</span>}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            {selectedClass || searchQuery.length >= 3 ? (
                                <>
                                    <Search size={32} style={{ opacity: 0.3 }} />
                                    <span>Tidak ditemukan siswa</span>
                                </>
                            ) : (
                                <>
                                    <Users size={32} style={{ opacity: 0.3 }} />
                                    <span>Pilih kelas atau cari nama siswa</span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Inline Selected Student Action */}
                {selectedStudent && (
                    <div className="mt-4 pt-6 border-t border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
                        <Button
                            onClick={() => setShowTimeModal(true)}
                            isLoading={isLoading}
                            variant="primary"
                            size="lg"
                            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-200 border-0 h-14 text-lg font-bold rounded-xl"
                        >
                            <div className="flex items-center justify-center gap-2">
                                <CheckCircle2 size={24} />
                                <span>Konfirmasi Kehadiran</span>
                            </div>
                        </Button>
                    </div>
                )}
            </div>

            {/* Time Input Modal */}
            {showTimeModal && selectedStudent && (
                <TimeInputModal
                    student={selectedStudent}
                    initialTime={new Date().toTimeString().slice(0, 5)}
                    onClose={() => setShowTimeModal(false)}
                    onSubmit={handleModalSubmit}
                    isLoading={isLoading}
                />
            )}

            {/* Result Overlay */}
            {result && (
                <FloatingScanResult result={result} onDismiss={() => setResult(null)} />
            )}
        </div>
    );
}

