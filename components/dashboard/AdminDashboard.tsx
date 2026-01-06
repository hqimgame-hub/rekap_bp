import { Card } from '@/components/ui/Card';

export function AdminDashboard() {
    return (
        <div>
            <h1 style={{ marginBottom: '1.5rem' }}>Admin Dashboard</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <Card title="Total Siswa">
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>-</p>
                </Card>
                <Card title="Total Kelas">
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>-</p>
                </Card>
                <Card title="Poin Hari Ini">
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>-</p>
                </Card>
            </div>
        </div>
    );
}
