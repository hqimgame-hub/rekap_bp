'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getSettings() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .order('key');

    if (error) throw new Error(error.message);
    return data || [];
}

export async function updateSetting(key: string, value: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/settings');
    return { success: true };
}

export async function updateAllSettings(settings: Record<string, string>) {
    const supabase = await createClient();

    for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
            .from('settings')
            .update({ value, updated_at: new Date().toISOString() })
            .eq('key', key);

        if (error) throw new Error(`Failed to update ${key}: ${error.message}`);
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
}
