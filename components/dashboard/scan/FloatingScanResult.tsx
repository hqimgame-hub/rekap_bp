'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Clock, AlertTriangle, User, CalendarDays } from 'lucide-react';

interface FloatingScanResultProps {
    result: {
        success: boolean;
        studentName?: string;
        className?: string;
        arrivalTime?: string;
        isLate?: boolean;
        lateMinutes?: number;
        point?: number;
        message?: string;
    };
    onDismiss: () => void;
}

export default function FloatingScanResult({ result, onDismiss }: FloatingScanResultProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Small delay to ensure animation plays correctly after mount
        const timer = setTimeout(() => setIsVisible(true), 10);

        // Auto dismiss after 3 seconds
        const autoDismissTimer = setTimeout(() => {
            handleClose();
        }, 3300);

        return () => {
            clearTimeout(timer);
            clearTimeout(autoDismissTimer);
        };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
    };

    if (!mounted || !result) return null;

    const { success, isLate, studentName, arrivalTime, lateMinutes, point, message } = result;

    const status = !success ? 'error' : isLate ? 'late' : 'success';

    // Theme Configuration
    const theme = {
        success: {
            accent: '#059669', // emerald-600
            bg: '#ecfdf5', // emerald-50
            border: '#d1fae5', // emerald-100
            title: 'Berhasil Masuk',
            icon: CheckCircle2
        },
        late: {
            accent: '#d97706', // amber-600
            bg: '#fffbeb', // amber-50
            border: '#fef3c7', // amber-100
            title: 'Terlambat Hadir',
            icon: Clock
        },
        error: {
            accent: '#e11d48', // rose-600
            bg: '#fff1f2', // rose-50
            border: '#ffe4e6', // rose-100
            title: 'Gagal',
            icon: XCircle
        }
    };

    const currentTheme = theme[status];
    const Icon = currentTheme.icon;

    return createPortal(
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                pointerEvents: isVisible ? 'auto' : 'none',
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
        >
            {/* Backdrop */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.4)', // slate-900/40
                    backdropFilter: 'blur(4px)',
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.3s ease-out'
                }}
                onClick={handleClose}
            />

            {/* Main Card */}
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '400px',
                    backgroundColor: 'white',
                    borderRadius: '24px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    overflow: 'hidden',
                    margin: '0 20px'
                }}
            >
                {/* Decorative Top Border */}
                <div style={{ height: '6px', width: '100%', backgroundColor: currentTheme.accent }} />

                <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                    {/* Icon */}
                    <div style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        backgroundColor: currentTheme.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px auto',
                        color: currentTheme.accent
                    }}>
                        <Icon size={36} strokeWidth={2.5} />
                    </div>

                    {/* Title */}
                    <h3 style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: currentTheme.accent,
                        marginBottom: '4px',
                        letterSpacing: '-0.5px'
                    }}>
                        {currentTheme.title}
                    </h3>

                    {/* Subtitle */}
                    <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
                        {success
                            ? (isLate ? 'Siswa tercatat terlambat hadir' : 'Siswa hadir tepat waktu')
                            : (message || 'Terjadi kesalahan sistem')}
                    </p>

                    {success && (
                        <div style={{ backgroundColor: '#f8fafc', borderRadius: '16px', padding: '16px', border: '1px solid #f1f5f9' }}>
                            {/* Student Name & Class */}
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{
                                    fontSize: '18px',
                                    fontWeight: 700,
                                    color: '#1e293b',
                                    lineHeight: '1.3'
                                }}>
                                    {studentName}
                                </div>
                                {result.className && (
                                    <div style={{
                                        fontSize: '14px',
                                        color: '#64748b',
                                        marginTop: '4px',
                                        fontWeight: 600
                                    }}>
                                        {result.className}
                                    </div>
                                )}
                            </div>

                            {/* Stats Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {/* Time Box */}
                                <div style={{
                                    backgroundColor: 'white',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>
                                        JAM MASUK
                                    </span>
                                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#334155', fontFamily: 'monospace' }}>
                                        {arrivalTime}
                                    </span>
                                </div>

                                {/* Points Box - ALWAYS SHOW POINTS */}
                                <div style={{
                                    backgroundColor: (point || 0) < 0 ? '#fff1f2' : '#eff6ff',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: `1px solid ${(point || 0) < 0 ? '#ffe4e6' : '#dbeafe'}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center'
                                }}>
                                    <span style={{
                                        fontSize: '10px',
                                        textTransform: 'uppercase',
                                        color: (point || 0) < 0 ? '#e11d48' : '#2563eb',
                                        fontWeight: 700,
                                        marginBottom: '4px'
                                    }}>
                                        POIN
                                    </span>
                                    <span style={{
                                        fontSize: '18px',
                                        fontWeight: 800,
                                        color: (point || 0) < 0 ? '#be123c' : '#1d4ed8'
                                    }}>
                                        {(point || 0) > 0 ? '+' : ''}{point}
                                    </span>
                                </div>
                            </div>

                            {/* Late Info - Only if late */}
                            {isLate && (
                                <div style={{
                                    marginTop: '12px',
                                    backgroundColor: '#fffbeb',
                                    padding: '10px',
                                    borderRadius: '12px',
                                    border: '1px solid #fef3c7',
                                    color: '#b45309',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}>
                                    <Clock size={14} />
                                    <span>Terlambat {lateMinutes} menit</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div style={{ height: '4px', width: '100%', backgroundColor: '#f1f5f9' }}>
                    <div
                        style={{
                            height: '100%',
                            width: '100%',
                            backgroundColor: currentTheme.accent,
                            transformOrigin: 'left',
                            transform: isVisible ? 'scaleX(0)' : 'scaleX(1)',
                            transition: isVisible ? 'transform 3s linear' : 'none'
                        }}
                    />
                </div>
            </div>
        </div>,
        document.body
    );
}
