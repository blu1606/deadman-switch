import { getSupabaseAdmin } from '@/utils/supabase';

export interface CacheMatch {
    id: string;
    response: string;
    similarity: number;
}

/**
 * Find a semantically similar response in the cache.
 * Uses the `match_cached_response` RPC function in Supabase.
 */
export async function findCachedResponse(
    embedding: number[],
    threshold = 0.92
): Promise<CacheMatch | null> {
    // Always use admin client (Service Role) because RLS denies public access
    const supabase = getSupabaseAdmin();

    if (!supabase) {
        console.warn('Supabase admin client not available, skipping cache lookup');
        return null;
    }

    try {
        const { data, error } = await supabase.rpc('match_cached_response', {
            query_embedding: embedding,
            match_threshold: threshold,
            match_count: 1
        });

        if (error) {
            console.error('Cache lookup error:', error);
            return null;
        }

        if (data && data.length > 0) {
            // data[0] matches the return table structure of the RPC
            return data[0] as CacheMatch;
        }

        return null;
    } catch (err) {
        console.error('Unexpected cache error:', err);
        return null;
    }
}

/**
 * Save a prompt and its response + embedding to the cache.
 * Fire-and-forget style (void return), captures errors internally.
 */
export async function cacheResponse(
    prompt: string,
    response: string,
    embedding: number[]
): Promise<void> {
    const supabase = getSupabaseAdmin();

    if (!supabase) {
        console.warn('Supabase admin client not available, skipping cache save');
        return;
    }

    try {
        const { error } = await supabase
            .from('ai_cache')
            .insert({
                prompt,
                response,
                embedding
            });

        if (error) {
            console.error('Failed to save to cache:', error);
        }
    } catch (err) {
        console.error('Cache save error:', err);
    }
}
