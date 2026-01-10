'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, MoreVertical, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import styles from './AspectsClient.module.css';
import { createAspect, updateAspect, deleteAspect, createRule, updateRule, deleteRule } from '@/app/dashboard/aspects/actions';

interface Rule {
    id: string;
    aspect_id: string;
    name: string;
    point: number;
    created_at: string;
}

interface Aspect {
    id: string;
    name: string;
    type: 'positive' | 'negative' | 'neutral';
    input_type: 'qr' | 'manual' | 'select';
    aspect_rules: Rule[];
    created_at: string;
}

export default function AspectsClient({ initialData }: { initialData: Aspect[] }) {
    const [aspects] = useState<Aspect[]>(initialData);
    const [isLoading, setIsLoading] = useState(false);

    // Modals state
    const [isAspectModalOpen, setIsAspectModalOpen] = useState(false);
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Current selection
    const [currentAspect, setCurrentAspect] = useState<Aspect | null>(null);
    const [currentRule, setCurrentRule] = useState<Rule | null>(null);
    const [deleteType, setDeleteType] = useState<'aspect' | 'rule'>('aspect');

    // UI Toggle for initial rule
    const [addInitialRule, setAddInitialRule] = useState(false);



    const handleAspectSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);

        let result;
        if (currentAspect) {
            result = await updateAspect(currentAspect.id, formData);
        } else {
            result = await createAspect(formData);
        }

        if (result.success) {
            setIsAspectModalOpen(false);
            window.location.reload();
        } else {
            alert(result.error);
        }
        setIsLoading(false);
    };

    const handleRuleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        if (currentAspect) {
            formData.append('aspect_id', currentAspect.id);
        }

        let result;
        if (currentRule) {
            result = await updateRule(currentRule.id, formData);
        } else {
            result = await createRule(formData);
        }

        if (result.success) {
            setIsRuleModalOpen(false);
            window.location.reload();
        } else {
            alert(result.error);
        }
        setIsLoading(false);
    };

    const handleDelete = async () => {
        setIsLoading(true);
        let result;
        if (deleteType === 'aspect' && currentAspect) {
            result = await deleteAspect(currentAspect.id);
        } else if (deleteType === 'rule' && currentRule) {
            result = await deleteRule(currentRule.id);
        }

        if (result?.success) {
            setIsDeleteModalOpen(false);
            window.location.reload();
        } else {
            alert(result?.error);
        }
        setIsLoading(false);
    };

    const openAspectModal = (aspect?: Aspect) => {
        setCurrentAspect(aspect || null);
        setIsAspectModalOpen(true);
    };

    const openRuleModal = (aspect: Aspect, rule?: Rule) => {
        setCurrentAspect(aspect);
        setCurrentRule(rule || null);
        setIsRuleModalOpen(true);
    };

    const openDeleteModal = (type: 'aspect' | 'rule', item: any) => {
        setDeleteType(type);
        if (type === 'aspect') setCurrentAspect(item);
        else setCurrentRule(item);
        setIsDeleteModalOpen(true);
    };

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Manajemen Budaya Positif</h1>
                <Button onClick={() => openAspectModal()}>
                    <Plus size={18} /> Tambah Aspek
                </Button>
            </div>

            <div className="flex flex-col gap-6">
                {aspects.length === 0 && (
                    <Card>
                        <div className={styles.emptyState}>
                            Belum ada aspek budaya positif yang ditambahkan.
                        </div>
                    </Card>
                )}

                {aspects.map((aspect) => (
                    <div key={aspect.id} className={styles.aspectCard}>
                        <div className={styles.aspectHeader}>
                            <div className={styles.aspectTitle}>
                                <h2 className={styles.aspectName}>{aspect.name}</h2>
                                <span className={`${styles.badge} ${aspect.type === 'positive' ? styles.badgePositive :
                                    aspect.type === 'negative' ? styles.badgeNegative :
                                        styles.badgeNeutral
                                    }`}>
                                    {aspect.type === 'positive' ? 'Positif' :
                                        aspect.type === 'negative' ? 'Negatif' : 'Netral'}
                                </span>
                            </div>
                            <div className={styles.actions}>
                                <Button size="sm" variant="secondary" onClick={() => openRuleModal(aspect)}>
                                    <ListPlus size={16} /> Tambah Aturan
                                </Button>
                                <button className={styles.iconBtn} onClick={() => openAspectModal(aspect)} title="Edit Aspek">
                                    <Edit size={18} />
                                </button>
                                <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={() => openDeleteModal('aspect', aspect)} title="Hapus Aspek">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className={styles.aspectContent}>
                            {aspect.aspect_rules && aspect.aspect_rules.length > 0 ? (
                                <table className={styles.rulesTable}>
                                    <thead>
                                        <tr>
                                            <th>Aturan / Perilaku</th>
                                            <th style={{ width: '100px' }}>Poin</th>
                                            <th style={{ width: '100px', textAlign: 'right' }}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {aspect.aspect_rules.map((rule) => (
                                            <tr key={rule.id}>
                                                <td>{rule.name}</td>
                                                <td className={aspect.type === 'positive' ? styles.pointPositive : aspect.type === 'negative' ? styles.pointNegative : ''}>
                                                    {rule.point > 0 ? `+${rule.point}` : rule.point}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                                                        <button className={styles.iconBtn} onClick={() => openRuleModal(aspect, rule)}>
                                                            <Edit size={16} />
                                                        </button>
                                                        <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={() => openDeleteModal('rule', rule)}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className={styles.emptyState} style={{ padding: '1rem' }}>
                                    Belum ada aturan poin untuk aspek ini.
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Aspect Modal */}
            <Modal
                isOpen={isAspectModalOpen}
                onClose={() => setIsAspectModalOpen(false)}
                title={currentAspect ? 'Edit Aspek' : 'Tambah Aspek Baru'}
            >
                <form onSubmit={handleAspectSubmit}>
                    <Input
                        label="Nama Aspek"
                        name="name"
                        placeholder="Contoh: Kedisiplinan"
                        defaultValue={currentAspect?.name}
                        required
                    />

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Tipe Aspek</label>
                        <select name="type" className={styles.select} defaultValue={currentAspect?.type || 'positive'}>
                            <option value="positive">Positif (Menambah Poin)</option>
                            <option value="negative">Negatif (Mengurangi Poin)</option>
                            <option value="neutral">Netral (Pencatatan Saja)</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Metode Input</label>
                        <select name="input_type" className={styles.select} defaultValue={currentAspect?.input_type || 'manual'}>
                            <option value="manual">Manual Input</option>
                            <option value="qr">QR Scan</option>
                            <option value="select">Select List</option>
                        </select>
                    </div>

                    {!currentAspect && (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                            <label className="flex items-center gap-2 mb-4 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={addInitialRule}
                                    onChange={(e) => setAddInitialRule(e.target.checked)}
                                />
                                <span className={styles.label} style={{ marginBottom: 0 }}>Tambahkan Aturan Poin Sekaligus</span>
                            </label>

                            {addInitialRule && (
                                <div className="pl-4 border-l-2 border-gray-100">
                                    <Input
                                        label="Deskripsi Aturan Perdana"
                                        name="rule_name"
                                        placeholder="Contoh: Terlambat Masuk Sekolah"
                                    />
                                    <Input
                                        label="Bobot Poin"
                                        name="rule_point"
                                        type="number"
                                        placeholder="Contoh: -5"
                                    />
                                </div>
                            )}
                        </div>
                    )}



                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsAspectModalOpen(false)}>Batal</Button>
                        <Button type="submit" isLoading={isLoading}>Simpan</Button>
                    </div>
                </form>
            </Modal>

            {/* Rule Modal */}
            <Modal
                isOpen={isRuleModalOpen}
                onClose={() => setIsRuleModalOpen(false)}
                title={currentRule ? 'Edit Aturan Poin' : `Tambah Aturan: ${currentAspect?.name}`}
            >
                <form onSubmit={handleRuleSubmit}>
                    <Input
                        label="Deskripsi Aturan / Perilaku"
                        name="name"
                        placeholder="Contoh: Datang tepat waktu"
                        defaultValue={currentRule?.name}
                        required
                    />

                    <Input
                        label="Bobot Poin"
                        name="point"
                        type="number"
                        placeholder="Contoh: 5"
                        defaultValue={currentRule?.point}
                        required
                    />
                    <p className="text-sm text-gray-500 mb-4 mt-1">
                        Gunakan angka positif (misal: 10) atau negatif (misal: -5) sesuai tipe aspek.
                    </p>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsRuleModalOpen(false)}>Batal</Button>
                        <Button type="submit" isLoading={isLoading}>Simpan</Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title={deleteType === 'aspect' ? 'Hapus Aspek?' : 'Hapus Aturan?'}
                message={deleteType === 'aspect'
                    ? `Menghapus aspek "${currentAspect?.name}" juga akan menghapus semua aturan di dalamnya.`
                    : `Anda yakin ingin menghapus aturan "${currentRule?.name}"?`}
                isLoading={isLoading}
            />
        </div>
    );
}
