// src/lib/workflows.ts

import { Client, Flag, Task, Effect, RiskLevel, FourPs, SDOH } from "./models";

/**
 * Intake workflow:
 * - Auto-flags high/critical SDOH domains
 * - Auto-flags if any 4Ps are very low (<=2)
 */
export function onIntakeSubmit(client: Client): Effect[] {
  const effects: Effect[] = [];

  const sdoh = client.sdoh;
  const fourPs = client.fourPs;

  if (sdoh) {
    (["housing", "food", "transport", "finances", "support"] as const).forEach(
      (domain) => {
        const level = sdoh[domain];
        if (isHigh(level)) {
          effects.push({
            type: "createFlag",
            payload: {
              type: "SDOH",
              label: `High ${domain} risk reported at intake`,
              severity: "High",
              requiresRnComment: true,
            },
          });
        }
      }
    );
  }

  if (fourPs) {
    const lowDomains: string[] = [];
    (["physical", "psychological", "professional", "personal"] as const).forEach(
      (key) => {
        const val = fourPs[key];
        if (val !== undefined && val <= 2) {
          lowDomains.push(key);
        }
      }
    );

    if (lowDomains.length > 0) {
      effects.push({
        type: "createFlag",
        payload: {
          type: "SupportNeeds",
          label: `Low 4Ps domains at intake: ${lowDomains.join(", ")}`,
          severity: "Moderate",
          requiresRnComment: true,
        },
      });
    }
  }

  return effects;
}

/**
 * Follow-up workflow:
 * - Requires RN CM to confirm review of all open High/Critical flags
 * - Records client's current CM decision
 * - Schedules next 30-day follow-up
 */
export function onFollowUpSubmit(
  client: Client,
  flags: Flag[],
  tasks: Task[],
  options: {
    reviewedAllHighCritical: boolean;
    clientDecision: "Accept" | "Decline";
  }
): Effect[] {
  const effects: Effect[] = [];

  const hasHighCriticalOpen = flags.some(
    (f) =>
      f.status === "Open" &&
      (f.severity === "High" || f.severity === "Critical")
  );

  if (hasHighCriticalOpen && !options.reviewedAllHighCritical) {
    effects.push({
      type: "validationError",
      payload: {
        message:
          "All open High/Critical items must be reviewed with the client before saving this follow-up.",
      },
    });
    return effects;
  }

  if (options.clientDecision === "Accept") {
    effects.push({
      type: "updateClient",
      payload: {
        cmDeclined: false,
        viabilityStatus: "Engaged",
      },
    });
  } else {
    effects.push({
      type: "updateClient",
      payload: {
        cmDeclined: true,
        viabilityStatus: "Client Declined",
        cmDeclineLastDate: new Date().toISOString(),
      },
    });
  }

  const now = new Date();
  const next = new Date();
  next.setDate(now.getDate() + 30);

  effects.push({
    type: "updateClient",
    payload: {
      lastFollowupDate: now.toISOString(),
      nextFollowupDue: next.toISOString().slice(0, 10),
    },
  });

  effects.push({
    type: "createTask",
    payload: {
      type: "FollowUp30Day",
      title: "Monthly Check-In / Readiness Review",
      assigned_to: "RN_CM",
      due_date: next.toISOString().slice(0, 10),
    },
  });

  return effects;
}

// Helpers

function isHigh(level?: RiskLevel): boolean {
  return level === "High" || level === "Critical";
}
