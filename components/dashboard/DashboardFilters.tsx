'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Filter } from 'lucide-react';

interface DashboardFiltersProps {
    initialStartDate: string;
    initialEndDate: string;
}

export function DashboardFilters({ initialStartDate, initialEndDate }: DashboardFiltersProps) {
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleApply = () => {
        setIsLoading(true);
        const params = new URLSearchParams(searchParams.toString());
        params.set('startDate', startDate);
        params.set('endDate', endDate);
        router.push(`${pathname}?${params.toString()}`);
        setTimeout(() => setIsLoading(false), 500);
    };

    return (
        <div style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            marginBottom: '1.5rem'
        }}>
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                alignItems: 'flex-end'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>Tanggal Mulai</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{
                            padding: '0.375rem 0.75rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            color: '#1e293b'
                        }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>Tanggal Akhir</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{
                            padding: '0.375rem 0.75rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            color: '#1e293b'
                        }}
                    />
                </div>
                <div>
                    <Button onClick={handleApply} isLoading={isLoading} size="sm" className="flex items-center gap-2">
                        <Filter size={16} /> Terapkan Filter
                    </Button>
                </div>
            </div>
        </div>
    );
}
