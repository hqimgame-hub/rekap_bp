'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[ScanPage] Error Boundary caught:', error);
    }, [error]);

    return (
        <div className="flex h-[80vh] flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-2xl font-bold text-red-600">Terjadi Kesalahan!</h2>
            <p className="text-slate-600 max-w-md">
                Gagal memuat halaman scan. Detail: {error.message}
            </p>
            <Button
                variant="primary"
                onClick={reset}
                className="mt-4"
            >
                Coba Lagi
            </Button>
        </div>
    );
}
