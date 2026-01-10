'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Search, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import styles from './RecordForm.module.css';
import { createRecord, getStudentsByClass } from '@/app/dashboard/records/actions';

interface Aspect {
    id: string;
    name: string;
    type: 'positive' | 'negative' | 'neutral';
    aspect_rules: {
        id: string;
        name: string;
        point: number;
    }[];
}

interface ClassOption {
    id: string;
    name: string;
}

interface Student {
    id: string;
    name: string;
    gender: string;
}

export default function RecordForm({
    initialAspects,
    initialClasses
}: {
    initialAspects: Aspect[],
    initialClasses: ClassOption[]
}) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Step 1: Class & Students
    const [selectedClassId, setSelectedClassId] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [isFetchingStudents, setIsFetchingStudents] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Step 2: Aspect & Rule
    const [selectedAspectId, setSelectedAspectId] = useState('');
    const [selectedRuleId, setSelectedRuleId] = useState('');

    // Step 3: Confirmation
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Computed
    const selectedAspect = initialAspects.find(a => a.id === selectedAspectId);
    const selectedRule = selectedAspect?.aspect_rules.find(r => r.id === selectedRuleId);

    // Fetch students when class changes
    useEffect(() => {
        const fetchStudents = async () => {
            setIsFetchingStudents(true);
            try {
                const data = await getStudentsByClass(selectedClassId || undefined);
                setStudents(data || []);
                setSelectedStudentIds(new Set());
            } catch (error) {
                console.error(error);
            }
            setIsFetchingStudents(false);
        };

        fetchStudents();
    }, [selectedClassId]);

    const handleStudentToggle = (id: string) => {
        const newSet = new Set(selectedStudentIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedStudentIds(newSet);
    };

    const handleSelectAll = () => {
        if (selectedStudentIds.size === filteredStudents.length) {
            setSelectedStudentIds(new Set());
        } else {
            setSelectedStudentIds(new Set(filteredStudents.map(s => s.id)));
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedStudentIds.size === 0 || !selectedAspectId || !selectedRuleId) {
            alert('Mohon lengkapi data formulir.');
            return;
        }

        setIsLoading(true);

        const formData = new FormData();
        selectedStudentIds.forEach(id => formData.append('student_ids', id));
        formData.append('aspect_id', selectedAspectId);
        formData.append('rule_id', selectedRuleId);
        if (selectedRule) {
            formData.append('point', selectedRule.point.toString());
        }
        formData.append('date', date);

        const result = await createRecord(null, formData);

        if (result?.success) {
            alert(`Berhasil mencatat poin untuk ${result.count} siswa.`);
            setSelectedStudentIds(new Set());
            setSelectedRuleId('');
        } else {
            alert('Gagal menyimpan: ' + result?.error);
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Catat Pelanggaran / Prestasi</h1>
                <p className={styles.subtitle}>Input poin siswa secara manual</p>
            </div>

            <Card className="mb-6">
                {/* Step 1: Pilih Kelas & Siswa */}
                <div className={styles.step}>
                    <div className={styles.stepTitle}>
                        <div className={styles.stepNumber}>1</div>
                        Pilih Siswa
                    </div>

                    <div className={styles.grid}>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Pilih Kelas</label>
                                <select
                                    className={styles.select}
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Semua Kelas --</option>
                                    {initialClasses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-[2]">
                                <label className="block text-sm font-medium mb-1">Cari Nama Siswa</label>
                                <div className={styles.inputGroup}>
                                    <Search className={styles.inputIcon} size={18} />
                                    <input
                                        type="text"
                                        placeholder="Cari nama siswa..."
                                        className={`${styles.input} ${styles.inputWithIcon}`}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {(selectedClassId || searchTerm) && (
                            <div className="mt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-semibold text-slate-500">Hasil Pencarian:</span>
                                    <Button type="button" size="sm" variant="secondary" onClick={handleSelectAll}>
                                        {selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0 ? 'Batal Semua' : 'Pilih Semua'}
                                    </Button>
                                </div>

                                {isFetchingStudents ? (
                                    <div className="text-center py-4 text-gray-500">Memuat data siswa...</div>
                                ) : (
                                    <div className="student-list-container">
                                        {filteredStudents.length > 0 ? (
                                            <div className={styles.studentGrid}>
                                                {filteredStudents.map(student => (
                                                    <div
                                                        key={student.id}
                                                        className={`${styles.studentCard} ${selectedStudentIds.has(student.id) ? styles.selected : ''}`}
                                                        onClick={() => handleStudentToggle(student.id)}
                                                    >
                                                        <User size={16} />
                                                        <span className="truncate">{student.name}</span>
                                                        {selectedStudentIds.has(student.id) && <Check size={16} className="ml-auto" />}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className={styles.emptyHelp}>Tidak ada siswa ditemukan</div>
                                        )}
                                    </div>
                                )}
                                <div className="text-right text-sm text-gray-500 mt-1">
                                    {selectedStudentIds.size} siswa dipilih
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Step 2: Pilih Aspek & Aturan */}
                {selectedStudentIds.size > 0 && (
                    <div className={styles.step}>
                        <div className={styles.stepTitle}>
                            <div className={styles.stepNumber}>2</div>
                            Pilih Pelanggaran / Prestasi
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Kategori Aspek</label>
                            <div className={styles.aspectGrid}>
                                {initialAspects.map(aspect => (
                                    <div
                                        key={aspect.id}
                                        className={`${styles.aspectBtn} ${selectedAspectId === aspect.id ? styles.selected : ''}`}
                                        onClick={() => { setSelectedAspectId(aspect.id); setSelectedRuleId(''); }}
                                    >
                                        <div className="font-medium">{aspect.name}</div>
                                        <span className={styles.aspectType}>
                                            {aspect.type === 'positive' ? 'POSITIF' : aspect.type === 'negative' ? 'NEGATIF' : 'NETRAL'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {selectedAspect && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-sm font-medium mb-1">Detail Aturan / Perilaku</label>
                                <select
                                    className={styles.select}
                                    value={selectedRuleId}
                                    onChange={(e) => setSelectedRuleId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Pilih Aturan --</option>
                                    {selectedAspect.aspect_rules.map(rule => (
                                        <option key={rule.id} value={rule.id}>
                                            {rule.name} ({rule.point > 0 ? '+' : ''}{rule.point} poin)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {selectedRule && (
                            <div className={styles.pointDisplay}>
                                <span>Poin yang akan dicatat:</span>
                                <span className={`
                                    ${styles.pointValue} 
                                    ${selectedAspect?.type === 'positive' ? styles.pointPositive : selectedAspect?.type === 'negative' ? styles.pointNegative : ''}
                                `}>
                                    {selectedRule.point > 0 ? '+' : ''}{selectedRule.point}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Konfirmasi */}
                {selectedStudentIds.size > 0 && selectedRuleId && (
                    <div className={styles.step}>
                        <div className={styles.stepTitle}>
                            <div className={styles.stepNumber}>3</div>
                            Konfirmasi & Simpan
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tanggal Kejadian</label>
                                <div className={styles.inputGroup}>
                                    <Calendar className={styles.inputIcon} size={18} />
                                    <input
                                        type="date"
                                        className={`${styles.input} ${styles.inputWithIcon}`}
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={styles.summary}>
                            <h4 className={styles.summaryTitle}>Ringkasan:</h4>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                <li><strong>{selectedStudentIds.size} Siswa</strong> terpilih.</li>
                                <li>Aspek: <strong>{selectedAspect?.name}</strong></li>
                                <li>Perilaku: <strong>{selectedRule?.name}</strong></li>
                                <li>Poin: <strong>{selectedRule && (selectedRule.point > 0 ? '+' : '')}{selectedRule?.point}</strong></li>
                                <li>Tanggal: {date}</li>
                            </ul>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button type="submit" size="lg" isLoading={isLoading} variant={selectedAspect?.type === 'positive' ? 'success' : 'danger'}>
                                Simpan Data ({selectedStudentIds.size})
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </form>
    );
}
