// src/lib/caseOperations.ts
// Case operations with automatic case_assignments handling

import { supabase } from "@/integrations/supabase/client";

type AppRole = "CLIENT" | "ATTORNEY" | "STAFF" | "RN_CCM" | "PROVIDER" | "SUPER_USER" | "SUPER_ADMIN";

/**
 * Create a new case and automatically assign the creator
 */
export async function createCase(params: {
  client_label: string;
  atty_ref?: string;
  status?: string;
  created_by?: string;
  assignedUserIds?: string[]; // Additional users to assign
  assignedRoles?: AppRole[]; // Corresponding roles for assigned users
}) {
  const {
    client_label,
    atty_ref,
    status = "NEW",
    created_by,
    assignedUserIds = [],
    assignedRoles = [],
  } = params;

  // 1. Create the case
  const { data: newCase, error: caseError } = await supabase
    .from("cases")
    .insert({
      client_label,
      atty_ref,
      status,
      created_by,
    })
    .select()
    .single();

  if (caseError || !newCase) {
    throw new Error(`Failed to create case: ${caseError?.message}`);
  }

  // 2. Create case assignments
  const assignments: Array<{ case_id: string; user_id: string; role: AppRole }> = [];

  // Assign creator if provided
  if (created_by) {
    const userRoles = await getUserRoles(created_by);
    const primaryRole = (userRoles[0] || "ATTORNEY") as AppRole;
    
    assignments.push({
      case_id: newCase.id,
      user_id: created_by,
      role: primaryRole,
    });
  }

  // Assign additional users
  for (let i = 0; i < assignedUserIds.length; i++) {
    const userId = assignedUserIds[i];
    const role = (assignedRoles[i] || "CLIENT") as AppRole;
    assignments.push({
      case_id: newCase.id,
      user_id: userId,
      role,
    });
  }

  if (assignments.length > 0) {
    const { error: assignError } = await supabase
      .from("case_assignments")
      .insert(assignments);

    if (assignError) {
      console.error("Failed to create case assignments:", assignError);
      // Don't throw - case was created successfully
    }
  }

  return newCase;
}

/**
 * Assign a user to a case
 */
export async function assignUserToCase(params: {
  case_id: string;
  user_id: string;
  role: AppRole;
}) {
  const { case_id, user_id, role } = params;

  const { error } = await supabase
    .from("case_assignments")
    .insert([{ case_id, user_id, role }]);

  if (error) {
    throw new Error(`Failed to assign user to case: ${error.message}`);
  }
}

/**
 * Remove a user from a case
 */
export async function unassignUserFromCase(params: {
  case_id: string;
  user_id: string;
}) {
  const { case_id, user_id } = params;

  const { error } = await supabase
    .from("case_assignments")
    .delete()
    .eq("case_id", case_id)
    .eq("user_id", user_id);

  if (error) {
    throw new Error(`Failed to unassign user from case: ${error.message}`);
  }
}

/**
 * Get all cases assigned to a user
 */
export async function getUserCases(userId: string) {
  const { data, error } = await supabase
    .from("case_assignments")
    .select("case_id, role, cases(*)")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to fetch user cases: ${error.message}`);
  }

  return data;
}

/**
 * Get all users assigned to a case
 */
export async function getCaseAssignments(caseId: string) {
  const { data, error } = await supabase
    .from("case_assignments")
    .select("user_id, role, profiles(*)")
    .eq("case_id", caseId);

  if (error) {
    throw new Error(`Failed to fetch case assignments: ${error.message}`);
  }

  return data;
}

/**
 * Helper to get user roles
 */
async function getUserRoles(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error || !data) {
    return [];
  }

  return data.map((r) => r.role);
}
