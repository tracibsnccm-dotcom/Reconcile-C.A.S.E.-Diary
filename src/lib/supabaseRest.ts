export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Get access token: prefer session JWT when user is signed in.
 * Uses supabase.auth.getSession() first (canonical source), then localStorage fallback.
 * Returns anon key only when no session exists - STAGING rc_users RLS requires JWT.
 */
export async function getAccessToken(): Promise<string> {
  try {
    // Prefer supabase.auth.getSession() - canonical source for JWT when user is signed in
    const { supabase } = await import("@/integrations/supabase/client");
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        return session.access_token;
      }
    }
  } catch (_) {
    // Fall through to localStorage
  }

  try {
    const urlMatch = SUPABASE_URL?.match(/https?:\/\/([^.]+)\.supabase\.co/);
    if (!urlMatch) {
      return SUPABASE_ANON_KEY;
    }
    const projectRef = urlMatch[1];
    const storageKey = `sb-${projectRef}-auth-token`;
    const storedData = localStorage.getItem(storageKey);
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (parsed?.access_token) return parsed.access_token;
        if (parsed?.currentSession?.access_token) return parsed.currentSession.access_token;
      } catch (_) {
        /* fall through */
      }
    }
  } catch (_) {
    /* fall through */
  }
  return SUPABASE_ANON_KEY;
}

export async function supabaseGet<T = any>(
  table: string, 
  query: string = ''
): Promise<{ data: T | null; error: Error | null }> {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return { data: null, error: new Error("Supabase not configured") };
    }
    const token = await getAccessToken();
    const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { data: null, error: new Error(`${response.status}: ${errorText}`) };
    }
    
    const data = await response.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

export async function supabaseUpdate(
  table: string,
  filter: string,
  updates: object
): Promise<{ error: Error | null }> {
  try {
    const token = await getAccessToken();
    const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { error: new Error(`${response.status}: ${errorText}`) };
    }
    
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}

export async function supabaseInsert<T = any>(
  table: string,
  data: object
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const token = await getAccessToken();
    const url = `${SUPABASE_URL}/rest/v1/${table}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { data: null, error: new Error(`${response.status}: ${errorText}`) };
    }
    
    const result = await response.json();
    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}
