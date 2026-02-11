// src/lib/roleOperations.ts
// Role management operations for admins

import { supabase } from "@/integrations/supabase/client";

// Import from the Supabase types instead of defining our own
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

/**
 * Assign a role to a user (Admin only)
 */
export async function assignRole(userId: string, role: AppRole) {
  const { error } = await supabase
    .from("user_roles")
    .insert({ user_id: userId, role });

  if (error) {
    throw new Error(`Failed to assign role: ${error.message}`);
  }
}

/**
 * Remove a role from a user (Admin only)
 */
export async function removeRole(userId: string, role: AppRole) {
  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role);

  if (error) {
    throw new Error(`Failed to remove role: ${error.message}`);
  }
}

/**
 * Get all roles for a user
 */
export async function getUserRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to fetch user roles:", error);
    return [];
  }

  return data.map((r) => r.role as AppRole);
}

/**
 * Get all users with a specific role
 */
export async function getUsersByRole(role: AppRole) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("user_id, profiles(*)")
    .eq("role", role);

  if (error) {
    throw new Error(`Failed to fetch users by role: ${error.message}`);
  }

  return data;
}

/**
 * Update user's primary role (removes old, adds new)
 */
export async function updateUserRole(userId: string, newRole: AppRole) {
  // Get current roles
  const currentRoles = await getUserRoles(userId);

  // Remove all current roles
  for (const role of currentRoles) {
    await removeRole(userId, role);
  }

  // Assign new role
  await assignRole(userId, newRole);
}

/**
 * Check if user has a specific role
 */
export async function hasRole(userId: string, role: AppRole): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes(role);
}

/**
 * Check if user is admin (SUPER_USER or SUPER_ADMIN)
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes("SUPER_USER") || roles.includes("SUPER_ADMIN");
}
