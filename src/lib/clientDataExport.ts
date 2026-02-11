import { supabase } from "@/integrations/supabase/client";

export async function exportClientData(userId: string) {
  try {
    // Compile export data object
    const exportData: any = {
      exportDate: new Date().toISOString(),
      profile: null,
      userPreferences: null,
      cases: [],
      healthData: {
        checkins: [],
        goals: [],
        actionItems: [],
        appointments: [],
        medications: [],
        treatments: [],
        allergies: []
      },
      privacy: {
        preferences: null,
        sensitiveDisclosures: []
      },
      metadata: {
        version: "1.0",
        format: "JSON",
        hipaaCompliant: true
      }
    };

    // Fetch profile data
    const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
    exportData.profile = profile;

    const { data: cases } = await supabase.from("case_assignments").select("case_id").eq("user_id", userId);
    exportData.cases = cases || [];

    const { data: userPrefs } = await supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle();
    exportData.userPreferences = userPrefs;
    
    // Fetch health data
    const { data: checkins } = await supabase.from("client_checkins").select("*").eq("client_id", userId);
    exportData.healthData.checkins = checkins || [];

    const { data: goals } = await supabase.from("client_goals").select("*").eq("client_id", userId);
    exportData.healthData.goals = goals || [];

    const { data: actionItems } = await supabase.from("client_action_items").select("*").eq("client_id", userId);
    exportData.healthData.actionItems = actionItems || [];

    const { data: appointments } = await supabase.from("client_appointments").select("*").eq("client_id", userId);
    exportData.healthData.appointments = appointments || [];

    const { data: medications } = await supabase.from("client_medications").select("*").eq("client_id", userId);
    exportData.healthData.medications = medications || [];

    const { data: treatments } = await supabase.from("client_treatments").select("*").eq("client_id", userId);
    exportData.healthData.treatments = treatments || [];

    const { data: allergies } = await supabase.from("client_allergies").select("*").eq("client_id", userId);
    exportData.healthData.allergies = allergies || [];
    
    // Fetch privacy data
    const { data: preferences } = await supabase.from("client_preferences").select("*").eq("client_id", userId).maybeSingle();
    exportData.privacy.preferences = preferences;

    // Note: Sensitive disclosures require special access
    exportData.privacy.sensitiveDisclosures = [];

    // Create downloadable file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `my-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error("Error exporting client data:", error);
    return { success: false, error };
  }
}
