'use client';

import { Modal } from '../Modal';
import { Button } from '../Button';
import styles from './ConfirmationModal.module.css';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isLoading?: boolean;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isLoading
}: ConfirmationModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className={styles.container}>
                <p className={styles.message}>{message}</p>
                <div className={styles.actions}>
                    <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                        Batal
                    </Button>
                    <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
                        Hapus
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
