'use client';



import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import styles from './page.module.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            router.refresh();
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Gagal login. Periksa email dan password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <Card className={styles.loginCard}>
                <div className={styles.header}>
                    <div className={styles.logoContainer}>
                        <img src="/logo.png" alt="Logo SMPN 32 SBY" className={styles.logo} />
                    </div>
                    <h1 className={styles.title}>Rekap Budaya Positif</h1>
                    <p className={styles.subtitle}>SMP Negeri 32 Surabaya</p>
                </div>

                <form onSubmit={handleLogin} className={styles.form}>
                    {error && <div className={styles.errorAlert}>{error}</div>}

                    <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@sekolah.sch.id"
                        required
                    />

                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    <Button type="submit" className={styles.submitBtn} isLoading={isLoading}>
                        Masuk
                    </Button>
                </form>
            </Card>
        </div>
    );
}
