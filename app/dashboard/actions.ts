'use server';

import { createClient } from '@/lib/supabase/server';

export interface DashboardStats {
    totalStudents: number;
    totalClasses: number;
    pointsToday: number;
    negativePointsToday: number;
    topClassesPositive?: { name: string; points: number }[];
    topClassesNegative?: { name: string; points: number }[];
    violationByAspect?: { name: string; points: number }[];
    topStudentsPositive?: { name: string; points: number }[];
    topStudentsNegative?: { name: string; points: number }[];
    lateToday: number;
    lateStudentsList?: { name: string; className: string; time: string; point: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats | null> {
    const supabase = await createClient();

    // Get current user role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, class_id')
        .eq('id', user.id)
        .single();

    const role = profile?.role;
    const classId = profile?.class_id;

    // Fetch stats based on role
    let stats: DashboardStats = {
        totalStudents: 0,
        totalClasses: 0,
        pointsToday: 0,
        negativePointsToday: 0,
        lateToday: 0,
        lateStudentsList: []
    };

    // 1. Total Students
    let studentsQuery = supabase.from('students').select('*', { count: 'exact', head: true });
    if (role === 'walas' && classId) {
        studentsQuery = studentsQuery.eq('class_id', classId);
    }
    const { count: studentCount } = await studentsQuery;
    stats.totalStudents = studentCount || 0;

    // 2. Total Classes
    if (role === 'admin' || role === 'kepsek') {
        const { count: classCount } = await supabase.from('classes').select('*', { count: 'exact', head: true });
        stats.totalClasses = classCount || 0;
    }

    // 3. Points Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let recordsQuery = supabase.from('records').select('point', { count: 'exact' }).gte('input_date', today.toISOString());
    if (role === 'walas' && classId) {
        recordsQuery = recordsQuery.eq('class_id', classId);
    }
    const { data: recordsData } = await recordsQuery;
    if (recordsData) {
        stats.pointsToday = recordsData.filter(r => r.point > 0).length;
        stats.negativePointsToday = recordsData.filter(r => r.point < 0).length;
    }

    // 4. Class Rankings (Top Positive & Top Negative)
    if (role === 'admin' || role === 'kepsek') {
        const { data: classStats } = await supabase
            .from('records')
            .select('point, class:classes(name)')
            .not('class_id', 'is', null);

        if (classStats) {
            const classMap = new Map();
            classStats.forEach((r: any) => {
                const name = r.class?.name || 'Unknown';
                classMap.set(name, (classMap.get(name) || 0) + r.point);
            });
            const sortedClasses = Array.from(classMap.entries())
                .map(([name, points]) => ({ name, points }));

            stats.topClassesPositive = [...sortedClasses]
                .sort((a, b) => b.points - a.points)
                .slice(0, 5);

            stats.topClassesNegative = [...sortedClasses]
                .sort((a, b) => a.points - b.points)
                .slice(0, 5);
        }

        // 5. Violation Comparison (Grouping negative points by aspect)
        const { data: violationStats } = await supabase
            .from('records')
            .select('point, aspect:aspects(name)')
            .lt('point', 0)
            .not('aspect_id', 'is', null);

        if (violationStats) {
            const aspectMap = new Map();
            violationStats.forEach((r: any) => {
                const name = r.aspect?.name || 'Unknown';
                aspectMap.set(name, (aspectMap.get(name) || 0) + Math.abs(r.point));
            });
            stats.violationByAspect = Array.from(aspectMap.entries())
                .map(([name, points]) => ({ name, points }))
                .sort((a, b) => b.points - a.points);
        }

        // 6. Top Students Leaderboard
        const { data: studentStats } = await supabase
            .from('records')
            .select('point, student:students(name)')
            .not('student_id', 'is', null);

        if (studentStats) {
            const studentMap = new Map();
            studentStats.forEach((r: any) => {
                const name = r.student?.name || 'Unknown';
                studentMap.set(name, (studentMap.get(name) || 0) + r.point);
            });
            const sortedStudents = Array.from(studentMap.entries())
                .map(([name, points]) => ({ name, points }));

            stats.topStudentsPositive = sortedStudents
                .filter(s => s.points > 0)
                .sort((a, b) => b.points - a.points)
                .slice(0, 5);

            stats.topStudentsNegative = sortedStudents
                .filter(s => s.points < 0)
                .sort((a, b) => a.points - b.points) // Most negative first
                .slice(0, 5);
        }
    }

    // Walas Specific Analytics (Violations in their class)
    if (role === 'walas' && classId) {
        // 1. Top Violations by Aspect in Class
        const { data: vByAspect } = await supabase
            .from('records')
            .select('point, aspect:aspects(name)')
            .eq('class_id', classId)
            .lt('point', 0);

        const aspectMap = new Map();
        (vByAspect || []).forEach((r: any) => {
            const name = r.aspect?.name || 'Unknown';
            aspectMap.set(name, (aspectMap.get(name) || 0) + Math.abs(r.point));
        });
        stats.violationByAspect = Array.from(aspectMap.entries())
            .map(([name, points]) => ({ name, points }))
            .sort((a, b) => b.points - a.points)
            .slice(0, 5);

        // 2. Top Students with Violations in Class
        const { data: vByStudent } = await supabase
            .from('records')
            .select('point, student:students(name)')
            .eq('class_id', classId)
            .lt('point', 0);

        const studentMap = new Map();
        (vByStudent || []).forEach((r: any) => {
            const name = r.student?.name || 'Unknown';
            studentMap.set(name, (studentMap.get(name) || 0) + Math.abs(r.point));
        });
        stats.topStudentsNegative = Array.from(studentMap.entries())
            .map(([name, points]) => ({ name, points }))
            .sort((a, b) => b.points - a.points)
            .slice(0, 5);
    }

    // 7. Lateness Statistics (Specific Logic for Late Students)
    // Criteria: Aspect is 'Kehadiran' AND (Point < 0 OR Notes contains "Terlambat")
    let latenessQuery = supabase
        .from('records')
        .select('point, notes, input_date, student:students(name, class:classes(name)), aspect:aspects(name)')
        .gte('input_date', today.toISOString())
        .not('student_id', 'is', null);

    if (role === 'walas' && classId) {
        latenessQuery = latenessQuery.eq('class_id', classId);
    }

    // We fetch all records for today first to filter in memory for complex logic (OR condition on joined table is tricky)
    const { data: potentialLateData } = await latenessQuery;

    if (potentialLateData) {
        const lateRecords = potentialLateData.filter((r: any) => {
            const aspectName = r.aspect?.name || '';
            const isAttendance = aspectName === 'Kehadiran' || aspectName === 'Keterlambatan';
            const isLate = r.point < 0 || (r.notes && r.notes.toLowerCase().includes('terlambat'));
            return isAttendance && isLate;
        });

        stats.lateToday = lateRecords.length;

        // Populate list
        stats.lateStudentsList = lateRecords.map((r: any) => {
            let time = '-';
            const timeMatch = r.notes?.match(/jam\s+(\d{2}:\d{2})/i);
            if (timeMatch) time = timeMatch[1];

            return {
                name: r.student?.name || 'Unknown',
                className: ((r.student as any)?.class?.name) || '-',
                time: time,
                point: r.point
            };
        });
    }

    return stats;
}
