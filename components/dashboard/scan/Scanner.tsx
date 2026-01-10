'use client';

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface ScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
    fps?: number;
    qrbox?: number;
}

export default function Scanner({
    onScanSuccess,
    onScanFailure,
    fps = 10,
    qrbox = 250
}: ScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const callbackRef = useRef(onScanSuccess);
    const scannerId = "html5qr-code-full-region";

    // Keep callback ref updated
    useEffect(() => {
        callbackRef.current = onScanSuccess;
    }, [onScanSuccess]);

    useEffect(() => {
        let isMounted = true;

        // Small timeout to ensure DOM is ready and previous instances are cleared
        const timeoutId = setTimeout(() => {
            if (!isMounted) return;

            // Check if element exists
            if (!document.getElementById(scannerId)) {
                console.error(`Element with id ${scannerId} not found`);
                return;
            }

            try {
                // Clear any existing instance just in case
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(() => { });
                }

                const scanner = new Html5QrcodeScanner(
                    scannerId,
                    {
                        fps,
                        qrbox: { width: qrbox, height: qrbox },
                        rememberLastUsedCamera: true,
                        showTorchButtonIfSupported: true
                    },
                    /* verbose= */ false
                );

                scannerRef.current = scanner;

                scanner.render(
                    (decodedText) => {
                        if (callbackRef.current) callbackRef.current(decodedText);
                    },
                    (error) => {
                        if (onScanFailure) onScanFailure(error);
                    }
                );
            } catch (err) {
                console.error("Failed to initialize scanner:", err);
            }
        }, 100);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
            if (scannerRef.current) {
                // Capture the current instance
                const scannerToClear = scannerRef.current;
                scannerToClear.clear().catch(error => {
                    console.warn("Failed to clear html5-qrcode scanner during cleanup", error);
                });
                scannerRef.current = null;
            }
        };
    }, []); // Run once on mount

    return <div id={scannerId} style={{ width: '100%' }} />;
}
