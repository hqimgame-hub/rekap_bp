'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit, MoreHorizontal, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { createClass, updateClass, deleteClass, bulkDeleteClasses } from '@/app/dashboard/classes/actions';
import styles from './ClassesClient.module.css';

interface ClassData {
    id: string;
    name: string;
    grade: string;
    created_at: string;
}

export default function ClassesPage({
    initialData,
    userRole
}: {
    initialData: ClassData[],
    userRole: 'admin' | 'kepsek' | 'walas' | 'petugas' | 'petugas_input' | 'petugas_scan'
}) {
    const isAdmin = userRole === 'admin';
    const [data, setData] = useState<ClassData[]>(initialData);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [currentClass, setCurrentClass] = useState<ClassData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Local filtering
    const filteredData = data.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.grade.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
        if (currentClass) {
            result = await updateClass(currentClass.id, formData);
        } else {
            result = await createClass(formData);
        }

        if (result.success) {
            setIsModalOpen(false);
            // Ideally re-fetch or rely on Next.js server component refresh, 
            // but for SPA feel we can wait for prop update or router.refresh().
            // For now, reload window or use router to keep it simple.
            window.location.reload();
        } else {
            alert(result.error);
        }
        setIsLoading(false);
    };

    const handleDelete = async () => {
        setIsLoading(true);
        let result;
        if (selectedIds.size > 0 && !currentClass) {
            result = await bulkDeleteClasses(Array.from(selectedIds));
        } else if (currentClass) {
            result = await deleteClass(currentClass.id);
        }

        if (result?.success) {
            setIsDeleteModalOpen(false);
            setSelectedIds(new Set());
            setCurrentClass(null);
            window.location.reload();
        } else {
            alert(result?.error);
        }
        setIsLoading(false);
    };

    const openEdit = (cls: ClassData) => {
        setCurrentClass(cls);
        setIsModalOpen(true);
    };

    const openDelete = (cls: ClassData) => {
        setCurrentClass(cls);
        setIsDeleteModalOpen(true);
    };

    const openBulkDelete = () => {
        setCurrentClass(null);
        setIsDeleteModalOpen(true);
    };

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Data Kelas</h1>
                {isAdmin && (
                    <Button onClick={() => { setCurrentClass(null); setIsModalOpen(true); }}>
                        <Plus size={18} /> Tambah Kelas
                    </Button>
                )}
            </div>

            <Card>
                <div className={styles.toolbar}>
                    <div className={styles.search}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Cari kelas..."
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {selectedIds.size > 0 && isAdmin && (
                        <Button variant="danger" size="sm" onClick={openBulkDelete}>
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
                            <TableHeader>Jenjang (Grade)</TableHeader>
                            <TableHeader>Nama Kelas</TableHeader>
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
                                <TableCell>{item.grade}</TableCell>
                                <TableCell>{item.name}</TableCell>
                                {isAdmin && (
                                    <TableCell>
                                        <div className={styles.actions}>
                                            <button onClick={() => openEdit(item)} className={styles.iconBtn} title="Edit">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => openDelete(item)} className={styles.iconBtn} title="Hapus">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                        {filteredData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">Tidak ada data kelas.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentClass ? 'Edit Kelas' : 'Tambah Kelas Baru'}
            >
                <form onSubmit={handleSubmit}>
                    <Input
                        label="Jenjang (Grade)"
                        name="grade"
                        placeholder="Contoh: X, XI, XII"
                        defaultValue={currentClass?.grade}
                        required
                    />
                    <Input
                        label="Nama Kelas"
                        name="name"
                        placeholder="Contoh: X RPL 1"
                        defaultValue={currentClass?.name}
                        required
                    />
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
                title="Hapus Kelas?"
                message={currentClass
                    ? `Apakah Anda yakin ingin menghapus kelas "${currentClass.name}"?`
                    : `Apakah Anda yakin ingin menghapus ${selectedIds.size} kelas terpilih?`}
                isLoading={isLoading}
            />
        </div>
    );
}
