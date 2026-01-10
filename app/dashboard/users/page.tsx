import { getUsers } from './actions';
import { createClient } from '@/lib/supabase/server';
import UsersClient from '@/components/dashboard/users/UsersClient';

export default async function UsersPage() {
    const supabase = await createClient();
    const users = await getUsers();

    // Fetch classes for the Walas dropdown
    const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');

    return (
        <UsersClient
            initialData={users}
            classes={classes || []}
        />
    );
}
