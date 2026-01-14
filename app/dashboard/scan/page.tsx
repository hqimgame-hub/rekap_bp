import { getQRFormProps } from './actions';
import ManualInputForm from '@/components/dashboard/scan/ManualInputForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
    const t0 = performance.now();
    console.log('[ScanPage] >>>> START RENDERING PAGE');

    try {
        console.log('[ScanPage] Fetching props from DB...');
        const { classes } = await getQRFormProps();
        const t1 = performance.now();
        console.log(`[ScanPage] Data fetched in ${(t1 - t0).toFixed(2)}ms. Classes: ${classes?.length}`);

        return <ManualInputForm classes={classes || []} />;
    } catch (e) {
        console.error('[ScanPage] ERROR fetching props:', e);
        throw e;
    } finally {
        console.log('[ScanPage] <<<< END RENDERING PAGE');
    }
}
