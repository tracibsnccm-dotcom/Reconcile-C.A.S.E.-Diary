import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type UserRole = "attorney" | "client";

interface ClientSession {
  caseId: string;
  caseNumber: string;
  clientId: string;
  clientName: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  clientSession: ClientSession | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  clientLogin: (caseNumber: string, pin: string) => Promise<{ error: any }>;
  clientLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [clientSession, setClientSession] = useState<ClientSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Check for existing attorney session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) setRole("attorney");
      setIsLoading(false);
    });

    // Check for client session in sessionStorage
    const stored = sessionStorage.getItem("case_client_session");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setClientSession(parsed);
        setRole("client");
      } catch {}
    }

    // Listen for auth changes (attorney sessions)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) setRole("attorney");
      else if (!clientSession) setRole(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: { message: "Supabase not configured" } };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  const clientLogin = async (caseNumber: string, pin: string) => {
    if (!supabase) return { error: { message: "Supabase not configured" } };

    // Look up case by case_number and client_pin
    const { data, error } = await supabase
      .from("rc_cases")
      .select("id, case_number, client_id, client_pin, case_status, is_superseded")
      .eq("case_number", caseNumber.toUpperCase().trim())
      .eq("client_pin", pin.trim())
      .eq("is_superseded", false)
      .maybeSingle();

    if (error) return { error: { message: "Login failed. Please try again." } };
    if (!data) return { error: { message: "Invalid case number or PIN." } };
    if (data.case_status === "closed") return { error: { message: "This case has been closed." } };

    // Get client name
    let clientName = "Client";
    if (data.client_id) {
      const { data: client } = await supabase
        .from("rc_clients")
        .select("first_name, last_name")
        .eq("id", data.client_id)
        .maybeSingle();
      if (client) clientName = [client.first_name, client.last_name].filter(Boolean).join(" ") || "Client";
    }

    const cs: ClientSession = {
      caseId: data.id,
      caseNumber: data.case_number,
      clientId: data.client_id || "",
      clientName,
    };

    sessionStorage.setItem("case_client_session", JSON.stringify(cs));
    setClientSession(cs);
    setRole("client");
    return { error: null };
  };

  const clientLogout = () => {
    sessionStorage.removeItem("case_client_session");
    setClientSession(null);
    if (!user) setRole(null);
  };

  return (
    <AuthContext.Provider value={{
      user, session, role, clientSession, isLoading,
      signIn, signOut, clientLogin, clientLogout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
