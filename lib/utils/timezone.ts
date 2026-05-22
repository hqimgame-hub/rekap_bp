/**
 * Utility functions for handling timezone conversions between WIB (Asia/Jakarta) and UTC.
 */

export function getJakartaDateString(date: Date = new Date()): string {
    const options = { timeZone: 'Asia/Jakarta', year: 'numeric', month: 'numeric', day: 'numeric' } as const;
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = String(parts.find(p => p.type === 'month')?.value).padStart(2, '0');
    const day = String(parts.find(p => p.type === 'day')?.value).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function getJakartaDayBounds(dateStr: string) {
    const [year, month, day] = dateStr.split('-').map(Number);
    // 00:00 WIB in Jakarta is equivalent to 17:00 UTC on the previous day (WIB = UTC+7)
    const localMidnightUTC = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
    const startUTC = new Date(localMidnightUTC - 7 * 60 * 60 * 1000);
    const endUTC = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    return {
        start: startUTC.toISOString(),
        end: endUTC.toISOString()
    };
}

export function getJakartaTodayBounds() {
    return getJakartaDayBounds(getJakartaDateString());
}
