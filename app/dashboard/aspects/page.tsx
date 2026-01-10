import { getAspects } from './actions';
import AspectsClient from '@/components/dashboard/aspects/AspectsClient';

export default async function Page() {
    const aspects = await getAspects();
    return <AspectsClient initialData={aspects || []} />;
}
