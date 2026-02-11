/**
 * RN-only action config: dashboard (3) vs queue execution tiles.
 * Used by RNPortalLanding (dashboard) and RNWorkQueuePage (queue tools).
 * NO DB, no Attorney/Client changes.
 */

import {
  HeartPulse,
  ClipboardList,
  CheckCircle,
  FileText,
  FolderKanban,
  GitBranch,
  Bell,
  UserCheck,
  MessageSquare,
  Calendar,
  Search,
  Users,
  Play,
  type LucideIcon,
} from "lucide-react";

export interface DashboardAction {
  key: string;
  label: string;
  icon: LucideIcon;
  to: string;
}

export interface QueueAction {
  key: string;
  label: string;
  icon: LucideIcon;
  to?: string;
  action?: "timer";
}

/** Dashboard: ONLY these 3. Contact Sup/Mgr + Pending Queue + Active Queue. */
export const DASHBOARD_ACTIONS: DashboardAction[] = [
  { key: "contact", label: "Contact RN Sup/Mgr", icon: HeartPulse, to: "/rn-clinical-liaison" },
  { key: "pending", label: "Pending Work Queue", icon: ClipboardList, to: "/rn/queue?focus=pending" },
  { key: "active", label: "Active Work Queue", icon: CheckCircle, to: "/rn/queue?focus=active" },
];

/** Pending Queue Tools (above Pending list). */
export const PENDING_QUEUE_ACTIONS: QueueAction[] = [
  { key: "new-note", label: "New Note", icon: FileText, to: "/rn-clinical-liaison" },
  { key: "documents", label: "Documents & Files", icon: FolderKanban, to: "/documents" },
  { key: "care-workflows", label: "Care Workflows", icon: GitBranch, to: "/rn/care-workflows" },
  { key: "care-plan-reminders", label: "Care Plan Reminders", icon: Bell, to: "/rn/care-plan-reminders" },
  { key: "case-handoffs", label: "Case Hand-Offs", icon: UserCheck, to: "/rn/case-handoffs" },
];

/** Active Queue Tools (above Active list). Start Timer has action:'timer' — handler/state in page. */
export const ACTIVE_QUEUE_ACTIONS: QueueAction[] = [
  { key: "message-client", label: "Message Client", icon: MessageSquare, to: "/rn-clinical-liaison" },
  { key: "schedule", label: "Calendar & Schedule", icon: Calendar, to: "/rn-diary" },
  { key: "clinical-guidelines", label: "Clinical Guidelines", icon: Search, to: "/rn/clinical-guidelines" },
  { key: "provider-network", label: "Provider Network", icon: Users, to: "/providers" },
  { key: "team-chat", label: "Team Chat", icon: Users, to: "/rn-clinical-liaison" },
  { key: "start-timer", label: "Start Timer", action: "timer", icon: Play },
];
