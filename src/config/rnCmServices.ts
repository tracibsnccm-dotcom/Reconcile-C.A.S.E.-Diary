export const RN_CM_SERVICES_CATALOG = {
  version: "2025-10-30",
  catalog: [
    {
      id: "rcms_additional_clinical_narrative_v1",
      title: "Additional Clinical Narrative Report",
      short_desc: "RN-prepared narrative tying symptoms, diagnostics, and functional impact to the incident.",
      long_desc: "A focused, attorney-ready clinical summary that synthesizes EMR notes, imaging, and patient journal entries into a single, defensible narrative.",
      price_cents: 39500,
      taxable: true,
      billable_code: "SRV-CLN-NARR",
      delivery_type: "pdf",
      sla_business_days: 3,
      requires_ack: true,
      visible_to_roles: ["attorney"],
      form_schema: [
        { name: "case_id", label: "Case ID", type: "text", required: true },
        { name: "focus_area", label: "Focus Area", type: "select", options: ["Pain Course", "Function/ADLs", "Imaging Summary", "Work Impact"], required: true },
        { name: "date_range", label: "Date Range", type: "daterange", required: false },
        { name: "special_instructions", label: "Special Instructions", type: "textarea", required: false }
      ]
    },
    {
      id: "rcms_provider_coordination_call_v1",
      title: "Provider Coordination Call",
      short_desc: "RN CM coordinates a direct call with treating provider.",
      long_desc: "We schedule and document a structured call to clarify diagnosis, treatment plan, work restrictions, and next steps.",
      price_cents: 22500,
      taxable: true,
      billable_code: "SRV-PROV-CALL",
      delivery_type: "memo_pdf",
      sla_business_days: 2,
      requires_ack: true,
      visible_to_roles: ["attorney"],
      form_schema: [
        { name: "case_id", label: "Case ID", type: "text", required: true },
        { name: "provider_name", label: "Provider Name", type: "text", required: true },
        { name: "call_objective", label: "Call Objective", type: "select", options: ["Documentation Clarification", "Restrictions", "Prognosis", "Work Status"], required: true },
        { name: "urgency", label: "Urgency", type: "select", options: ["Routine", "Urgent (48h)"], required: true }
      ]
    },
    {
      id: "rcms_expedited_records_retrieval_v1",
      title: "Expedited Records Retrieval",
      short_desc: "Priority request + follow-up to obtain missing clinical records.",
      long_desc: "RN CM submits targeted records requests, performs 2 follow-ups, and validates completeness upon receipt.",
      price_cents: 18500,
      taxable: true,
      billable_code: "SRV-REC-EXP",
      delivery_type: "zip",
      sla_business_days: 5,
      requires_ack: true,
      visible_to_roles: ["attorney"],
      form_schema: [
        { name: "case_id", label: "Case ID", type: "text", required: true },
        { name: "facility", label: "Facility/Clinic", type: "text", required: true },
        { name: "record_types", label: "Record Types", type: "multiselect", options: ["ED Notes", "Imaging", "PT/OT", "Op Report", "Billing"], required: true }
      ]
    },
    {
      id: "rcms_hospitalization_alert_summary_v1",
      title: "Hospitalization Event Alert & Summary",
      short_desc: "Rapid alert plus 1-page RN summary after ED/inpatient event.",
      long_desc: "We detect/confirm hospitalization, notify your team, and deliver a concise summary of diagnoses, interventions, and disposition.",
      price_cents: 14500,
      taxable: true,
      billable_code: "SRV-HOSP-ALERT",
      delivery_type: "pdf",
      sla_business_days: 1,
      requires_ack: false,
      visible_to_roles: ["attorney"],
      form_schema: [
        { name: "case_id", label: "Case ID", type: "text", required: true },
        { name: "event_date", label: "Event Date", type: "date", required: true }
      ]
    },
    {
      id: "rcms_deposition_prep_packet_v1",
      title: "Deposition Prep Packet (Clinical)",
      short_desc: "Curated extracts, timeline, and RN talking points.",
      long_desc: "Attorney-ready packet: indexed exhibits, care timeline, objective findings, and red-flag clarifications for depo prep.",
      price_cents: 49500,
      taxable: true,
      billable_code: "SRV-DEPO-PREP",
      delivery_type: "pdf_zip",
      sla_business_days: 7,
      requires_ack: true,
      visible_to_roles: ["attorney"],
      form_schema: [
        { name: "case_id", label: "Case ID", type: "text", required: true },
        { name: "depo_date", label: "Deposition Date", type: "date", required: true },
        { name: "scope", label: "Scope", type: "multiselect", options: ["Orthopedic", "Neuro", "Pain Mgmt", "Primary Care", "PT/OT"], required: true }
      ]
    },
    {
      id: "rcms_med_recon_adherence_plan_v1",
      title: "Medication Reconciliation & Adherence Plan",
      short_desc: "RN conducts med rec and creates a client adherence plan.",
      long_desc: "Verifies active meds, flags interactions, aligns with provider orders, and delivers a client-friendly plan.",
      price_cents: 26500,
      taxable: true,
      billable_code: "SRV-MED-RECON",
      delivery_type: "pdf",
      sla_business_days: 3,
      requires_ack: false,
      visible_to_roles: ["attorney"],
      form_schema: [
        { name: "case_id", label: "Case ID", type: "text", required: true },
        { name: "focus", label: "Primary Focus", type: "select", options: ["Polypharmacy", "Pain Regimen", "Psych", "Other"], required: true }
      ]
    },
    {
      id: "rcms_sdoh_resource_placement_v1",
      title: "SDOH Resource Placement",
      short_desc: "Connects client to community resources based on flags.",
      long_desc: "Targeted placement for transportation, housing, food, or counseling; includes 2 follow-ups and outcome note.",
      price_cents: 15500,
      taxable: true,
      billable_code: "SRV-SDOH-PLAC",
      delivery_type: "memo_pdf",
      sla_business_days: 5,
      requires_ack: false,
      visible_to_roles: ["attorney"],
      form_schema: [
        { name: "case_id", label: "Case ID", type: "text", required: true },
        { name: "need", label: "Primary Need", type: "select", options: ["Transportation", "Housing", "Food", "Counseling"], required: true }
      ]
    },
    {
      id: "rcms_ime_peer_review_liaison_v1",
      title: "IME / Peer Review Liaison",
      short_desc: "RN coordinates with IME/peer reviewer; collects clarifications.",
      long_desc: "We interface professionally to clarify medical questions, ensure accurate clinical framing, and document outcomes.",
      price_cents: 32500,
      taxable: true,
      billable_code: "SRV-IME-LIAISON",
      delivery_type: "memo_pdf",
      sla_business_days: 4,
      requires_ack: true,
      visible_to_roles: ["attorney"],
      form_schema: [
        { name: "case_id", label: "Case ID", type: "text", required: true },
        { name: "reviewer", label: "Reviewer/Org", type: "text", required: true },
        { name: "questions", label: "Key Questions", type: "textarea", required: false }
      ]
    },
    {
      id: "rcms_custom_timeline_build_v1",
      title: "Custom Clinical Timeline Build",
      short_desc: "Chronological care timeline with key events and exhibits.",
      long_desc: "Structured, exportable timeline (PDF/CSV) linking encounters, diagnostics, and provider notes to dates and exhibits.",
      price_cents: 44500,
      taxable: true,
      billable_code: "SRV-TIMELINE",
      delivery_type: "pdf_csv",
      sla_business_days: 6,
      requires_ack: true,
      visible_to_roles: ["attorney"],
      form_schema: [
        { name: "case_id", label: "Case ID", type: "text", required: true },
        { name: "include_exhibits", label: "Include Exhibits Index", type: "checkbox", required: false }
      ]
    },
    {
      id: "rcms_er_visit_summary_v1",
      title: "ER/Hospital Visit Summary (Add-On)",
      short_desc: "1-page RN summary of a single ED/inpatient encounter.",
      long_desc: "Concise clinical synopsis: chief complaint, interventions, diagnostics, disposition, and follow-up plan.",
      price_cents: 11500,
      taxable: true,
      billable_code: "SRV-ER-SUM",
      delivery_type: "pdf",
      sla_business_days: 1,
      requires_ack: false,
      visible_to_roles: ["attorney"],
      form_schema: [
        { name: "case_id", label: "Case ID", type: "text", required: true },
        { name: "encounter_date", label: "Encounter Date", type: "date", required: true }
      ]
    }
  ],
  ui_defaults: {
    currency: "USD",
    display_price: true,
    button_style: { bg: "#b09837", text: "#000000", hover_bg: "#000000", hover_text: "#b09837" },
    card_style: { radius: "1rem", shadow: "soft", header_color: "#0f2a6a", icon_color: "#128f8b" }
  },
  workflow: {
    on_request_submit: {
      create_task: true,
      task_queue: "rn_cm_special_services",
      notify_roles: ["rn_cm", "attorney"],
      audit_log: true
    },
    billing: {
      charge_method: "wallet_or_card",
      block_if_insufficient_wallet: false,
      item_label_prefix: "RN CM Special Service",
      invoice_line_format: "{{title}} — Case {{case_id}}"
    }
  }
};

export type RNCMService = typeof RN_CM_SERVICES_CATALOG.catalog[number];
