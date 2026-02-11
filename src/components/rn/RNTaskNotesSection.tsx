/**
 * RN Task Notes (Private) — single free-text field per case per RN.
 * Lives only in the RN care plan workspace. Never shown to client/attorney; never in print/export.
 * NOT clinical documentation. Autosaves with debounce and on blur.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";

const DEBOUNCE_MS = 900;

interface RNTaskNotesSectionProps {
  caseId: string | undefined;
  readOnly?: boolean;
}

export function RNTaskNotesSection({ caseId, readOnly = false }: RNTaskNotesSectionProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [rnUserId, setRnUserId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef("");

  const persist = useCallback(
    async (value: string) => {
      if (!caseId || !rnUserId) return;
      setSaveStatus("saving");
      try {
        const { error } = await supabase.from("rc_rn_task_notes").upsert(
          {
            case_id: caseId,
            rn_user_id: rnUserId,
            content: value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "case_id,rn_user_id" }
        );
        if (error) throw error;
        lastSavedRef.current = value;
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (e) {
        console.error("RNTaskNotesSection: save failed", e);
        setSaveStatus("idle");
      }
    },
    [caseId, rnUserId]
  );

  // Load rc_users.id for current user, then load note
  useEffect(() => {
    if (!user?.id || !caseId) {
      setLoadStatus("idle");
      return;
    }
    let cancelled = false;
    setLoadStatus("loading");
    (async () => {
      try {
        const { data: ru, error: ruErr } = await supabase
          .from("rc_users")
          .select("id")
          .eq("auth_user_id", user.id)
          .in("role", ["rn_cm", "supervisor"])
          .maybeSingle();
        if (ruErr || !ru?.id) {
          if (!cancelled) setLoadStatus("loaded");
          return;
        }
        if (cancelled) return;
        setRnUserId(ru.id);

        const { data: rows, error } = await supabase
          .from("rc_rn_task_notes")
          .select("content")
          .eq("case_id", caseId)
          .eq("rn_user_id", ru.id)
          .maybeSingle();
        if (!cancelled) {
          setContent(rows?.content ?? "");
          lastSavedRef.current = rows?.content ?? "";
          setLoadStatus(error ? "error" : "loaded");
        }
      } catch (_) {
        if (!cancelled) setLoadStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, caseId]);

  // Debounced save on content change
  useEffect(() => {
    if (loadStatus !== "loaded" || !rnUserId || readOnly) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (content === lastSavedRef.current) return;
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      persist(content);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [content, loadStatus, rnUserId, readOnly, persist]);

  const handleBlur = () => {
    if (readOnly || content === lastSavedRef.current) return;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    persist(content);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  if (!caseId) return null;

  return (
    <section
      style={{
        marginTop: "1.5rem",
        padding: "1rem",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        background: "#f8fafc",
      }}
    >
      <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.25rem" }}>
        RN Task Notes (Private)
      </h3>
      <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.75rem" }}>
        For reminders and tasks only. Anything affecting the clinical file must be documented
        clinically. These notes are never shared or exported.
      </p>
      <textarea
        value={content}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={readOnly || loadStatus === "loading" || (loadStatus === "loaded" && !rnUserId)}
        placeholder="Add reminders, subsequent care plan items, questions, or tasks for yourself…"
        rows={4}
        style={{
          width: "100%",
          padding: "0.5rem 0.6rem",
          borderRadius: "6px",
          border: "1px solid #cbd5e1",
          fontSize: "0.85rem",
          resize: "vertical",
          minHeight: "4.5rem",
        }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.5rem", marginTop: "0.35rem" }}>
        {loadStatus === "loading" && (
          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Loading…</span>
        )}
        {loadStatus === "loaded" && !readOnly && (
          <span style={{ fontSize: "0.75rem", color: saveStatus === "saving" ? "#0ea5e9" : saveStatus === "saved" ? "#16a34a" : "#64748b" }}>
            {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : "\u00A0"}
          </span>
        )}
      </div>
    </section>
  );
}
