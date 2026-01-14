'use client';

import { useState, useRef } from 'react';
import { Plus, Trash2, Edit, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import * as XLSX from 'xlsx';
import { createStudent, updateStudent, deleteStudent, bulkDeleteStudents, importStudents } from '@/app/dashboard/students/actions';
import { QRCodeModal } from './QRCodeModal';
import QRCode from 'qrcode';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import styles from './StudentsClient.module.css';
import { QrCode, FileText } from 'lucide-react';

interface StudentData {
    id: string;
    nisn?: string | null;
    name: string;
    class_id: string;
    gender?: string | null;
    classes?: {
        id: string;
        name: string;
    };
    created_at: string;
}

interface ClassOption {
    id: string;
    name: string;
}

export default function StudentsClient({
    initialData,
    classesOptions,
    userRole
}: {
    initialData: StudentData[],
    classesOptions: ClassOption[],
    userRole: 'admin' | 'kepsek' | 'walas' | 'petugas' | 'petugas_input' | 'petugas_scan'
}) {
    const isAdmin = userRole === 'admin';
    const [data] = useState<StudentData[]>(initialData);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [currentStudent, setCurrentStudent] = useState<StudentData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClass, setFilterClass] = useState('all');
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [qrStudent, setQrStudent] = useState<StudentData | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    // Filter Logic
    const filteredData = data.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClass = filterClass === 'all' || item.class_id === filterClass;
        return matchesSearch && matchesClass;
    });

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(filteredData.map(d => d.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);

        let result;
        if (currentStudent) {
            result = await updateStudent(currentStudent.id, formData);
        } else {
            result = await createStudent(formData);
        }

        if (result.success) {
            setIsModalOpen(false);
            window.location.reload();
        } else {
            alert(result.error);
        }
        setIsLoading(false);
    };

    const handleDelete = async () => {
        setIsLoading(true);
        let result;
        if (selectedIds.size > 0 && !currentStudent) {
            result = await bulkDeleteStudents(Array.from(selectedIds));
        } else if (currentStudent) {
            result = await deleteStudent(currentStudent.id);
        }

        if (result?.success) {
            setIsDeleteModalOpen(false);
            setSelectedIds(new Set());
            setCurrentStudent(null);
            window.location.reload();
        } else {
            alert(result?.error);
        }
        setIsLoading(false);
    };

    // Excel Handlers
    const downloadTemplate = () => {
        // Create a worksheet
        const wsData = [
            ['NISN', 'Nama Lengkap', 'Jenis Kelamin (L/P)', 'Nama Kelas'],
            ['12345678', 'Contoh Siswa', 'L', 'X RPL 1']
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Create a workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');

        // Generate Excel file and trigger download
        XLSX.writeFile(wb, 'template_siswa.xlsx');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const workbook = XLSX.read(bstr, { type: 'binary' });
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][];

                // Remove header row
                const rows = data.slice(1);

                const studentsToImport = rows.map(row => {
                    const nisn = row[0] ? row[0].toString() : null;
                    const name = row[1];
                    const gender = row[2];
                    const className = row[3];

                    if (!name || !className) return null;

                    // Find class_id by name (case-insensitive)
                    const matchedClass = classesOptions.find(c => c.name.toLowerCase() === className.toLowerCase().trim());

                    if (!matchedClass) return null;

                    return {
                        nisn,
                        name,
                        gender: gender || 'L',
                        class_id: matchedClass.id
                    };
                }).filter(s => s !== null) as { nisn: string | null; name: string; class_id: string; gender: string }[];

                if (studentsToImport.length === 0) {
                    alert('Tidak ada data valid yang ditemukan. Pastikan nama kelas sesuai dengan data di sistem.');
                    return;
                }

                setIsLoading(true);
                const result = await importStudents(studentsToImport);
                if (result.success) {
                    alert(`Berhasil mengimpor ${studentsToImport.length} siswa.`);
                    window.location.reload();
                } else {
                    alert('Gagal mengimpor: ' + result.error);
                }
                setIsLoading(false);

            } catch (error) {
                console.error(error);
                alert('Gagal membaca file Excel.');
            }
        };
        reader.readAsBinaryString(file);
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handlePrintAllQR = async () => {
        if (filteredData.length === 0) return;
        setIsExporting(true);
        try {
            const pdfDoc = await PDFDocument.create();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            // Standard A4: 595.28 x 841.89 points
            // Cards in grid: 2 columns, 4 rows (8 cards per page)
            const cardWidth = 250;
            const cardHeight = 180;
            const margin = 30;
            const gap = 20;

            let currentPage = pdfDoc.addPage([595.28, 841.89]);
            let x = margin;
            let y = 841.89 - margin - cardHeight;
            let count = 0;

            for (const student of filteredData) {
                if (count > 0 && count % 8 === 0) {
                    currentPage = pdfDoc.addPage([595.28, 841.89]);
                    x = margin;
                    y = 841.89 - margin - cardHeight;
                } else if (count > 0 && count % 2 === 0) {
                    x = margin;
                    y -= cardHeight + gap;
                } else if (count > 0) {
                    x = margin + cardWidth + gap;
                }

                // Draw Card Background (simple border)
                currentPage.drawRectangle({
                    x, y,
                    width: cardWidth,
                    height: cardHeight,
                    borderColor: rgb(0.8, 0.8, 0.8),
                    borderWidth: 1,
                });

                // Header
                currentPage.drawText('Kartu Absensi Siswa', {
                    x: x + 10,
                    y: y + cardHeight - 25,
                    size: 14,
                    font: fontBold,
                    color: rgb(0.1, 0.1, 0.1),
                });
                currentPage.drawText('SMPN 32 SBY', {
                    x: x + 10,
                    y: y + cardHeight - 40,
                    size: 10,
                    font: font,
                    color: rgb(0.4, 0.4, 0.4),
                });

                // QR Code
                const qrDataUrl = await QRCode.toDataURL(student.id, { margin: 1 });
                const qrImage = await pdfDoc.embedPng(qrDataUrl);
                currentPage.drawImage(qrImage, {
                    x: x + cardWidth - 110,
                    y: y + 15,
                    width: 100,
                    height: 100,
                });

                // Student Info
                currentPage.drawText(student.name, {
                    x: x + 10,
                    y: y + 60,
                    size: 12,
                    font: fontBold,
                    maxWidth: 130,
                });
                currentPage.drawText(`Kelas: ${student.classes?.name || '-'}`, {
                    x: x + 10,
                    y: y + 45,
                    size: 10,
                    font: font,
                });

                count++;
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `QR_Absensi_Siswa_${new Date().getTime()}.pdf`;
            link.click();
        } catch (error) {
            console.error('Export Error:', error);
            alert('Gagal membuat PDF');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Data Siswa</h1>
                {isAdmin && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handlePrintAllQR} isLoading={isExporting} title="Cetak Semua Kode QR Siswa">
                            <FileText size={18} className="mr-2" /> Cetak QR
                        </Button>
                        <Button variant="success" onClick={downloadTemplate} title="Download Template Excel">
                            Download Template
                        </Button>
                        <div>
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileUpload}
                                ref={fileInputRef}
                                className="hidden" // Tailwind hidden or style display: none
                                style={{ display: 'none' }}
                            />
                            <Button variant="warning" onClick={handleUploadClick}>
                                Upload Excel
                            </Button>
                        </div>
                        <Button onClick={() => { setCurrentStudent(null); setIsModalOpen(true); }}>
                            <Plus size={18} /> Tambah Siswa
                        </Button>
                    </div>
                )}
            </div>

            <Card>
                <div className={styles.toolbar}>
                    <div className={styles.search}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Cari nama siswa..."
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        <select
                            className={styles.filterSelect}
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                        >
                            <option value="all">Semua Kelas</option>
                            {classesOptions.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedIds.size > 0 && isAdmin && (
                        <Button variant="danger" size="sm" onClick={() => { setCurrentStudent(null); setIsDeleteModalOpen(true); }}>
                            <Trash2 size={16} /> Hapus ({selectedIds.size})
                        </Button>
                    )}
                </div>

                <Table>
                    <TableHead>
                        <TableRow>
                            {isAdmin && (
                                <TableHeader className={styles.checkboxCell}>
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={selectedIds.size === filteredData.length && filteredData.length > 0}
                                    />
                                </TableHeader>
                            )}
                            <TableHeader>NISN</TableHeader>
                            <TableHeader>Nama Siswa</TableHeader>
                            <TableHeader>JK</TableHeader>
                            <TableHeader>Kelas</TableHeader>
                            {isAdmin && <TableHeader>Aksi</TableHeader>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.map((item) => (
                            <TableRow key={item.id}>
                                {isAdmin && (
                                    <TableCell className={styles.checkboxCell}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(item.id)}
                                            onChange={() => handleSelectOne(item.id)}
                                        />
                                    </TableCell>
                                )}
                                <TableCell>{item.nisn || '-'}</TableCell>
                                <TableCell>{item.name}</TableCell>
                                <TableCell>{item.gender || '-'}</TableCell>
                                <TableCell>{item.classes?.name || '-'}</TableCell>
                                {isAdmin && (
                                    <TableCell>
                                        <div className={styles.actions}>
                                            <button
                                                onClick={() => { setQrStudent(item); setIsQRModalOpen(true); }}
                                                className={styles.iconBtn}
                                                title="Lihat Kode QR"
                                            >
                                                <QrCode size={18} />
                                            </button>
                                            <button onClick={() => { setCurrentStudent(item); setIsModalOpen(true); }} className={styles.iconBtn} title="Edit">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => { setCurrentStudent(item); setIsDeleteModalOpen(true); }} className={styles.iconBtn} title="Hapus">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                        {filteredData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Tidak ada data siswa.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentStudent ? 'Edit Siswa' : 'Tambah Siswa Baru'}
            >
                <form onSubmit={handleSubmit}>
                    <Input
                        label="NISN"
                        name="nisn"
                        placeholder="Contoh: 12345678"
                        defaultValue={currentStudent?.nisn || ''}
                    />

                    <Input
                        label="Nama Lengkap"
                        name="name"
                        placeholder="Contoh: Budi Santoso"
                        defaultValue={currentStudent?.name}
                        required
                    />

                    <div style={{ marginBottom: '1rem' }}>
                        <label className={styles.label}>Jenis Kelamin</label>
                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="gender"
                                    value="L"
                                    defaultChecked={currentStudent ? currentStudent.gender === 'L' : true}
                                />
                                Laki-laki
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="gender"
                                    value="P"
                                    defaultChecked={currentStudent ? currentStudent.gender === 'P' : false}
                                />
                                Perempuan
                            </label>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className={styles.label}>Kelas</label>
                        <select
                            name="class_id"
                            className={styles.selectInput}
                            defaultValue={currentStudent?.class_id || ''}
                            required
                        >
                            <option value="" disabled>Pilih Kelas</option>
                            {classesOptions.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-between mt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" isLoading={isLoading}>Simpan</Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Hapus Siswa?"
                message={currentStudent
                    ? `Apakah Anda yakin ingin menghapus siswa "${currentStudent.name}"?`
                    : `Apakah Anda yakin ingin menghapus ${selectedIds.size} siswa terpilih?`}
                isLoading={isLoading}
            />

            {/* QR Code Modal */}
            {qrStudent && (
                <QRCodeModal
                    isOpen={isQRModalOpen}
                    onClose={() => setIsQRModalOpen(false)}
                    studentId={qrStudent.id}
                    studentName={qrStudent.name}
                    className={qrStudent.classes?.name || '-'}
                />
            )}
        </div>
    );
}
