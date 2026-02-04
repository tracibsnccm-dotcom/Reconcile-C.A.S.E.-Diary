// IntakeCountdownBanner — 7-day countdown for client intake. (Ported from C.A.R.E.)

import { useState, useEffect } from "react";
import { INTAKE_WINDOW_DAYS, INTAKE_WINDOW_EXPIRED, COUNTDOWN_ACTIVE_SUFFIX } from "@/config/clientMessaging";

const SEVEN_DAYS_MS = INTAKE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export interface IntakeCountdownBannerProps {
  onExpired?: (expired: boolean) => void;
}

export function IntakeCountdownBanner({ onExpired }: IntakeCountdownBannerProps) {
  const [status, setStatus] = useState<"loading" | "active" | "expired">("loading");
  const [text, setText] = useState<string>("Loading intake timer…");

  useEffect(() => {
    const intakeId = sessionStorage.getItem("rcms_intake_id");
    const createdRaw = sessionStorage.getItem("rcms_intake_created_at");

    if (!intakeId) {
      setText("Loading intake timer…");
      setStatus("loading");
      onExpired?.(false);
      return;
    }

    if (!createdRaw) {
      setText("Loading intake timer…");
      setStatus("loading");
      onExpired?.(false);
      return;
    }

    const created = new Date(createdRaw).getTime();
    const end = created + SEVEN_DAYS_MS;

    const update = () => {
      const n = Date.now();
      const remaining = end - n;

      if (remaining <= 0) {
        setStatus("expired");
        setText(INTAKE_WINDOW_EXPIRED);
        onExpired?.(true);
        return;
      }

      const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
      const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
      const hh = hours.toString().padStart(2, "0");
      const mm = minutes.toString().padStart(2, "0");
      const ss = seconds.toString().padStart(2, "0");
      const timePart = `${hh}:${mm}:${ss}`;
      const daysPart = days > 0 ? `${days}d ` : "";
      setText(`You have ${daysPart}${timePart}${COUNTDOWN_ACTIVE_SUFFIX}`);
      setStatus("active");
      onExpired?.(false);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [onExpired]);

  const intakeStatus = sessionStorage.getItem("rcms_intake_status");
  if (intakeStatus === "submitted_pending_attorney" || intakeStatus === "submitted" || intakeStatus === "converted") {
    return null;
  }

  if (status === "loading") {
    return (
      <div className="bg-slate-800/50 border-b border-slate-700 px-4 py-2 text-sm text-slate-400">
        {text}
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="bg-red-900/20 border-b border-red-700/30 px-4 py-2 text-sm font-medium text-red-400">
        {text}
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 text-sm text-slate-200">
      {text}
    </div>
  );
}
