/**
 * RNCaseStateBadge
 *
 * RN-only: Prominent pill/badge for draft vs released vs closed.
 * Persists at top of RN case view. Includes microcopy and optional
 * "Back to current draft" when in released/closed, and "Create Revision" when viewing a released/closed snapshot.
 */

import React, { useState } from "react";
import type { RNCaseEditMode } from "@/hooks/useRNCaseEditMode";
import { createRevisionFromSnapshot } from "@/lib/rnCaseHelpers";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/** RN-only: tooltip for disabled save/submit when viewing released/closed. */
export const RN_VIEW_ONLY_TOOLTIP =
  "This is a released snapshot. Return to current draft to make changes.";

export interface RNCaseStateBadgeProps {
  mode: RNCaseEditMode;
  isViewOnly: boolean;
  loading?: boolean;
  backToDraftId: string | null;
  onBackToDraft?: (draftId: string) => void;
  /** If true, show the Back to current draft button (when onBackToDraft and backToDraftId are set) */
  showBackToDraft?: boolean;
  /** If true, show a hint that release history and publishing controls are in the Publish panel (removed per RN finalize cleanup) */
  showPublishHint?: boolean;
  /** Care plan is finalized/submitted; used for edit-window badge and microcopy. */
  carePlanSubmitted?: boolean;
  /** Edit window has passed; when true with carePlanSubmitted, show "Edit window closed". */
  editWindowClosed?: boolean;
  /** Formatted "Edits allowed until" datetime when care plan submitted and in window. */
  editWindowEndsAtFormatted?: string | null;
  /** Phase 1: User confirmed "Begin edits" on Finalize screen; when false with carePlanSubmitted, do not show "Edits allowed" badge. */
  editModeEnabled?: boolean;
  /** Phase 1: Content changed (4Ps/SDOH/10Vs/Overlays); when false with carePlanSubmitted, do not show "Edits allowed" badge. */
  isDirty?: boolean;
  /** Current case id (released/closed snapshot). When set with onCreateRevisionSuccess, shows Create Revision. */
  sourceCaseId?: string | null;
  /** Called after a new draft revision is created; parent should set active case, toast, and navigate. */
  onCreateRevisionSuccess?: (newDraftId: string) => void;
}

export function RNCaseStateBadge({
  mode,
  isViewOnly,
  loading = false,
  backToDraftId,
  onBackToDraft,
  showBackToDraft = true,
  showPublishHint = false,
  carePlanSubmitted = false,
  editWindowClosed = false,
  editWindowEndsAtFormatted = null,
  editModeEnabled = false,
  isDirty = false,
  sourceCaseId = null,
  onCreateRevisionSuccess,
}: RNCaseStateBadgeProps) {
  const [showCreateRevisionDialog, setShowCreateRevisionDialog] = useState(false);
  const [createRevisionError, setCreateRevisionError] = useState<string | null>(null);
  const [isCreatingRevision, setIsCreatingRevision] = useState(false);

  const handleBack = () => {
    if (backToDraftId && onBackToDraft) {
      onBackToDraft(backToDraftId);
    }
  };

  const handleConfirmCreateRevision = async () => {
    if (!sourceCaseId || !onCreateRevisionSuccess) return;
    setCreateRevisionError(null);
    setIsCreatingRevision(true);
    try {
      const { id } = await createRevisionFromSnapshot(sourceCaseId);
      setShowCreateRevisionDialog(false);
      onCreateRevisionSuccess(id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setCreateRevisionError(msg);
    } finally {
      setIsCreatingRevision(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span
          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border border-slate-300 bg-slate-100 text-slate-600"
          aria-label="Checking case state"
        >
          —
        </span>
        <span className="text-xs text-slate-500">Checking…</span>
      </div>
    );
  }

  const isReleased = mode === "released";
  const isClosed = mode === "closed";

  // Phase 1: When finalized + in window but no edits in progress, show plain "FINALIZED" (edit affordance lives on Finalize screen).
  const alreadyFinalizedNoEdits =
    carePlanSubmitted && editWindowEndsAtFormatted && !editModeEnabled && !isDirty;
  const badgeLabel =
    carePlanSubmitted && editWindowClosed
      ? "FINALIZED — Edit window closed"
      : carePlanSubmitted && editWindowEndsAtFormatted && !alreadyFinalizedNoEdits
        ? "FINALIZED — Edits allowed"
        : carePlanSubmitted && editWindowEndsAtFormatted && alreadyFinalizedNoEdits
          ? "FINALIZED"
          : mode === "draft"
          ? "DRAFT — Editable"
          : isReleased
            ? "RELEASED — View Only"
            : isClosed
              ? "CLOSED — View Only"
              : "—";
  const badgeTitle =
    carePlanSubmitted && editWindowClosed
      ? "Edit window has closed"
      : isViewOnly
        ? RN_VIEW_ONLY_TOOLTIP
        : undefined;

  const badgeEl = (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
        carePlanSubmitted && editWindowClosed
          ? "border-slate-400 bg-slate-100 text-slate-600"
          : isViewOnly
            ? "border-amber-500 bg-amber-50 text-amber-800"
            : "border-slate-400 bg-slate-50 text-slate-700"
      }`}
      title={badgeTitle}
    >
      {badgeLabel}
    </span>
  );

  const microcopy =
    carePlanSubmitted && editWindowClosed
      ? "Edit window has closed."
      : carePlanSubmitted && editWindowEndsAtFormatted && !alreadyFinalizedNoEdits
        ? `Edits allowed until ${editWindowEndsAtFormatted}. A reminder has been added to your Care Plan Reminders.`
        : carePlanSubmitted && editWindowEndsAtFormatted && alreadyFinalizedNoEdits
          ? "No edits in progress. Use the Finalize step to begin edits."
          : isViewOnly
          ? "View-only snapshot. Use \"Back to current draft\" to edit."
          : "Edits apply to your current draft.";

  const showBack = showBackToDraft && isViewOnly && !!backToDraftId && !!onBackToDraft;
  const showCreateRevision = isViewOnly && !!sourceCaseId && !!onCreateRevisionSuccess;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {badgeEl}
        <span className="text-xs text-slate-600">{microcopy}</span>
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border border-amber-600 bg-white text-amber-800 hover:bg-amber-50"
          >
            Back to current draft
          </button>
        )}
        {showCreateRevision && (
          <button
            type="button"
            onClick={() => { setCreateRevisionError(null); setShowCreateRevisionDialog(true); }}
            className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border border-slate-600 bg-white text-slate-800 hover:bg-slate-50"
          >
            Create Revision
          </button>
        )}
        {showPublishHint && (
          <span className="text-xs text-slate-500 block w-full mt-1">
            Release history and publishing controls are available in the Publish panel.
          </span>
        )}
      </div>

      <AlertDialog open={showCreateRevisionDialog} onOpenChange={setShowCreateRevisionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create a new revision?</AlertDialogTitle>
            <AlertDialogDescription>
              This released snapshot is view-only. Creating a revision will start a new editable draft. The attorney will not see changes until you release the new revision.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {createRevisionError && (
            <div className="text-sm text-red-600 py-2">
              {createRevisionError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCreateRevisionError(null)}>Cancel</AlertDialogCancel>
            {createRevisionError && (
              <button
                type="button"
                onClick={handleConfirmCreateRevision}
                disabled={isCreatingRevision}
                className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              >
                Retry
              </button>
            )}
            <button
              type="button"
              onClick={handleConfirmCreateRevision}
              disabled={isCreatingRevision}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {isCreatingRevision ? "Creating…" : "Create Revision"}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
