import { supabase } from "@/integrations/supabase/client";

export async function supabaseGet(table: string, query: string) {
  if (!supabase) throw new Error("Supabase not configured");
  const url = `${(supabase as any).supabaseUrl}/rest/v1/${table}?${query}`;
  const response = await fetch(url, {
    headers: {
      apikey: (supabase as any).supabaseKey,
      Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    return { data: null, error: { message: error.message || response.statusText } };
  }
  const data = await response.json();
  return { data, error: null };
}

export async function supabaseUpdate(table: string, filter: string, body: Record<string, any>) {
  if (!supabase) throw new Error("Supabase not configured");
  const url = `${(supabase as any).supabaseUrl}/rest/v1/${table}?${filter}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: (supabase as any).supabaseKey,
      Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    return { error: { message: error.message || response.statusText } };
  }
  return { error: null };
}

export async function supabaseInsert<T = any>(
  table: string,
  data: object
): Promise<{ data: T | null; error: { message: string } | null }> {
  if (!supabase) throw new Error("Supabase not configured");
  const url = `${(supabase as any).supabaseUrl}/rest/v1/${table}`;
  const token = (await supabase.auth.getSession()).data.session?.access_token ?? (supabase as any).supabaseKey;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: (supabase as any).supabaseKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    return { data: null, error: { message: error?.message || response.statusText } };
  }
  const result = await response.json();
  return { data: result, error: null };
}
