/**
 * C-6: Single source of truth for participation status messaging.
 * Do NOT add refused copy here; refused has its own banner/note behavior.
 */

export type ParticipationStatus =
  | 'participating'
  | 'refused'
  | 'unable_to_determine';

export const PARTICIPATION_COPY = {
  unable_to_determine: {
    statusLabel: 'Unable to reach — participation undetermined',
    rnHelper:
      "Mark as 'Unable to reach' when participation cannot be confirmed after reasonable attempts. This status is visible to the attorney (informational).",
    attorneyBanner:
      "Client participation is currently undetermined because the client has been unable to be reached by the RN Care Manager. Care plan development may be limited until participation is confirmed.",
    clientBanner:
      "Your RN Care Manager needs to confirm your participation to proceed. Please send a message to continue.",
    clientCtaLabel: 'Message RN Care Manager',
  },
} as const;
