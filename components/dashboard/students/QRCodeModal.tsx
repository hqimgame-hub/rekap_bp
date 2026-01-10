'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentName: string;
    studentId: string;
    className: string;
}

export function QRCodeModal({ isOpen, onClose, studentName, studentId, className }: QRCodeModalProps) {
    const [qrUrl, setQrUrl] = useState<string>('');

    useEffect(() => {
        if (isOpen && studentId) {
            QRCode.toDataURL(studentId, {
                width: 400,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff',
                },
            }).then(setQrUrl).catch(console.error);
        }
    }, [isOpen, studentId]);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = qrUrl;
        link.download = `QR_${studentName.replace(/\s+/g, '_')}.png`;
        link.click();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Kode QR Siswa">
            <div className="flex flex-col items-center gap-4 p-4 text-center">
                <div className="bg-white p-2 rounded-lg border border-gray-200">
                    {qrUrl ? (
                        <img src={qrUrl} alt={`QR Code ${studentName}`} className="w-64 h-64" />
                    ) : (
                        <div className="w-64 h-64 flex items-center justify-center bg-gray-50">
                            Menyiapkan QR...
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-xl font-bold">{studentName}</h3>
                    <p className="text-gray-500">{className}</p>
                </div>

                <div className="flex gap-2 mt-4 w-full">
                    <Button variant="secondary" onClick={onClose} className="flex-1">Tutup</Button>
                    <Button onClick={handleDownload} className="flex-1">Download PNG</Button>
                </div>
            </div>
        </Modal>
    );
}
