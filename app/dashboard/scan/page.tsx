import { getQRFormProps } from './actions';
import ScanForm from '@/components/dashboard/scan/ScanForm';

export default async function Page() {
    console.log('[ScanPage] Starting render...');
    const { aspects, classes, role } = await getQRFormProps();
    console.log('[ScanPage] Data fetched. Aspects:', aspects?.length, 'Classes:', classes?.length);

    return <ScanForm aspects={aspects || []} classes={classes || []} role={role} />;
}
