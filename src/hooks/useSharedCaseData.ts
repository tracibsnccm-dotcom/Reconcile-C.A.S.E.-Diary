import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Shared hook for case data that multiple features need
// This prevents duplicate data fetching across components like:
// - Settlement Calculator
// - Medical Lien Management  
// - Medical Bill Review
// - Trust Accounting
// - Case Management

export interface CaseData {
  id: string;
  client_number?: string;
  client_label?: string;
  status: string;
  medicalBills?: number;
  liens?: number;
  timeLogged?: number;
  settlementAmount?: number;
  [key: string]: any;
}

export function useSharedCaseData(caseId?: string) {
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) return;

    const fetchCaseData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("cases")
          .select("*")
          .eq("id", caseId)
          .single();

        if (error) throw error;
        setCaseData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load case data");
      } finally {
        setLoading(false);
      }
    };

    fetchCaseData();
  }, [caseId]);

  return { caseData, loading, error };
}

// Hook for fetching all cases (used by multiple features)
export function useAllCases() {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("cases")
          .select("*")
          .order("created_at", { ascending: false });

        if (data) setCases(data);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  return { cases, loading };
}
