'use server';

import { createClient } from '@/lib/supabase/server';

export interface RecordsFilter {
    startDate?: string;
    endDate?: string;
    classId?: string;
    type?: 'positive' | 'negative' | 'neutral';
}

export async function getRecords(filters: RecordsFilter = {}) {
    const supabase = await createClient();

    let query = supabase
        .from('records')
        .select(`
            id,
            point,
            input_date,
            created_at,
            student:students!inner(id, name, gender, nisn),
            class:classes!inner(id, name),
            aspect:aspects!inner(id, name, type),
            rule:aspect_rules!inner(id, name)
        `)
        .order('input_date', { ascending: false });

    if (filters.classId) {
        query = query.eq('class_id', filters.classId);
    }

    if (filters.startDate) {
        query = query.gte('input_date', filters.startDate);
    }

    if (filters.endDate) {
        // Add time to end date to include the full day
        const endDateTime = new Date(filters.endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query = query.lte('input_date', endDateTime.toISOString());
    }

    if (filters.type) {
        // We filter on the joined aspect table
        // Supabase/Postgrest allows filtering on joined tables
        // syntax: aspect.type
        query = query.eq('aspect.type', filters.type);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching records:', error);
        throw new Error(error.message);
    }

    return data;
}

export async function getClasses() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');

    if (error) throw new Error(error.message);
    return data;
}
export async function exportPdfReport(classId: string, filters: RecordsFilter = {}) {
    const supabase = await createClient();

    // Get class name
    const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('name')
        .eq('id', classId)
        .single();
    if (classError) throw new Error(classError.message);
    const className = classData?.name || 'Kelas';

    // Fetch records for this class with filters
    const records = await getRecords({ ...filters, classId });

    // Generate PDF using pdf-lib
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const margin = 40;
    let y = height - margin;

    // Title
    const title = `Laporan Poin Kelas ${className}`;
    page.drawText(title, {
        x: margin,
        y,
        size: 20,
        font: fontBold,
        color: rgb(0, 0, 0),
    });
    y -= 30;

    // Table header
    const headers = ['Tanggal', 'NISN', 'Siswa', 'Aspek', 'Aturan', 'Poin'];
    const colWidths = [60, 70, 100, 100, 120, 40];
    let x = margin;
    headers.forEach((text, i) => {
        page.drawText(text, { x, y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
        x += colWidths[i];
    });
    y -= 20;

    // Table rows
    records.forEach((rec: any) => {
        x = margin;
        const row = [
            new Date(rec.input_date).toLocaleDateString('id-ID'),
            rec.student?.nisn ?? '-',
            rec.student?.name ?? '-',
            rec.aspect?.name ?? '-',
            rec.rule?.name ?? '-',
            rec.point?.toString() ?? '0',
        ];
        row.forEach((cell, i) => {
            page.drawText(cell, { x, y, size: 10, font, color: rgb(0, 0, 0) });
            x += colWidths[i];
        });
        y -= 15;
        if (y < margin) {
            // Add new page if needed
            const newPage = pdfDoc.addPage();
            y = height - margin;
        }
    });

    const pdfBytes = await pdfDoc.save();
    // Return as base64 string for client download
    return Buffer.from(pdfBytes).toString('base64');
}
