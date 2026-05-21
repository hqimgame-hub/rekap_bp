'use server';

import { createClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

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
            notes,
            input_date,
            created_at,
            student:students!inner(id, name, gender, nisn),
            class:classes!inner(id, name),
            aspect:aspects!inner(id, name, type),
            rule:aspect_rules(id, name)
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

    // 1. Get class name
    const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('name')
        .eq('id', classId)
        .single();
    if (classError) throw new Error(classError.message);
    const className = classData?.name || 'Kelas';

    // 2. Fetch records for this class with filters
    const records = await getRecords({ ...filters, classId });

    // 3. Fetch Walas and Kepsek names for the signature block
    const { data: walasData } = await supabase
        .from('profiles')
        .select('name')
        .eq('role', 'walas')
        .eq('class_id', classId)
        .maybeSingle();
    const walasName = walasData?.name || '____________________';

    const { data: kepsekData } = await supabase
        .from('profiles')
        .select('name')
        .eq('role', 'kepsek')
        .limit(1)
        .maybeSingle();
    const kepsekName = kepsekData?.name || '____________________';

    // 4. Load School Logo from filesystem
    let logoBytes: Buffer | null = null;
    try {
        const logoPath = path.join(process.cwd(), 'public', 'logo.png');
        if (fs.existsSync(logoPath)) {
            logoBytes = fs.readFileSync(logoPath);
        }
    } catch (err) {
        console.error('Error reading school logo:', err);
    }

    // 5. Generate PDF using pdf-lib
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Embed logo if available
    const logoImage = logoBytes ? await pdfDoc.embedPng(logoBytes) : null;

    // A4 dimensions: 595 x 842 points
    const width = 595;
    const height = 842;
    const margin = 40;
    const contentWidth = width - 2 * margin; // 515

    let page = pdfDoc.addPage([width, height]);
    let y = height - margin;

    // Helper: Truncate Text
    const truncateText = (text: string, maxWidth: number, fontSize: number) => {
        if (font.widthOfTextAtSize(text, fontSize) <= maxWidth) return text;
        let temp = text;
        while (temp.length > 0 && font.widthOfTextAtSize(temp + '...', fontSize) > maxWidth) {
            temp = temp.slice(0, -1);
        }
        return temp + '...';
    };

    // Helper: Draw Header (Logo, School Name, Doc Title) on first page
    const drawHeader = () => {
        // Logo
        if (logoImage) {
            page.drawImage(logoImage, {
                x: margin,
                y: y - 50,
                width: 50,
                height: 50,
            });
        }
        
        // School Name & Title
        page.drawText('SMP NEGERI 32 SURABAYA', {
            x: margin + 60,
            y: y - 18,
            size: 14,
            font: fontBold,
            color: rgb(0.059, 0.09, 0.165),
        });
        
        page.drawText('LAPORAN BUDAYA POSITIF', {
            x: margin + 60,
            y: y - 36,
            size: 12,
            font: fontBold,
            color: rgb(0.12, 0.16, 0.23),
        });

        page.drawText('Catatan Pelanggaran dan Prestasi Siswa', {
            x: margin + 60,
            y: y - 48,
            size: 9,
            font,
            color: rgb(0.39, 0.45, 0.55),
        });

        // Double lines separator
        page.drawLine({
            start: { x: margin, y: y - 58 },
            end: { x: width - margin, y: y - 58 },
            thickness: 2,
            color: rgb(0.12, 0.16, 0.23),
        });
        page.drawLine({
            start: { x: margin, y: y - 62 },
            end: { x: width - margin, y: y - 62 },
            thickness: 0.5,
            color: rgb(0.12, 0.16, 0.23),
        });
        
        y -= 62;
    };

    // 6. Draw Header on page 1
    drawHeader();
    y -= 15; // Gap below header line

    // 7. Draw Metadata Section
    const startDateFormatted = filters.startDate 
        ? new Date(filters.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        : '-';
    const endDateFormatted = filters.endDate
        ? new Date(filters.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        : '-';
    const periodStr = filters.startDate && filters.endDate 
        ? `${startDateFormatted} s.d. ${endDateFormatted}`
        : 'Semua Periode';
    const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    page.drawText('Kelas', { x: margin, y, size: 9, font: fontBold, color: rgb(0.059, 0.09, 0.165) });
    page.drawText(`: ${className}`, { x: margin + 80, y, size: 9, font, color: rgb(0.059, 0.09, 0.165) });
    
    page.drawText('Periode', { x: margin, y: y - 14, size: 9, font: fontBold, color: rgb(0.059, 0.09, 0.165) });
    page.drawText(`: ${periodStr}`, { x: margin + 80, y: y - 14, size: 9, font, color: rgb(0.059, 0.09, 0.165) });

    page.drawText('Tanggal Cetak', { x: margin, y: y - 28, size: 9, font: fontBold, color: rgb(0.059, 0.09, 0.165) });
    page.drawText(`: ${printDate}`, { x: margin + 80, y: y - 28, size: 9, font, color: rgb(0.059, 0.09, 0.165) });

    y -= 28;
    y -= 15; // Gap below metadata

    // 8. Calculate Stats & Draw Summary Box
    const totalPositive = records.reduce((sum, r) => r.point > 0 ? sum + r.point : sum, 0);
    const totalNegative = records.reduce((sum, r) => r.point < 0 ? sum + r.point : sum, 0);
    const netScore = totalPositive + totalNegative;

    // Draw background card for stats
    page.drawRectangle({
        x: margin,
        y: y - 45,
        width: contentWidth,
        height: 45,
        color: rgb(0.941, 0.961, 0.976), // Slate 100 #f1f5f9
        borderColor: rgb(0.882, 0.91, 0.941), // Slate 200 #e2e8f0
        borderWidth: 1,
    });

    // Draw Stats Text
    // Positive
    page.drawText('Total Poin Positif', { x: margin + 15, y: y - 18, size: 8, font, color: rgb(0.39, 0.45, 0.55) });
    page.drawText(`+${totalPositive}`, { x: margin + 15, y: y - 36, size: 14, font: fontBold, color: rgb(0.02, 0.588, 0.412) });

    // Negative
    page.drawText('Total Poin Negatif', { x: margin + 180, y: y - 18, size: 8, font, color: rgb(0.39, 0.45, 0.55) });
    page.drawText(`${totalNegative}`, { x: margin + 180, y: y - 36, size: 14, font: fontBold, color: rgb(0.863, 0.149, 0.149) });

    // Net Score
    page.drawText('Net Skor Periode Ini', { x: margin + 350, y: y - 18, size: 8, font, color: rgb(0.39, 0.45, 0.55) });
    const netColor = netScore >= 0 ? rgb(0.02, 0.588, 0.412) : rgb(0.863, 0.149, 0.149);
    page.drawText(`${netScore > 0 ? '+' : ''}${netScore}`, { x: margin + 350, y: y - 36, size: 14, font: fontBold, color: netColor });

    y -= 45;
    y -= 20; // Gap below stats card

    // 9. Table Setup
    const headers = ['Tanggal', 'NISN', 'Nama Siswa', 'Aspek', 'Perilaku', 'Poin'];
    const colWidths = [65, 70, 115, 95, 130, 40]; // Sums up to 515 (contentWidth)
    const colAlign = ['left', 'left', 'left', 'left', 'left', 'right'];
    const headerHeight = 24;
    const rowHeight = 20;
    const bottomMargin = 60;

    // Helper: Draw Table Headers
    const drawTableHeaders = (p: any, yCoord: number) => {
        // Draw background header rect
        p.drawRectangle({
            x: margin,
            y: yCoord - headerHeight,
            width: contentWidth,
            height: headerHeight,
            color: rgb(0.118, 0.161, 0.231), // slate-800 #1e293b
        });

        let currentX = margin;
        headers.forEach((headerText, i) => {
            const textWidth = fontBold.widthOfTextAtSize(headerText, 9);
            const xText = colAlign[i] === 'right'
                ? currentX + colWidths[i] - textWidth - 8
                : currentX + 8;
            
            p.drawText(headerText, {
                x: xText,
                y: yCoord - headerHeight + 7,
                size: 9,
                font: fontBold,
                color: rgb(1, 1, 1),
            });
            currentX += colWidths[i];
        });
    };

    // Draw headers for page 1
    drawTableHeaders(page, y);
    y -= headerHeight;

    // 10. Draw Table Rows
    records.forEach((rec: any, index: number) => {
        // Check if page needs to break
        if (y - rowHeight < bottomMargin) {
            page = pdfDoc.addPage([width, height]);
            y = height - margin;

            // Draw continuation header
            page.drawText(`Laporan Budaya Positif - Kelas ${className} (Lanjutan)`, {
                x: margin,
                y: y - 15,
                size: 8,
                font: fontBold,
                color: rgb(0.39, 0.45, 0.55),
            });
            y -= 25;

            // Draw table headers on new page
            drawTableHeaders(page, y);
            y -= headerHeight;
        }

        // Draw Row Background (Zebra Striping)
        const isEven = index % 2 === 0;
        const rowBgColor = isEven ? rgb(1, 1, 1) : rgb(0.973, 0.98, 0.988); // White vs slate-50
        page.drawRectangle({
            x: margin,
            y: y - rowHeight,
            width: contentWidth,
            height: rowHeight,
            color: rowBgColor,
            borderColor: rgb(0.882, 0.91, 0.941), // border-slate-200
            borderWidth: 0.5,
        });

        // Row Data values
        const rowData = [
            new Date(rec.input_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' }),
            rec.student?.nisn ?? '-',
            rec.student?.name ?? '-',
            rec.aspect?.name ?? '-',
            rec.rule?.name ?? '-',
            rec.point?.toString() ?? '0',
        ];

        let currentX = margin;
        rowData.forEach((val, i) => {
            let cellText = val;
            const maxTextWidth = colWidths[i] - 16; // padding 8 points on left and right

            // Truncate long strings for Nama, Aspek, and Perilaku
            if (i === 2 || i === 3 || i === 4) {
                cellText = truncateText(val, maxTextWidth, 8);
            }

            const textWidth = font.widthOfTextAtSize(cellText, 8);
            const xText = colAlign[i] === 'right'
                ? currentX + colWidths[i] - textWidth - 8
                : currentX + 8;

            // Text coloring for points
            let textColor = rgb(0.059, 0.09, 0.165);
            let textFont = font;
            if (i === 5) {
                textFont = fontBold;
                const pt = rec.point || 0;
                textColor = pt > 0 
                    ? rgb(0.02, 0.588, 0.412)  // Green
                    : pt < 0 
                        ? rgb(0.863, 0.149, 0.149) // Red
                        : rgb(0.059, 0.09, 0.165); // Neutral
            }

            page.drawText(cellText, {
                x: xText,
                y: y - rowHeight + 6,
                size: 8,
                font: textFont,
                color: textColor,
            });

            currentX += colWidths[i];
        });

        y -= rowHeight;
    });

    // 11. Draw Signature Block
    const sigBlockHeight = 110;
    // Check if signature block fits on the current page
    if (y - sigBlockHeight < bottomMargin) {
        page = pdfDoc.addPage([width, height]);
        y = height - margin - 20;
    } else {
        y -= 25; // Space before signature
    }

    // Left Signature: Kepala Sekolah
    page.drawText('Mengetahui,', { x: margin + 30, y: y, size: 9, font, color: rgb(0.059, 0.09, 0.165) });
    page.drawText('Kepala Sekolah,', { x: margin + 30, y: y - 12, size: 9, font: fontBold, color: rgb(0.059, 0.09, 0.165) });
    
    page.drawText(`( ${kepsekName} )`, { x: margin + 30, y: y - 75, size: 9, font: fontBold, color: rgb(0.059, 0.09, 0.165) });
    page.drawText('NIP. ___________________________', { x: margin + 30, y: y - 87, size: 8, font, color: rgb(0.39, 0.45, 0.55) });

    // Right Signature: Wali Kelas
    page.drawText(`Surabaya, ${printDate}`, { x: width - margin - 170, y: y, size: 9, font, color: rgb(0.059, 0.09, 0.165) });
    page.drawText('Wali Kelas,', { x: width - margin - 170, y: y - 12, size: 9, font: fontBold, color: rgb(0.059, 0.09, 0.165) });
    
    page.drawText(`( ${walasName} )`, { x: width - margin - 170, y: y - 75, size: 9, font: fontBold, color: rgb(0.059, 0.09, 0.165) });
    page.drawText('NIP. ___________________________', { x: width - margin - 170, y: y - 87, size: 8, font, color: rgb(0.39, 0.45, 0.55) });

    // 12. Draw Page Numbers at the footer
    const pages = pdfDoc.getPages();
    pages.forEach((p, idx) => {
        p.drawText(`Halaman ${idx + 1} dari ${pages.length}`, {
            x: width - margin - 80,
            y: 20,
            size: 8,
            font,
            color: rgb(0.39, 0.45, 0.55),
        });
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes).toString('base64');
}
