'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getAspects() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('aspects')
        .select(`
            *,
            aspect_rules (
                *
            )
        `)
        .order('name', { ascending: true }); // Changed to name to avoid missing created_at error

    if (error) throw new Error(error.message);

    // Sort rules within aspects
    data.forEach(aspect => {
        if (aspect.aspect_rules) {
            aspect.aspect_rules.sort((a: any, b: any) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateB - dateA;
            });
        }
    });

    return data;
}

// --- ASPECTS CRUD ---

export async function createAspect(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;
    const input_type = formData.get('input_type') as string;

    // Optional initial rule
    const rule_name = formData.get('rule_name') as string;
    const rule_point = formData.get('rule_point') as string;

    // 1. Create Aspect
    const { data: aspectData, error: aspectError } = await supabase
        .from('aspects')
        .insert({ name, type, input_type, active: true })
        .select()
        .single();

    if (aspectError) return { error: aspectError.message };

    // 2. Create Rule if provided
    if (rule_name && rule_point && aspectData) {
        const { error: ruleError } = await supabase
            .from('aspect_rules')
            .insert({
                aspect_id: aspectData.id,
                name: rule_name,
                point: parseInt(rule_point)
            });

        if (ruleError) {
            // Optional: we could delete the aspect if rule fails, but maybe just return warning?
            // For now, let's just return error
            return { error: "Aspect created but Rule failed: " + ruleError.message };
        }
    }

    revalidatePath('/dashboard/aspects');
    return { success: true };
}

export async function updateAspect(id: string, formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;
    const input_type = formData.get('input_type') as string;

    const { error } = await supabase
        .from('aspects')
        .update({ name, type, input_type })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/aspects');
    return { success: true };
}

export async function deleteAspect(id: string) {
    const supabase = await createClient();

    // Check for related records/rules usually handled by FK constraints, 
    // but good to wrapping in try-catch if using cascade or explicit check
    const { error } = await supabase
        .from('aspects')
        .delete()
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/aspects');
    return { success: true };
}

// --- RULES CRUD ---

export async function createRule(formData: FormData) {
    const supabase = await createClient();
    const aspect_id = formData.get('aspect_id') as string;
    const name = formData.get('name') as string;
    const point = parseInt(formData.get('point') as string);

    const { error } = await supabase
        .from('aspect_rules')
        .insert({ aspect_id, name, point });

    if (error) return { error: error.message };

    revalidatePath('/dashboard/aspects');
    return { success: true };
}

export async function updateRule(id: string, formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;
    const point = parseInt(formData.get('point') as string);

    const { error } = await supabase
        .from('aspect_rules')
        .update({ name, point })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/aspects');
    return { success: true };
}

export async function deleteRule(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('aspect_rules')
        .delete()
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/aspects');
    return { success: true };
}
