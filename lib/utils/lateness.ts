export interface LatenessRecord {
    point: number;
    notes?: string | null;
    aspect?: { name: string } | null;
    rule?: { name: string } | null;
}

/**
 * Checks if a record qualifies as a lateness violation.
 * Unified logic to be shared between Dashboard actions and Reports client.
 */
export function isRecordLate(r: LatenessRecord): boolean {
    const aspectName = (r.aspect?.name || '').toLowerCase();
    const ruleName = (r.rule?.name || '').toLowerCase();
    const notes = (r.notes || '').toLowerCase();

    const isAttendanceAspect = aspectName === 'kehadiran' || aspectName === 'keterlambatan';
    const isLateText = ruleName.includes('terlambat') || notes.includes('terlambat');
    const isNegativePoint = r.point < 0;

    return isAttendanceAspect && (isNegativePoint || isLateText);
}
