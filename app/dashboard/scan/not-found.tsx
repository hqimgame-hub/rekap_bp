import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
    return (
        <div className="flex h-[80vh] flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-4xl font-black text-slate-800">404</h2>
            <p className="text-slate-600 text-lg">
                Halaman Scan tidak ditemukan.
            </p>
            <div className="flex gap-4 mt-6">
                <Link href="/dashboard">
                    <Button variant="secondary">
                        Kembali ke Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
}
