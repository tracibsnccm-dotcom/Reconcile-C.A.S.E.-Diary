// src/lib/seedData.ts
// Utility functions to seed initial data into Supabase

import { supabase } from "@/integrations/supabase/client";
import { createCase } from "./caseOperations";
import { assignRole } from "./roleOperations";

/**
 * Seed sample providers into the database
 */
export async function seedProviders() {
  const providers = [
    {
      name: "Dr. Sarah Chen",
      specialty: "Physical Therapy",
      practice_name: "Chen PT Clinic",
      address: "123 Main St, Los Angeles, CA",
      phone: "(555) 123-4567",
      email: "dr.chen@example.com",
      accepting_patients: true,
    },
    {
      name: "Dr. Michael Rodriguez",
      specialty: "Orthopedic Surgery",
      practice_name: "Rodriguez Orthopedics",
      address: "456 Oak Ave, San Diego, CA",
      phone: "(555) 234-5678",
      email: "dr.rodriguez@example.com",
      accepting_patients: true,
    },
    {
      name: "Dr. Jennifer Park",
      specialty: "Pain Management",
      practice_name: "Park Pain Center",
      address: "789 Pine Rd, San Francisco, CA",
      phone: "(555) 345-6789",
      email: "dr.park@example.com",
      accepting_patients: true,
    },
  ];

  const { data, error } = await supabase
    .from("providers")
    .insert(providers)
    .select();

  if (error) {
    console.error("Failed to seed providers:", error);
    throw error;
  }

  console.log("Seeded providers:", data);
  return data;
}

/**
 * Create a sample case for testing
 */
export async function createSampleCase(userId: string) {
  try {
    const newCase = await createCase({
      client_label: "Sample Client",
      atty_ref: "ATT-2024-001",
      status: "NEW",
      created_by: userId,
      assignedUserIds: [userId],
      assignedRoles: ["ATTORNEY"],
    });

    console.log("Created sample case:", newCase);
    return newCase;
  } catch (error) {
    console.error("Failed to create sample case:", error);
    throw error;
  }
}

/**
 * Assign ATTORNEY role to a user (for testing)
 */
export async function makeUserAttorney(userId: string) {
  try {
    await assignRole(userId, "ATTORNEY");
    console.log("Assigned ATTORNEY role to user:", userId);
  } catch (error) {
    console.error("Failed to assign role:", error);
    throw error;
  }
}

/**
 * Complete seed operation - run once per environment
 */
export async function runCompleteSeed(userId: string) {
  console.log("Starting database seed...");
  
  try {
    // 1. Seed providers
    await seedProviders();
    
    // 2. Ensure user has attorney role
    await makeUserAttorney(userId);
    
    // 3. Create sample case
    await createSampleCase(userId);
    
    console.log("✅ Database seed completed successfully!");
    return { success: true };
  } catch (error) {
    console.error("❌ Database seed failed:", error);
    return { success: false, error };
  }
}
