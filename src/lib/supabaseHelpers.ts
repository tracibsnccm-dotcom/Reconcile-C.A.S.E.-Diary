/* ========================== RCMS C.A.R.E. — supabaseHelpers.ts ==========================
 * Supabase integration helpers for case management
 * - Handles case creation with automatic case_assignments
 * - Provides typed queries with RLS-aware access
 * - Bridges localStorage demo mode with real backend
 * ==================================================================================== */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
type Case = Tables["cases"]["Row"];
type CaseInsert = Tables["cases"]["Insert"];
type CaseAssignment = Tables["case_assignments"]["Row"];
type Provider = Tables["providers"]["Row"];
type Intake = Tables["intakes"]["Row"];

/**
 * Create a new case AND automatically assign the creator
 * This ensures RLS policies work immediately
 */
export async function createCaseWithAssignment(
  caseData: Partial<CaseInsert>,
  userId: string,
  userRole: Database["public"]["Enums"]["app_role"]
) {
  // 1. Create the case
  const { data: newCase, error: caseError } = await supabase
    .from("cases")
    .insert({
      ...caseData,
      created_by: userId,
    })
    .select()
    .single();

  if (caseError) throw caseError;
  if (!newCase) throw new Error("Failed to create case");

  // 2. Create the case assignment so creator has immediate access
  const { error: assignError } = await supabase
    .from("case_assignments")
    .insert({
      case_id: newCase.id,
      user_id: userId,
      role: userRole,
    });

  if (assignError) throw assignError;

  return newCase;
}

/**
 * Get all cases accessible to current user (RLS-filtered)
 */
export async function getCasesForUser() {
  const { data, error } = await supabase
    .from("cases")
    .select(`
      *,
      case_assignments!inner(user_id, role)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get a single case by ID (RLS-filtered)
 */
export async function getCaseById(caseId: string) {
  const { data, error } = await supabase
    .from("cases")
    .select(`
      *,
      case_assignments(user_id, role),
      intakes(*),
      documents(*),
      sdoh_assessments(*)
    `)
    .eq("id", caseId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Update case data (RLS enforces permissions)
 */
export async function updateCase(caseId: string, updates: Partial<CaseInsert>) {
  const { data, error } = await supabase
    .from("cases")
    .update(updates)
    .eq("id", caseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Assign additional user to a case
 */
export async function assignUserToCase(
  caseId: string,
  userId: string,
  role: Database["public"]["Enums"]["app_role"]
) {
  const { error } = await supabase
    .from("case_assignments")
    .insert({
      case_id: caseId,
      user_id: userId,
      role,
    });

  if (error) throw error;
}

/**
 * Get all providers (with optional specialty filter)
 */
export async function getProviders(specialty?: string) {
  let query = supabase
    .from("providers")
    .select("*")
    .eq("accepting_patients", true)
    .order("name");

  if (specialty) {
    query = query.eq("specialty", specialty);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Create provider
 */
export async function createProvider(providerData: Tables["providers"]["Insert"]) {
  const { data, error } = await supabase
    .from("providers")
    .insert(providerData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Submit intake for a case
 */
export async function submitIntake(
  caseId: string,
  userId: string,
  intakeData: Partial<Tables["intakes"]["Insert"]>
) {
  const { data, error } = await supabase
    .from("intakes")
    .insert({
      case_id: caseId,
      user_id: userId,
      ...intakeData,
      completed: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Submit check-in for a case
 */
export async function submitCheckin(
  caseId: string,
  userId: string,
  payload: any
) {
  const { data, error } = await supabase
    .from("checkins")
    .insert({
      case_id: caseId,
      user_id: userId,
      payload,
    })
    .select()
    .single();

  if (error) throw error;

  // Update last_pain_diary_at if pain score provided
  if (payload.pain !== undefined) {
    await supabase
      .from("cases")
      .update({
        last_pain_diary_at: new Date().toISOString(),
      })
      .eq("id", caseId);
  }

  return data;
}

/**
 * Get check-ins for a case
 */
export async function getCheckinsForCase(caseId: string) {
  const { data, error } = await supabase
    .from("checkins")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Create or update SDOH assessment
 */
export async function upsertSDOHAssessment(
  caseId: string,
  userId: string,
  assessment: Partial<Tables["sdoh_assessments"]["Insert"]>
) {
  // Check if assessment exists
  const { data: existing } = await supabase
    .from("sdoh_assessments")
    .select("id")
    .eq("case_id", caseId)
    .maybeSingle();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("sdoh_assessments")
      .update({ ...assessment, assessed_by: userId })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from("sdoh_assessments")
      .insert({
        case_id: caseId,
        assessed_by: userId,
        ...assessment,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * Upload document to storage and create document record
 */
export async function uploadCaseDocument(
  caseId: string,
  userId: string,
  file: File,
  documentType: string
) {
  // Upload to storage
  const fileExt = file.name.split(".").pop();
  const fileName = `${caseId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("case-documents")
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  // Create document record
  const { data, error } = await supabase
    .from("documents")
    .insert({
      case_id: caseId,
      document_type: documentType,
      file_name: file.name,
      file_path: fileName,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get document download URL
 */
export async function getDocumentUrl(filePath: string) {
  const { data } = supabase.storage
    .from("case-documents")
    .getPublicUrl(filePath);

  return data.publicUrl;
}
