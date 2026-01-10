'use client';

import React from 'react';
import styles from './Table.module.css';

interface TableProps {
    children: React.ReactNode;
}

export function Table({ children }: TableProps) {
    return (
        <div className={styles.wrapper}>
            <table className={styles.table}>
                {children}
            </table>
        </div>
    );
}

export function TableHead({ children }: { children: React.ReactNode }) {
    return <thead className={styles.thead}>{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
    return <tbody className={styles.tbody}>{children}</tbody>;
}

export function TableRow({ children, className }: { children: React.ReactNode; className?: string }) {
    return <tr className={`${styles.tr} ${className || ''}`}>{children}</tr>;
}

export function TableHeader({ children, className }: { children: React.ReactNode; className?: string }) {
    return <th className={`${styles.th} ${className || ''}`}>{children}</th>;
}

export function TableCell({ children, className, colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
    return <td colSpan={colSpan} className={`${styles.td} ${className || ''}`}>{children}</td>;
}
