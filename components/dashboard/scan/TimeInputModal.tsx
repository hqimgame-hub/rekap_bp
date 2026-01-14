'use client';

import { useState, useEffect } from 'react';
import { Clock, User, CheckCircle2, X } from 'lucide-react';
import styles from './TimeInputModal.module.css';

interface Student {
    id: string;
    name: string;
    nisn: string | null;
    class_id: string;
    class: { name: string } | null;
}

interface TimeInputModalProps {
    student: Student;
    initialTime: string;
    onClose: () => void;
    onSubmit: (time: string) => void;
    isLoading: boolean;
}

export default function TimeInputModal({
    student,
    initialTime,
    onClose,
    onSubmit,
    isLoading
}: TimeInputModalProps) {
    const [time, setTime] = useState(initialTime);

    // Prevent scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.touchAction = 'unset';
        };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(time);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={`${styles.header} ${time > '07:00' ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                    <h3 className={`${styles.title} ${time > '07:00' ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {time > '07:00' ? 'Keterangan Keterlambatan' : 'Konfirmasi Kehadiran'}
                    </h3>
                    <p className={styles.subtitle}>
                        {time > '07:00' ? 'Siswa terlambat masuk sekolah' : 'Siswa hadir tepat waktu'}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.body}>
                        <div className={styles.studentInfo}>
                            <div className={styles.avatar}>
                                <User size={40} />
                            </div>
                            <h2 className={styles.studentName}>{student.name}</h2>
                            <span className={styles.className}>
                                {student.class?.name || 'Tanpa Kelas'} • {student.nisn || 'No NISN'}
                            </span>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>
                                <Clock size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                                Jam Kedatangan
                            </label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className={styles.timeInput}
                                required
                            />
                            {time > '07:00' && (
                                <div className="mt-2 text-center text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                                    ⚠️ Terlambat
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.btnCancel}
                            disabled={isLoading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className={styles.btnSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Menyimpan...' : 'Konfirmasi'}
                            {!isLoading && <CheckCircle2 size={18} />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
