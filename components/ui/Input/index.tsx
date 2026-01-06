import React from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
    const inputId = id || props.name;

    return (
        <div className={styles.wrapper}>
            {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
            <input
                id={inputId}
                className={`${styles.input} ${error ? styles.errorInput : ''} ${className || ''}`}
                {...props}
            />
            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
}
