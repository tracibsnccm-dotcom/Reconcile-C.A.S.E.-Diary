/**
 * RN Block 3 — Step 8: One-click outreach note to satisfy SLA.
 * RN chooses channel via dropdown; one click records the attempt.
 * Template is pre-approved and non-editable. No automation.
 */

import React, { useState } from "react";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { recordRnOutreachAttempt, type OutreachChannel } from "@/lib/rnOutreachSla";
import { getOutreachNoteTemplate } from "@/lib/outreachNoteTemplate";
import { recordAckNoteSent, getAcceptanceState } from "@/lib/rnAcknowledgment";

const CHANNELS: { value: OutreachChannel; label: string }[] = [
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "text", label: "Text" },
  { value: "portal_message", label: "Portal message" },
  { value: "other", label: "Other" },
];

interface RNOutreachSectionProps {
  caseId: string | undefined;
}

export function RNOutreachSection({ caseId }: RNOutreachSectionProps) {
  const { user } = useAuth();
  const [channel, setChannel] = useState<OutreachChannel>("phone");
  const [recording, setRecording] = useState(false);

  const handleRecord = async () => {
    if (!caseId || !user?.id) return;
    setRecording(true);
    try {
      const note = getOutreachNoteTemplate({ channel });
      await recordRnOutreachAttempt({
        case_id: caseId,
        rn_user_id: user.id,
        channel,
        note,
      });
      toast.success("Outreach attempt recorded.");

      // Write ACK_NOTE_SENT governance event if accepted but no ack note yet
      try {
        if (caseId && user?.id) {
          const state = await getAcceptanceState(caseId, user.id);
          if (state.status === "accepted") {
            await recordAckNoteSent({
              case_id: caseId,
              sender_user_id: user.id,
              sender_role: "rn",
              epoch_id: state.epoch.epoch_id,
              assigned_rn_auth_user_id: state.epoch.assigned_rn_auth_user_id,
              sent_to: ["client", "attorney"],
            });
            console.info("[STAGING] ACK_NOTE_SENT event written for case:", caseId);
          }
        }
      } catch (ackErr) {
        console.warn("[STAGING] Failed to write ACK_NOTE_SENT:", ackErr);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to record outreach attempt.";
      toast.error(msg);
    } finally {
      setRecording(false);
    }
  };

  if (!caseId) return null;

  const templatePreview = getOutreachNoteTemplate({ channel });

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
      <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.5rem" }}>
        Outreach
      </h3>
      <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.75rem" }}>
        Record an outreach attempt to satisfy SLA. Select channel and click to record.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-start" }}>
        <div style={{ minWidth: "140px" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>
            Channel
          </label>
          <Select value={channel} onValueChange={(v) => setChannel(v as OutreachChannel)}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHANNELS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 500, color: "#64748b", display: "block", marginBottom: "0.25rem" }}>
            Note (preview, non-editable)
          </label>
          <div
            style={{
              padding: "0.5rem 0.6rem",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              fontSize: "0.85rem",
              color: "#475569",
              userSelect: "none",
            }}
          >
            {templatePreview}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <Button
            size="sm"
            onClick={handleRecord}
            disabled={recording || !user?.id}
          >
            {recording ? "Recording…" : "Record outreach attempt"}
          </Button>
        </div>
      </div>
    </section>
  );
}
