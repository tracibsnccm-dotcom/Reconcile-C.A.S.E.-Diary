// src/components/StagingBadge.tsx
import React from "react";
import { isStagingLikeEnvironment } from "@/lib/deployEnv";

type Props = {
  /**
   * Optional override to force-hide, intended only for special cases.
   * Default: false
   */
  forceHide?: boolean;
};

export default function StagingBadge({ forceHide = false }: Props) {
  const show = !forceHide && isStagingLikeEnvironment();

  if (!show) return null;

  return (
    <div role="status" aria-label="Staging environment indicator" className="fixed top-3 left-3 z-[9999] select-none">
      <div className="flex items-center gap-2 rounded-md border border-red-700 bg-red-600 px-3 py-1.5 shadow-lg">
        <span className="text-xs font-extrabold tracking-widest text-white">STAGING</span>
        <span className="hidden sm:inline text-xs font-medium text-white/90">Preview / Non-Production</span>
      </div>
    </div>
  );
}
