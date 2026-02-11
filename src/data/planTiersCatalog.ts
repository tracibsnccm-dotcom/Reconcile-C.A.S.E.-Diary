export const PLAN_TIERS_CATALOG = {
  version: "2025-10-30",
  tiers: ["Basic", "Clinical", "Premium"],
  features: [
    {
      id: "core_platform",
      label: "Core Platform Software",
      desc: "Secure portal, case dashboard, documents, messaging.",
      availability: {
        Basic: "✅ INCLUDED",
        Clinical: "✅ INCLUDED",
        Premium: "✅ INCLUDED",
      },
    },
    {
      id: "client_education",
      label: "Client Education Packets",
      desc: "Pain, mental health, SDOH resources; share-ready PDFs.",
      availability: {
        Basic: "✅ INCLUDED",
        Clinical: "✅ INCLUDED",
        Premium: "✅ INCLUDED",
      },
    },
    {
      id: "provider_network",
      label: "Provider Network & Scheduling",
      desc: "Upload/route providers; client self-booking; provider badges.",
      availability: {
        Basic: "✅ INCLUDED",
        Clinical: "✅ INCLUDED",
        Premium: "✅ INCLUDED",
      },
    },
    {
      id: "clinical_reporting",
      label: "Clinical Reporting & Insight",
      desc: "RN-prepared reports and ongoing insights.",
      availability: {
        Basic: "➤ One-time initiation report (\"first chapter of the playbook\")",
        Clinical: "➤ Ongoing reports with RN CM management (\"coach for the entire season\")",
        Premium: "➤ Ongoing reports with RN CM management (\"coach for the entire season\")",
      },
      tooltip: {
        Basic: "One-time initiation report designed to set clinical baseline.",
        Clinical: "Multiple reports + ongoing RN CM management for the full case lifecycle.",
        Premium: "Multiple reports + ongoing RN CM management for the full case lifecycle.",
      },
    },
    {
      id: "rn_care_mgmt",
      label: "RN Care Management",
      desc: "Active nurse case management and follow-up.",
      availability: {
        Basic: "❌ Not included",
        Clinical: "✅ Included",
        Premium: "✅ Included",
      },
    },
    {
      id: "nudges",
      label: "Client \"Nudge\" & Compliance Tools",
      desc: "Automated reminders; adherence tracking.",
      availability: {
        Basic: "✅",
        Clinical: "✅ (enhanced rules)",
        Premium: "✅ (enhanced + priority)",
      },
    },
    {
      id: "sdoh_flags",
      label: "SDOH Flags & Resource Routing",
      desc: "Risk flags with targeted resource placement.",
      availability: {
        Basic: "✅",
        Clinical: "✅",
        Premium: "✅ + priority placement",
      },
    },
    {
      id: "analytics",
      label: "Attorney Analytics & Insights",
      desc: "Case metrics, timelines, provider response times.",
      availability: {
        Basic: "Core widgets",
        Clinical: "Core + filters",
        Premium: "Full suite + exports",
      },
      tooltip: {
        Basic: "Core widgets = intake → settlement time, provider responsiveness, open follow-ups.",
        Clinical: "Core widgets with advanced filtering options.",
        Premium: "Full suite adds CSV/PDF exports and custom ranges.",
      },
    },
    {
      id: "priority_support",
      label: "Priority Support",
      desc: "Dedicated response windows for issues and requests.",
      availability: {
        Basic: "Standard",
        Clinical: "Priority",
        Premium: "Priority+",
      },
    },
    {
      id: "addons",
      label: "RN CM Special Services (Add-ons)",
      desc: "Narratives, records retrieval, depo prep, etc.",
      availability: {
        Basic: "Available à la carte",
        Clinical: "Available à la carte",
        Premium: "Available à la carte",
      },
    },
  ],
};

export type PlanTier = "Basic" | "Clinical" | "Premium";
