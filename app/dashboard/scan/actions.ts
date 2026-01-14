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
        .select('id, name, class_id, class:classes(name)')
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
        className: (student.class as any)?.name || 'Kelas ?', // Added className
        arrivalTime: currentTime,
        isLate,
        lateMinutes,
        point: finalPoint
    };
}

// Get students for manual input with optional class filter
export async function getStudentsForInput(classId?: string, search?: string) {
    try {
        const supabase = await createClient();

        // Should not return anything if no filter is active to prevent heavy load
        if (!classId && (!search || search.length < 3)) {
            return [];
        }

        let query = supabase
            .from('students')
            .select('id, name, nisn, class_id, class:classes(name)')
            .order('name');

        if (classId) {
            query = query.eq('class_id', classId);
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,nisn.ilike.%${search}%`);
        }

        // Limit results if searching without class filter to avoid massive data
        if (!classId && search) {
            query = query.limit(50);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[getStudentsForInput] Supabase query error:', error);
            throw new Error(error.message);
        }

        return data || [];
    } catch (error: any) {
        console.error('[getStudentsForInput] Fetch error:', error);
        if (error.message && (error.message.includes('fetch failed') || error.message.includes('undici'))) {
            throw new Error('Koneksi ke server gagal. Periksa koneksi internet Anda.');
        }
        throw new Error(error.message || 'Gagal memuat data siswa.');
    }
}

// Record manual attendance with arrival time
export async function recordManualAttendance(studentId: string, arrivalTime: string) {
    const supabase = await createClient();
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];

    // 1. Get student info
    const { data: student, error: stuErr } = await supabase
        .from('students')
        .select('id, name, class_id, class:classes(name)')
        .eq('id', studentId)
        .single();

    if (stuErr || !student) throw new Error('Siswa tidak ditemukan');

    // 2. Fetch Settings
    const { data: settings } = await supabase.from('settings').select('key, value');
    const settingsMap = (settings || []).reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});

    const startTime = settingsMap.school_start_time || '07:30';
    const interval = parseInt(settingsMap.late_penalty_minutes || '5');
    const penaltyPerInterval = parseInt(settingsMap.late_penalty_points || '-1');

    // 3. Calculate lateness
    const [startH, startM] = startTime.split(':').map(Number);
    const [arrivalH, arrivalM] = arrivalTime.split(':').map(Number);

    const startTotalMinutes = startH * 60 + startM;
    const arrivalTotalMinutes = arrivalH * 60 + arrivalM;

    let isLate = false;
    let lateMinutes = 0;
    let finalPoint = 0;
    let notes = `Hadir jam ${arrivalTime}`;

    if (arrivalTotalMinutes > startTotalMinutes) {
        isLate = true;
        lateMinutes = arrivalTotalMinutes - startTotalMinutes;
        const intervalsLate = Math.floor(lateMinutes / interval);
        finalPoint = intervalsLate * penaltyPerInterval;
        notes += ` - Terlambat ${lateMinutes} menit (${finalPoint} poin)`;
    }

    // 4. Find or create "Kehadiran" aspect
    let finalAspectId: string | undefined;
    const { data: aspect } = await supabase
        .from('aspects')
        .select('id')
        .eq('name', 'Kehadiran')
        .single();

    if (aspect) {
        finalAspectId = aspect.id;
    } else {
        const { data: newAspect } = await supabase.from('aspects').insert({
            name: 'Kehadiran',
            type: 'negative',
            input_type: 'qr',
            active: true
        }).select().single();
        finalAspectId = newAspect?.id;
    }

    // 5. Insert record
    const { error } = await supabase.from('records').insert({
        student_id: student.id,
        class_id: student.class_id,
        aspect_id: finalAspectId,
        rule_id: null,
        point: finalPoint,
        input_date: currentDate,
        notes: notes,
        input_by: (await supabase.auth.getUser()).data.user?.id,
    });

    if (error) throw new Error(error.message);

    return {
        success: true,
        studentName: student.name,
        className: (student.class as any)?.name || 'Kelas ?', // Added className
        arrivalTime: arrivalTime,
        isLate,
        lateMinutes,
        point: finalPoint
    };
}
