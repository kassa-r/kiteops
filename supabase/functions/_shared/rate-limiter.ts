import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function checkRateLimit(
  supabase: SupabaseClient,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = Date.now();
  const windowStart = Math.floor(now / 1000 / windowSeconds) * windowSeconds;

  // Simple Fixed Window implementation
  // Upsert: Try to increment count for current window
  // If row doesn't exist (or is old window), reset.
  
  // Note: This isn't atomic without a stored procedure, but sufficient for basic protection.
  // For strict atomicity, use an RPC.
  
  // 1. Get current usage
  const { data, error } = await supabase
    .from('rate_limits')
    .select('request_count, window_start')
    .eq('key', key)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = JSON object not returned (not found)
    console.error('Rate limit error:', error);
    return { allowed: true }; // Fail open
  }

  let currentCount = 0;
  
  if (data && data.window_start === windowStart) {
    currentCount = data.request_count;
  }

  if (currentCount >= limit) {
    return { allowed: false, retryAfter: windowSeconds };
  }

  // 2. Increment (Upsert)
  const { error: upsertError } = await supabase
    .from('rate_limits')
    .upsert({ 
      key, 
      window_start: windowStart, 
      request_count: currentCount + 1 
    });

  if (upsertError) {
    console.error('Rate limit upsert error:', upsertError);
  }

  return { allowed: true };
}
