// src/lib/intakeSessionService.ts
// Service for creating and managing INT intake sessions (ported from C.A.R.E.)

// Generate INT-YYMMDD-##X format intake ID
function generateIntakeId(sequenceToday: number): string {
  const today = new Date();
  const yy = today.getFullYear().toString().slice(-2);
  const mm = (today.getMonth() + 1).toString().padStart(2, '0');
  const dd = today.getDate().toString().padStart(2, '0');
  const seq = sequenceToday.toString().padStart(2, '0');
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const randomLetter = letters[Math.floor(Math.random() * letters.length)];
  return `INT-${yy}${mm}${dd}-${seq}${randomLetter}`;
}

// Generate secure resume token (not PHI)
function generateResumeToken(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export interface CreateIntakeSessionParams {
  attorneyId?: string;
  attorneyCode?: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface IntakeSession {
  id: string;
  intakeId: string;
  resumeToken: string;
  attorneyId?: string;
  attorneyCode?: string;
  firstName: string;
  lastName: string;
  email: string;
  currentStep: number;
  formData: any;
  createdAt: string;
  expiresAt: string;
  intakeStatus: string;
}

/**
 * Create or update (upsert) INT intake session after minimum identity is collected
 */
export async function createIntakeSession(params: CreateIntakeSessionParams): Promise<IntakeSession> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const emailLower = params.email.trim().toLowerCase();

  // When email is empty, skip existing-session lookup (client access is INT# + PIN only)
  let existingSession: any = null;
  if (emailLower && (params.attorneyId || params.attorneyCode)) {
    let queryUrl = `${supabaseUrl}/rest/v1/rc_client_intake_sessions?email=eq.${encodeURIComponent(emailLower)}&select=*`;
    if (params.attorneyId) {
      queryUrl += `&attorney_id=eq.${params.attorneyId}`;
    } else if (params.attorneyCode) {
      queryUrl += `&attorney_code=eq.${params.attorneyCode}`;
    }
    queryUrl += `&order=created_at.desc&limit=1`;

    const existingResponse = await fetch(queryUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    });

    if (existingResponse.ok) {
      const existing = await existingResponse.json();
      if (Array.isArray(existing) && existing.length > 0) {
        existingSession = existing[0];
        const now = new Date();
        const createdAt = new Date(existingSession.created_at);
        const expiresAt = new Date(existingSession.expires_at);
        const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        const isExpired = expiresAt < now;
        const isSubmitted = ['converted', 'submitted', 'completed'].includes(existingSession.intake_status);
        const isOlderThan24Hours = hoursSinceCreation > 24;
        const attorneyMatches =
          (!params.attorneyId && !params.attorneyCode) ||
          (params.attorneyId && existingSession.attorney_id === params.attorneyId) ||
          (params.attorneyCode && existingSession.attorney_code === params.attorneyCode);

        if (isExpired || isSubmitted || isOlderThan24Hours || !attorneyMatches) {
          existingSession = null;
        }
      }
    }
  }

  if (existingSession) {
    const updateData: any = {
      attorney_id: params.attorneyId || existingSession.attorney_id || null,
      attorney_code: params.attorneyCode || existingSession.attorney_code || null,
      first_name: params.firstName.trim(),
      last_name: params.lastName.trim(),
      updated_at: new Date().toISOString(),
    };

    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/rc_client_intake_sessions?id=eq.${existingSession.id}`,
      {
        method: 'PATCH',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(updateData),
      }
    );

    if (updateResponse.ok) {
      const updated = await updateResponse.json();
      const session = Array.isArray(updated) ? updated[0] : updated;
      return {
        id: session.id,
        intakeId: session.intake_id,
        resumeToken: session.resume_token,
        attorneyId: session.attorney_id,
        attorneyCode: session.attorney_code,
        firstName: session.first_name,
        lastName: session.last_name,
        email: session.email,
        currentStep: session.current_step,
        formData: session.form_data || {},
        createdAt: session.created_at,
        expiresAt: session.expires_at,
        intakeStatus: session.intake_status,
      };
    }
  }

  const today = new Date();
  const yy = today.getFullYear().toString().slice(-2);
  const mm = (today.getMonth() + 1).toString().padStart(2, '0');
  const dd = today.getDate().toString().padStart(2, '0');
  const todayPrefix = `INT-${yy}${mm}${dd}-`;

  const countResponse = await fetch(
    `${supabaseUrl}/rest/v1/rc_client_intake_sessions?intake_id=like.${todayPrefix}*&select=intake_id`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  let count = 0;
  if (countResponse.ok) {
    const existing = await countResponse.json();
    count = Array.isArray(existing) ? existing.length : 0;
  }

  const intakeId = generateIntakeId(count + 1);
  const resumeToken = generateResumeToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const sessionData = {
    intake_id: intakeId,
    resume_token: resumeToken,
    attorney_id: params.attorneyId || null,
    attorney_code: params.attorneyCode || null,
    first_name: params.firstName.trim(),
    last_name: params.lastName.trim(),
    email: emailLower,
    current_step: 0,
    form_data: {},
    expires_at: expiresAt,
    intake_status: 'in_progress',
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/rc_client_intake_sessions`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(sessionData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create intake session: ${response.status}`);
  }

  const result = await response.json();
  const session = Array.isArray(result) ? result[0] : result;

  return {
    id: session.id,
    intakeId: session.intake_id,
    resumeToken: session.resume_token,
    attorneyId: session.attorney_id,
    attorneyCode: session.attorney_code,
    firstName: session.first_name,
    lastName: session.last_name,
    email: session.email,
    currentStep: session.current_step,
    formData: session.form_data || {},
    createdAt: session.created_at,
    expiresAt: session.expires_at,
    intakeStatus: session.intake_status,
  };
}

/** Hash temp PIN: SHA-256(pin + intakeId) as hex. */
export async function hashTempPin(pin: string, intakeId: string): Promise<string> {
  const data = new TextEncoder().encode(pin + intakeId);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function getIntakeSessionByIntakeId(intakeId: string): Promise<IntakeSession | null> {
  const normalized = (intakeId || "").trim().toUpperCase();
  if (!normalized) return null;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  const response = await fetch(
    `${supabaseUrl}/rest/v1/rc_client_intake_sessions?intake_id=eq.${encodeURIComponent(normalized)}&select=*`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) return null;
  const result = await response.json();
  if (!result || (Array.isArray(result) && result.length === 0)) return null;

  const session = Array.isArray(result) ? result[0] : result;
  return {
    id: session.id,
    intakeId: session.intake_id,
    resumeToken: session.resume_token,
    attorneyId: session.attorney_id,
    attorneyCode: session.attorney_code,
    firstName: session.first_name,
    lastName: session.last_name,
    email: session.email,
    currentStep: session.current_step ?? 0,
    formData: session.form_data || {},
    createdAt: session.created_at,
    expiresAt: session.expires_at,
    intakeStatus: session.intake_status,
  };
}

export async function getIntakeSessionByToken(token: string): Promise<IntakeSession | null> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  const response = await fetch(
    `${supabaseUrl}/rest/v1/rc_client_intake_sessions?resume_token=eq.${token}&select=*`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) return null;
  const result = await response.json();
  if (!result || (Array.isArray(result) && result.length === 0)) return null;

  const session = Array.isArray(result) ? result[0] : result;
  if (new Date(session.expires_at) < new Date()) return null;

  return {
    id: session.id,
    intakeId: session.intake_id,
    resumeToken: session.resume_token,
    attorneyId: session.attorney_id,
    attorneyCode: session.attorney_code,
    firstName: session.first_name,
    lastName: session.last_name,
    email: session.email,
    currentStep: session.current_step,
    formData: session.form_data || {},
    createdAt: session.created_at,
    expiresAt: session.expires_at,
    intakeStatus: session.intake_status,
  };
}

export async function updateIntakeSession(
  sessionId: string,
  updates: {
    currentStep?: number;
    formData?: any;
    intakeStatus?: string;
    caseId?: string;
    attorneyId?: string;
    attorneyCode?: string;
  }
): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const updateData: any = { updated_at: new Date().toISOString() };
  if (updates.currentStep !== undefined) updateData.current_step = updates.currentStep;
  if (updates.formData !== undefined) {
    const getRes = await fetch(
      `${supabaseUrl}/rest/v1/rc_client_intake_sessions?id=eq.${sessionId}&select=form_data`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
    let existing: any = {};
    if (getRes.ok) {
      const arr = await getRes.json();
      if (Array.isArray(arr) && arr[0]?.form_data) existing = arr[0].form_data;
    }
    updateData.form_data = { ...existing, ...(updates.formData || {}) };
  }
  if (updates.intakeStatus !== undefined) updateData.intake_status = updates.intakeStatus;
  if (updates.caseId !== undefined) updateData.case_id = updates.caseId;
  if (updates.attorneyId !== undefined) updateData.attorney_id = updates.attorneyId ?? null;
  if (updates.attorneyCode !== undefined) updateData.attorney_code = updates.attorneyCode ?? null;

  const response = await fetch(
    `${supabaseUrl}/rest/v1/rc_client_intake_sessions?id=eq.${sessionId}`,
    {
      method: 'PATCH',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(updateData),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update intake session: ${response.status}`);
  }
}
