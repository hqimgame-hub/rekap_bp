'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientRedirect({ to }: { to: string }) {
    const router = useRouter();

    useEffect(() => {
        console.log(`[ClientRedirect] Redirecting to ${to}`);
        router.replace(to);
    }, [to, router]);

    return (
        <div className="flex h-[50vh] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                <p className="text-slate-500 font-medium">Mengalihkan...</p>
            </div>
        </div>
    );
}
