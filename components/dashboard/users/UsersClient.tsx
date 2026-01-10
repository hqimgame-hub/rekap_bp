'use client';

import { useState } from 'react';
import { Plus, Trash2, UserPlus, Shield, Search, User, Edit } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { createUser, deleteUser, updateUser } from '@/app/dashboard/users/actions';
import styles from './UsersClient.module.css';

interface UserData {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'kepsek' | 'walas' | 'petugas_input' | 'petugas_scan' | 'petugas';
    class_id: string | null;
    created_at: string;
    class?: { id: string; name: string };
}

export default function UsersClient({ initialData, classes }: {
    initialData: UserData[];
    classes: { id: string; name: string }[]
}) {
    const [data, setData] = useState<UserData[]>(initialData);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('petugas_input');

    const filteredData = data.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);

        const payload: any = {
            name: formData.get('name') as string,
            role: formData.get('role') as any,
            classId: formData.get('classId') as string || null,
        };

        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            if (currentUser) {
                // Edit mode
                if (email !== currentUser.email) payload.email = email;
                if (password) payload.password = password;

                const result = await updateUser(currentUser.id, payload);
                if (result.success) {
                    setIsModalOpen(false);
                    window.location.reload();
                }
            } else {
                // Create mode
                payload.email = email;
                payload.password = password;
                const result = await createUser(payload);
                if (result.success) {
                    setIsModalOpen(false);
                    window.location.reload();
                }
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (user: UserData) => {
        setCurrentUser(user);
        setSelectedRole(user.role);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const result = await deleteUser(currentUser.id);
            if (result.success) {
                setIsDeleteModalOpen(false);
                window.location.reload();
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Manajemen Pengguna</h1>
                <Button onClick={() => { setCurrentUser(null); setSelectedRole('petugas_input'); setIsModalOpen(true); }}>
                    <UserPlus size={18} /> Tambah Akun
                </Button>
            </div>

            <Card>
                <div className={styles.toolbar}>
                    <div className={styles.search}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Cari nama atau email..."
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <Table>
                    <TableHead>
                        <TableRow>
                            <TableHeader>Nama & Email</TableHeader>
                            <TableHeader>Role</TableHeader>
                            <TableHeader>Akses / Kelas</TableHeader>
                            <TableHeader>Aksi</TableHeader>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="font-medium text-slate-900">{user.name}</div>
                                    <div className="text-xs text-slate-500">{user.email}</div>
                                </TableCell>
                                <TableCell>
                                    <span className={`${styles.roleBadge} ${styles[user.role] || styles.petugas}`}>
                                        {user.role === 'petugas_input' ? 'PETUGAS INPUT' :
                                            user.role === 'petugas_scan' ? 'PETUGAS SCAN' :
                                                user.role.toUpperCase()}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {user.role === 'walas' ? (
                                        <span className="text-slate-600 border-b border-dashed border-slate-300 pb-0.5">Wali Kelas: {user.class?.name || '-'}</span>
                                    ) : user.role === 'admin' ? (
                                        <span className="text-blue-600 flex items-center gap-1 font-semibold"><Shield size={14} /> Full Access</span>
                                    ) : user.role === 'kepsek' ? (
                                        <span className="text-purple-600 font-medium italic text-sm">Kepala Sekolah (Pantau Global)</span>
                                    ) : user.role === 'petugas_input' ? (
                                        <span className="text-orange-600 text-sm">Input Poin Manual</span>
                                    ) : user.role === 'petugas_scan' ? (
                                        <span className="text-teal-600 text-sm">Scan QR Code</span>
                                    ) : (
                                        <span className="text-slate-500 text-sm text-center">Akses Terbatas</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className={styles.editBtn || styles.iconBtn}
                                            style={{ color: 'var(--primary-600)', padding: '6px', borderRadius: '6px' }}
                                            title="Edit"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => { setCurrentUser(user); setIsDeleteModalOpen(true); }}
                                            className={styles.deleteBtn}
                                            title="Hapus"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center p-8 text-slate-500">
                                    Tidak ada pengguna ditemukan.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentUser ? `Edit Akun: ${currentUser.name}` : "Buat Akun Baru"}
            >
                <form onSubmit={handleSubmit} className={styles.form}>
                    <Input
                        label="Nama Lengkap"
                        name="name"
                        placeholder="Contoh: Budi Santoso"
                        defaultValue={currentUser?.name}
                        required
                    />
                    <Input
                        label="Email"
                        name="email"
                        type="email"
                        placeholder="email@sekolah.id"
                        defaultValue={currentUser?.email}
                        required
                    />
                    <Input
                        label={currentUser ? "Password Baru (Kosongkan jika tidak diubah)" : "Password"}
                        name="password"
                        type="password"
                        placeholder={currentUser ? "Minimal 6 karakter" : "Minimal 6 karakter"}
                        required={!currentUser}
                    />

                    <div className={styles.field}>
                        <label className={styles.label}>Peran (Role)</label>
                        <select
                            name="role"
                            className={styles.select}
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            required
                        >
                            <option value="petugas_input">Petugas (Input Poin Manual)</option>
                            <option value="petugas_scan">Petugas (Scan QR Code)</option>
                            <option value="walas">Wali Kelas (Pantau Kelas)</option>
                            <option value="kepsek">Kepala Sekolah (Pantau Global)</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>

                    {selectedRole === 'walas' && (
                        <div className={styles.field}>
                            <label className={styles.label}>Tugaskan ke Kelas</label>
                            <select
                                name="classId"
                                className={styles.select}
                                defaultValue={currentUser?.class_id || ''}
                                required
                            >
                                <option value="">-- Pilih Kelas --</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" isLoading={isLoading}>
                            {currentUser ? "Simpan Perubahan" : "Mulai Buat Akun"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Hapus Akun?"
                message={`Apakah Anda yakin ingin menghapus akun "${currentUser?.name}"? Tindakan ini permanen.`}
                isLoading={isLoading}
            />
        </div>
    );
}
