import { supabase } from "@/integrations/supabase/client";

/**
 * Create an automatic case note that can be called from anywhere in the app.
 * Auto notes are system-generated and don't have a created_by user.
 */
export async function createAutoNote({
  caseId,
  noteType,
  title,
  content,
  triggerEvent,
  visibleToClient = false,
  visibleToRN = false,
  visibleToAttorney = false,
  documentId = null,
  documentUrl = null,
  clientId = null,
}: {
  caseId: string;
  noteType: string;
  title: string;
  content: string;
  triggerEvent: string;
  visibleToClient?: boolean;
  visibleToRN?: boolean;
  visibleToAttorney?: boolean;
  documentId?: string | null;
  documentUrl?: string | null;
  clientId?: string | null;
}) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Determine visibility string based on boolean flags
  // Note: Attorney always has access to notes for their cases, so visibleToAttorney is mainly for filtering
  let visibility = 'private';
  if (visibleToClient && visibleToRN && visibleToAttorney) {
    visibility = 'shared_all';
  } else if (visibleToRN && visibleToAttorney) {
    visibility = 'shared_rn'; // RN and Attorney (attorney always has access)
  } else if (visibleToClient && visibleToRN) {
    visibility = 'shared_rn'; // Client and RN (will show to attorney too)
  } else if (visibleToRN) {
    visibility = 'shared_rn';
  } else if (visibleToClient) {
    visibility = 'shared_client';
  }
  // If none are set, visibility remains 'private' (attorney still sees it)
  
  // Include document reference in content if provided (safe approach - no schema changes needed)
  let noteContent = content;
  if (documentId || documentUrl) {
    const docRef = documentId 
      ? `\n\nDocument ID: ${documentId}`
      : documentUrl 
      ? `\n\nDocument: ${documentUrl}`
      : '';
    noteContent = `${content}${docRef}`;
  }

  // Note: client_id is not included in noteData since rc_case_notes doesn't have that column
  // Client linkage is available via rc_cases.client_id JOIN, which is sufficient for queries
  const noteData: any = {
    case_id: caseId,
    title: title,
    content: noteContent,
    note_type: triggerEvent,
    created_by: null,
    created_by_role: null,
    visibility: visibility,
    is_auto_generated: true,
    created_at: new Date().toISOString(),
  };

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rc_case_notes`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(noteData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create auto note:', errorText);
      throw new Error(`Failed to create auto note: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating auto note:', error);
    throw error;
  }
}

/**
 * Create a case note as the currently authenticated user. Sets created_by = auth.uid().
 * For RN UI-triggered notes (C-5, H-block, care plan completion). Uses session JWT; RLS requires created_by = auth.uid().
 * Returns { ok: true } on success, { ok: false, error } on failure. Does not throw.
 */
export async function createAutoNoteAsUser({
  caseId,
  noteType,
  title,
  content,
  triggerEvent,
  visibleToClient = false,
  visibleToRN = false,
  visibleToAttorney = false,
  documentId = null,
  documentUrl = null,
  clientId = null,
}: {
  caseId: string;
  noteType: string;
  title: string;
  content: string;
  triggerEvent: string;
  visibleToClient?: boolean;
  visibleToRN?: boolean;
  visibleToAttorney?: boolean;
  documentId?: string | null;
  documentUrl?: string | null;
  clientId?: string | null;
}): Promise<{ ok: true } | { ok: false; error: unknown }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: new Error("Not authenticated") };

  let visibility = 'private';
  if (visibleToClient && visibleToRN && visibleToAttorney) {
    visibility = 'shared_all';
  } else if (visibleToRN && visibleToAttorney) {
    visibility = 'shared_rn';
  } else if (visibleToClient && visibleToRN) {
    visibility = 'shared_rn';
  } else if (visibleToRN) {
    visibility = 'shared_rn';
  } else if (visibleToClient) {
    visibility = 'shared_client';
  }

  let noteContent = content;
  if (documentId || documentUrl) {
    const docRef = documentId
      ? `\n\nDocument ID: ${documentId}`
      : documentUrl
        ? `\n\nDocument: ${documentUrl}`
        : '';
    noteContent = `${content}${docRef}`;
  }

  const noteData = {
    case_id: caseId,
    title,
    content: noteContent,
    note_type: triggerEvent,
    created_by: user.id,
    created_by_role: null,
    visibility,
    is_auto_generated: true,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('rc_case_notes').insert(noteData);
  if (error) {
    console.error('createAutoNoteAsUser failed:', error);
    return { ok: false, error };
  }
  return { ok: true };
}

export function generateIntakeNote(clientName: string, intakeId: string, attorneyCode: string): string {
  const now = new Date().toLocaleString();
  return `INTAKE SUBMISSION
Date/Time: ${now}
Client: ${clientName}
Intake ID: ${intakeId}
Attorney Code: ${attorneyCode}

Client completed intake form and submitted for attorney review.
Intake is pending attorney confirmation within 48 hours.`;
}

export function generateConsentNote(signatures: {
  serviceAgreement?: string;
  legalDisclosure?: string;
  obtainRecords?: string;
  healthcareCoord?: string;
  hipaa?: string;
}): string {
  const now = new Date().toLocaleString();
  return `CONSENT DOCUMENTATION
Date/Time: ${now}

The following consents were signed:

1. Service Agreement
   Signature: ${signatures.serviceAgreement || 'N/A'}
   
2. Legal Disclosure
   Signature: ${signatures.legalDisclosure || 'N/A'}
   
3. Authorization to Obtain Records
   Signature: ${signatures.obtainRecords || 'N/A'}
   
4. Healthcare Coordination
   Signature: ${signatures.healthcareCoord || 'N/A'}
   
5. HIPAA Privacy Notice
   Signature: ${signatures.hipaa || 'N/A'}

All required consents have been obtained and documented.`;
}

export function generateAttestationNote(attorneyId: string, caseNumber: string, action: 'confirmed' | 'declined'): string {
  const now = new Date().toLocaleString();
  if (action === 'confirmed') {
    return `ATTORNEY ATTESTATION - CONFIRMED
Date/Time: ${now}
Attorney ID: ${attorneyId}
Case Number: ${caseNumber}

Attorney has confirmed client relationship and authorized access to Protected Health Information (PHI) for care management purposes.

Case is now active and care plan generation will begin.`;
  } else {
    return `ATTORNEY ATTESTATION - DECLINED
Date/Time: ${now}
Attorney ID: ${attorneyId}

Attorney has indicated this is not their client.
Intake has been marked as declined and access is disabled.`;
  }
}

export function generateCarePlanCompletionNote(isInitial: boolean, documentUrl?: string | null, carePlanId?: string | null): string {
  const now = new Date().toLocaleString();
  const planType = isInitial ? 'Initial' : 'Updated';
  let note = `${planType} care plan completed — document attached.

Date/Time: ${now}`;
  
  if (carePlanId) {
    note += `\nCare Plan ID: ${carePlanId.slice(0, 8)}...`;
  }
  
  if (documentUrl) {
    note += `\nDocument: ${documentUrl}`;
  }
  
  return note;
}
