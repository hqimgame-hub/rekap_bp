import { NextResponse } from 'next/server';
import { exportPdfReport } from '@/app/dashboard/reports/actions';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const classId = url.searchParams.get('classId');
    if (!classId) {
        return NextResponse.json({ error: 'classId required' }, { status: 400 });
    }
    const filters = {
        startDate: url.searchParams.get('startDate') ?? undefined,
        endDate: url.searchParams.get('endDate') ?? undefined,
        type: (url.searchParams.get('type') as 'positive' | 'negative' | 'neutral') ?? undefined,
    };

    try {
        const base64 = await exportPdfReport(classId, filters);
        const pdfBuffer = Buffer.from(base64, 'base64');
        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        headers.set('Content-Disposition', `attachment; filename="Laporan_Poin_Kelas_${classId}.pdf"`);
        return new NextResponse(pdfBuffer, { status: 200, headers });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
