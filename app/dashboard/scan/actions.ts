'use server';

import { createClient } from '@/lib/supabase/server';

export interface QRFormProps {
    aspects: any[];
    classes: any[];
}

// Re-enabled DB fetching
export async function getQRFormProps() {
    console.log('[getQRFormProps] Fetching data...');
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    let role = 'petugas';
    if (userData.user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userData.user.id)
            .single();
        if (profile) role = profile.role;
    }

    console.log('[getQRFormProps] User role:', role);

    const [{ data: aspects }, { data: classes }] = await Promise.all([
        supabase.from('aspects').select('id, name, type, aspect_rules (id, name, point)') as any,
        supabase.from('classes').select('id, name') as any,
    ]);

    console.log('[getQRFormProps] DB queries complete');
    return { aspects: aspects || [], classes: classes || [], role } as any;
}

export async function recordFromQR(token: string, aspectId?: string, ruleId?: string, date?: string) {
    const supabase = await createClient();
    const now = new Date();
    const currentDate = date || now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:mm

    // 1. Identify Student
    const { data: student, error: stuErr } = await supabase
        .from('students')
        .select('id, name, class_id')
        .eq('id', token)
        .single();
    if (stuErr) throw new Error('Siswa tidak ditemukan');

    let finalPoint = 0;
    let finalAspectId = aspectId;
    let finalRuleId = ruleId;
    let notes = `Hadir jam ${currentTime}`;
    let isLate = false;
    let lateMinutes = 0;

    // 2. Handle Automated Attendance (if no aspect/rule provided)
    if (!aspectId || !ruleId) {
        // Fetch Settings
        const { data: settings } = await supabase.from('settings').select('key, value');
        const settingsMap = (settings || []).reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});

        const startTime = settingsMap.school_start_time || '07:30';
        const interval = parseInt(settingsMap.late_penalty_minutes || '5');
        const penaltyPerInterval = parseInt(settingsMap.late_penalty_points || '-1');

        // Check Lateness
        const [startH, startM] = startTime.split(':').map(Number);
        const [currH, currM] = currentTime.split(':').map(Number);

        const startTotalMinutes = startH * 60 + startM;
        const currTotalMinutes = currH * 60 + currM;

        if (currTotalMinutes > startTotalMinutes) {
            isLate = true;
            lateMinutes = currTotalMinutes - startTotalMinutes;
            const intervalsLate = Math.floor(lateMinutes / interval);
            finalPoint = intervalsLate * penaltyPerInterval;
            notes += ` - Terlambat ${lateMinutes} menit (${finalPoint} poin)`;
        }

        // Find "Kehadiran" Aspect
        const { data: aspect } = await supabase
            .from('aspects')
            .select('id')
            .eq('name', 'Kehadiran')
            .single();

        if (aspect) {
            finalAspectId = aspect.id;
        } else {
            // Create aspect if missing? Or just use a fallback. 
            // For now let's hope it exists or create it silently
            const { data: newAspect } = await supabase.from('aspects').insert({
                name: 'Kehadiran',
                type: 'negative', // Since it handles penalties
                input_type: 'qr',
                active: true
            }).select().single();
            finalAspectId = newAspect?.id;
        }
    } else {
        // Manual Record logic
        const { data: rule } = await supabase
            .from('aspect_rules')
            .select('point')
            .eq('id', ruleId)
            .single();
        finalPoint = rule?.point || 0;
    }

    // 3. Insert Record
    const { error } = await supabase.from('records').insert({
        student_id: student.id,
        class_id: student.class_id,
        aspect_id: finalAspectId,
        rule_id: finalRuleId || null,
        point: finalPoint,
        input_date: currentDate,
        notes: notes,
        input_by: (await supabase.auth.getUser()).data.user?.id,
    });

    if (error) throw new Error(error.message);

    return {
        success: true,
        studentName: student.name,
        arrivalTime: currentTime,
        isLate,
        lateMinutes,
        point: finalPoint
    };
}
