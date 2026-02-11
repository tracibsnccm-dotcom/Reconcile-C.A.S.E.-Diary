/**
 * Client Block 1: Self-heal binder for rc_cases.client_id when NULL.
 * Uses rc_client_intakes.intake_json.client (or flattened fallback) to resolve/create
 * rc_clients and bind rc_cases.client_id. No schema changes. No UI.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

function trim(s: unknown): string {
  if (s == null) return "";
  return String(s).trim();
}

function orEmpty(v: unknown): string | null {
  const t = trim(v);
  return t === "" ? null : t;
}

type Extracted = { email: string; firstName: string; lastName: string; phone: string | null };

/**
 * Extract canonical identity from intake_json.
 * Preferred: intake_json.client { email, firstName, lastName, phone }.
 * Fallback: top-level intake_json.email, .firstName, .lastName, .phone only if present (avoid SDOH).
 */
function extractIdentity(intakeJson: unknown): Extracted | null {
  if (intakeJson == null || typeof intakeJson !== "object") return null;
  const j = intakeJson as Record<string, unknown>;

  // Preferred: intake_json.client
  const client = j.client;
  if (client != null && typeof client === "object") {
    const c = client as Record<string, unknown>;
    const email = trim(c.email ?? c.Email);
    if (email) {
      return {
        email,
        firstName: trim(c.firstName ?? c.first_name ?? ""),
        lastName: trim(c.lastName ?? c.last_name ?? ""),
        phone: orEmpty(c.phone),
      };
    }
  }

  // Fallback: flattened keys only if present (avoid SDOH)
  const email = trim(j.email ?? j.Email);
  if (!email) return null;
  return {
    email,
    firstName: trim(j.firstName ?? j.first_name ?? ""),
    lastName: trim(j.lastName ?? j.last_name ?? ""),
    phone: orEmpty(j.phone),
  };
}

/**
 * ensureClientBindingForCase(supabase, caseId): Promise<{ clientId: string | null }>
 *
 * 1) If rc_cases.client_id is already set, return it.
 * 2) Load most recent rc_client_intakes for case_id, get intake_json.
 * 3) Extract identity from intake_json.client or flattened fallback.
 * 4) Resolve rc_clients by lower(email): find → backfill only-if-empty; not found → insert.
 * 5) Update rc_cases set client_id = resolvedClientId ONLY when client_id IS NULL.
 * 6) Return { clientId }.
 */
export async function ensureClientBindingForCase(
  supabase: SupabaseClient,
  caseId: string
): Promise<{ clientId: string | null }> {
  // 1) Check rc_cases.client_id
  const { data: caseRow, error: caseErr } = await supabase
    .from("rc_cases")
    .select("id, client_id")
    .eq("id", caseId)
    .eq("is_superseded", false)
    .maybeSingle();

  if (caseErr) return { clientId: null };
  if (!caseRow) return { clientId: null };
  if (caseRow.client_id) return { clientId: caseRow.client_id };

  // 2) Load most recent rc_client_intakes for this case_id
  const { data: intakes, error: intErr } = await supabase
    .from("rc_client_intakes")
    .select("intake_json, created_at")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (intErr || !intakes?.length) return { clientId: null };
  const row = intakes[0];
  const identity = extractIdentity(row?.intake_json);
  if (!identity) return { clientId: null };

  const emailLower = identity.email.trim().toLowerCase();
  if (!emailLower) return { clientId: null };

  const firstName = identity.firstName || "Unknown";
  const lastName = identity.lastName || "Unknown";
  const phone = identity.phone;

  // 3–4) Find rc_clients by lower(email); compare in app if needed (ilike for case-insensitive)
  const { data: clients, error: clientFindErr } = await supabase
    .from("rc_clients")
    .select("id, first_name, last_name, email, phone")
    .ilike("email", emailLower)
    .limit(1);

  let clientId: string | null = null;

  if (!clientFindErr && clients?.length) {
    const c = clients[0];
    clientId = c?.id ?? null;
    // Backfill only-if-empty; never overwrite non-empty
    const ups: Record<string, string | null> = {};
    if (!trim(c?.first_name)) ups.first_name = firstName;
    if (!trim(c?.last_name)) ups.last_name = lastName;
    if (!trim(c?.phone) && phone != null) ups.phone = phone;
    if (!trim(c?.email)) ups.email = emailLower;
    if (Object.keys(ups).length) {
      await supabase.from("rc_clients").update(ups).eq("id", c!.id);
    }
  } else {
    // Insert new rc_clients
    const { data: inserted, error: insErr } = await supabase
      .from("rc_clients")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: emailLower,
        phone: phone || null,
      })
      .select("id")
      .single();
    if (!insErr && inserted?.id) clientId = inserted.id;
  }

  if (!clientId) return { clientId: null };

  // 5) Bind rc_cases.client_id ONLY when client_id IS NULL (do not overwrite)
  await supabase
    .from("rc_cases")
    .update({ client_id: clientId })
    .eq("id", caseId)
    .is("client_id", null);

  return { clientId };
}
