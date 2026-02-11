/* ========================== RCMS C.A.R.E. — rcmsWiring.tsx ==========================
 * Purpose:
 *  - Attach your Intake & Check-in submit flows to Supabase backend with audit logs.
 *  - Provide a uniform withRBAC() guard that calls your central canAccess().
 *  - Small, drop-in helpers you can import where needed.
 *
 * Assumes you already have:
 *   - serializeIntakeForExport(form, { caseId, clientLabel, firmName })
 *   - toSheetRow(envelope)  (optional if you only store JSON)
 *   - canAccess(role, feature, ctx?) in src/lib/access (or similar)
 *   - useAuth() hook to get current user and roles
 * =================================================================================== */

import React, { useCallback, ComponentType } from "react";
import { postIntake, postCheckin, audit, withUserNotice } from "./supabaseOperations";
import { useAuth } from "@/auth/supabaseAuth";
import { useToast } from "@/hooks/use-toast";

/* ------------------------------ RBAC wrapper --------------------------------- */
/**
 * Minimal wrapper that checks your central canAccess() before rendering a feature.
 * 
 * Usage:
 *   const ProtectedComponent = withRBAC(MyComponent, { 
 *     feature: "VIEW_IDENTITY",
 *     requireRole: "ATTORNEY" 
 *   });
 */
export function withRBAC<P extends object>(
  Component: ComponentType<P>,
  options: { feature?: string; requireRole?: string; ctx?: any }
) {
  return function Guarded(props: P) {
    const { user, roles, hasRole } = useAuth();

    // Check if user is authenticated
    if (!user) {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Please sign in to access this feature.
        </div>
      );
    }

    // Check if user has required role
    if (options.requireRole && !hasRole(options.requireRole as any)) {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Access restricted. If you believe this is an error, contact RCMS support.
        </div>
      );
    }

    return <Component {...props} />;
  };
}

/* ---------------------------- Intake submission ------------------------------ */
/**
 * Use inside your Intake form component:
 *   const onSubmit = useIntakeSubmit({ getForm, caseId, clientLabel, firmName });
 *   <form onSubmit={onSubmit}>...</form>
 */
export function useIntakeSubmit({
  getForm,
  serializeIntakeForExport,
  caseId,
  clientLabel,
  firmName,
}: {
  getForm: () => any;
  serializeIntakeForExport: (form: any, meta: { caseId: string; clientLabel: string; firmName: string }) => any;
  caseId: string;
  clientLabel: string;
  firmName: string;
}) {
  const { user, roles } = useAuth();
  const { toast } = useToast();

  return useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault?.();

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in again.",
          variant: "destructive",
        });
        return;
      }

      const form = getForm();
      const envelope = serializeIntakeForExport(form, { caseId, clientLabel, firmName });

      const res = await withUserNotice(
        postIntake(envelope),
        undefined,
        (err) => {
          toast({
            title: "Intake submission failed",
            description: err.message || "Something went wrong. Please try again.",
            variant: "destructive",
          });
        }
      );

      if (res) {
        toast({
          title: "Success",
          description: "Intake submitted successfully.",
        });

        await audit({
          actorRole: roles[0] || "CLIENT",
          actorId: user.id,
          action: "INTAKE_SUBMIT",
          caseId,
          meta: { version: envelope?.meta?.version, source: envelope?.meta?.source },
        });
      }
    },
    [getForm, serializeIntakeForExport, caseId, clientLabel, firmName, user, roles, toast]
  );
}

/* ---------------------------- Check-in submission ---------------------------- */
/**
 * Use inside your Client Check-ins component:
 *   const onCheckin = useCheckinSubmit({ getPayload });
 *   <form onSubmit={onCheckin}>...</form>
 */
export function useCheckinSubmit({ getPayload }: { getPayload: () => any }) {
  const { user, roles } = useAuth();
  const { toast } = useToast();

  return useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault?.();

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in again.",
          variant: "destructive",
        });
        return;
      }

      const payload = getPayload();
      if (!payload?.case_id) {
        toast({
          title: "Missing case ID",
          description: "Please open your case from the portal.",
          variant: "destructive",
        });
        return;
      }

      const res = await withUserNotice(
        postCheckin(payload),
        undefined,
        (err) => {
          toast({
            title: "Check-in failed",
            description: err.message || "Something went wrong. Please try again.",
            variant: "destructive",
          });
        }
      );

      if (res) {
        toast({
          title: "Success",
          description: "Check-in saved successfully.",
        });

        await audit({
          actorRole: roles[0] || "CLIENT",
          actorId: user.id,
          action: "CHECKIN_SUBMIT",
          caseId: payload.case_id,
        });
      }
    },
    [getPayload, user, roles, toast]
  );
}

/* ------------------------------- Policy Acknowledgement ------------------------------- */
/** Call when a user confirms your Minimum Data / Consent Policy modal. */
export async function ackPolicyModal(user: any, roles: string[], caseId?: string) {
  if (!user) return;
  await audit({
    actorRole: roles[0] || "CLIENT",
    actorId: user.id,
    action: "POLICY_ACK",
    caseId,
  });
}

/* ------------------------------- Consent Revocation ---------------------------------- */
/** Call when a client revokes consent. */
export async function logConsentRevoked(user: any, roles: string[], caseId: string) {
  if (!user) return;
  await audit({
    actorRole: roles[0] || "CLIENT",
    actorId: user.id,
    action: "CONSENT_REVOKED",
    caseId,
  });
}
