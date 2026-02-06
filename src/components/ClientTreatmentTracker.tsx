import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Activity, Plus, ChevronDown, ChevronUp, FileText, CheckCircle, Edit, X } from "lucide-react";
import { format } from "date-fns";
import { createAutoNote } from "@/lib/autoNotes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Treatment {
  id: string;
  treatment_type: string;
  provider_name: string | null;
  facility_name: string | null;
  frequency: string | null;
  start_date: string | null;
  end_date: string | null;
  injury_related: boolean;
  is_active: boolean;
  notes: string | null;
  progress_notes: string | null;
  discontinue_reason: string | null;
  discontinued_by: string | null;
  created_at: string;
  updated_at: string | null;
}

interface TreatmentReconciliation {
  id: string;
  case_id: string;
  treatment_review_data: string | null;
  additional_comments: string | null;
  attested_at: string | null;
  created_at: string;
}

interface ClientTreatmentTrackerProps {
  caseId: string;
}

const TREATMENT_TYPES = [
  "Acupuncture",
  "Chiropractic Care",
  "Cortisone Injection",
  "CT Scan",
  "Epidural Injection",
  "Massage Therapy",
  "Mental Health/Counseling",
  "MRI",
  "Occupational Therapy",
  "Other",
  "Pain Management",
  "Physical Therapy",
  "Surgery",
  "Trigger Point Injection",
  "X-Ray",
];

const FREQUENCY_OPTIONS = [
  "Once",
  "Weekly",
  "Twice weekly",
  "Three times weekly",
  "Every other week",
  "Monthly",
  "As needed",
  "Completed",
  "Other",
];

const DISCONTINUE_REASONS = [
  "Completed treatment plan",
  "No longer needed",
  "Not effective",
  "Side effects",
  "Cost/insurance",
  "Provider recommendation",
  "Other",
];

export function ClientTreatmentTracker({ caseId }: ClientTreatmentTrackerProps) {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [reconciliations, setReconciliations] = useState<TreatmentReconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedTreatments, setExpandedTreatments] = useState<Set<string>>(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [expandedRecon, setExpandedRecon] = useState<string | null>(null);
  const [showDiscontinued, setShowDiscontinued] = useState(false);
  
  // Edit/Discontinue dialogs
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [discontinuingTreatment, setDiscontinuingTreatment] = useState<Treatment | null>(null);
  const [editForm, setEditForm] = useState({
    frequency: "",
    provider_name: "",
    facility_name: "",
    notes: "",
    reason_for_change: "",
  });
  const [discontinueForm, setDiscontinueForm] = useState({
    reason: "",
    end_date: "",
    who_advised: "",
    progress_notes: "",
  });

  const [newTreatment, setNewTreatment] = useState({
    treatment_type: "",
    provider_name: "",
    facility_name: "",
    frequency: "",
    start_date: "",
    notes: "",
    injury_related: true,
  });

  useEffect(() => {
    fetchTreatments();
    fetchReconciliations();
  }, [caseId]);

  async function fetchTreatments() {
    try {
      setLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_treatments?case_id=eq.${caseId}&order=created_at.desc`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch treatments');
      }

      const data = await response.json();
      setTreatments(data || []);
    } catch (err) {
      console.error("Error fetching treatments:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReconciliations() {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_treatment_reconciliations?case_id=eq.${caseId}&order=created_at.desc`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReconciliations(data || []);
      }
    } catch (err) {
      console.error("Error fetching reconciliations:", err);
    }
  }

  async function saveTreatmentReview(treatmentStatuses: any[], additionalComments?: string) {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const reviewData = {
        case_id: caseId,
        treatment_review_data: JSON.stringify(treatmentStatuses),
        additional_comments: additionalComments || null,
        attested_at: new Date().toISOString(),
      };

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_treatment_reconciliations`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(reviewData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to save treatment review:', errorText);
        throw new Error('Failed to save treatment review');
      }

      // Refresh reconciliation history after saving
      await fetchReconciliations();
    } catch (err) {
      console.error("Error saving treatment review:", err);
      throw err;
    }
  }

  async function handleAddTreatment() {
    if (!newTreatment.treatment_type.trim()) {
      alert("Please select a treatment type");
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const treatmentData = {
        case_id: caseId,
        treatment_type: newTreatment.treatment_type.trim(),
        provider_name: newTreatment.provider_name || null,
        facility_name: newTreatment.facility_name || null,
        frequency: newTreatment.frequency || null,
        start_date: newTreatment.start_date || null,
        notes: newTreatment.notes || null,
        injury_related: newTreatment.injury_related,
        is_active: true,
      };

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_treatments`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(treatmentData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save treatment');
      }

      // Reset form and refresh
      setNewTreatment({
        treatment_type: "",
        provider_name: "",
        facility_name: "",
        frequency: "",
        start_date: "",
        notes: "",
        injury_related: true,
      });
      setShowAddForm(false);
      await fetchTreatments();
      
      // Create auto-note for treatment addition
      try {
        await createAutoNote({
          caseId: caseId,
          noteType: 'treatment',
          title: 'Treatment Started',
          content: `Treatment started: ${newTreatment.treatment_type.trim()}${newTreatment.provider_name ? ` with ${newTreatment.provider_name}` : ''}`,
          triggerEvent: 'treatment_started',
          visibleToClient: true,
          visibleToRN: true,
          visibleToAttorney: false
        });
      } catch (err) {
        console.error("Failed to create auto-note for treatment addition:", err);
      }
    } catch (err: any) {
      console.error("Error adding treatment:", err);
      alert("Failed to add treatment: " + (err.message || "Unknown error"));
    }
  }

  async function handleContinueNoChanges(treatment: Treatment) {
    try {
      // Save review with "no changes" status
      await saveTreatmentReview([{
        treatment_id: treatment.id,
        treatment_type: treatment.treatment_type,
        provider_name: treatment.provider_name,
        facility_name: treatment.facility_name,
        frequency: treatment.frequency,
        injury_related: treatment.injury_related,
        status: "continued_no_changes",
        reviewed_at: new Date().toISOString(),
      }]);
      alert(`Confirmed: ${treatment.treatment_type} - No changes needed`);
    } catch (err) {
      alert("Failed to save review. Please try again.");
    }
  }

  async function handleContinueWithChanges(treatment: Treatment) {
    setEditingTreatment(treatment);
    setEditForm({
      frequency: treatment.frequency || "",
      provider_name: treatment.provider_name || "",
      facility_name: treatment.facility_name || "",
      notes: treatment.notes || "",
      reason_for_change: "",
    });
  }

  async function saveTreatmentChanges() {
    if (!editingTreatment) return;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const updateData: any = {
        frequency: editForm.frequency || null,
        provider_name: editForm.provider_name || null,
        facility_name: editForm.facility_name || null,
        notes: editForm.reason_for_change ? `${editingTreatment.notes || ''}\n[${format(new Date(), 'MMM d, yyyy')}] Changed: ${editForm.reason_for_change}`.trim() : editingTreatment.notes,
        updated_at: new Date().toISOString(),
      };

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_treatments?id=eq.${editingTreatment.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update treatment');
      }

      // Save review with "changed" status
      await saveTreatmentReview([{
        treatment_id: editingTreatment.id,
        treatment_type: editingTreatment.treatment_type,
        provider_name: editForm.provider_name || editingTreatment.provider_name,
        facility_name: editForm.facility_name || editingTreatment.facility_name,
        frequency: editForm.frequency || editingTreatment.frequency,
        injury_related: editingTreatment.injury_related,
        status: "continued_with_changes",
        changes: editForm.reason_for_change,
        reviewed_at: new Date().toISOString(),
      }], editForm.reason_for_change);

      setEditingTreatment(null);
      setEditForm({ frequency: "", provider_name: "", facility_name: "", notes: "", reason_for_change: "" });
      await fetchTreatments();
      alert("Treatment updated successfully");
    } catch (err: any) {
      console.error("Error updating treatment:", err);
      alert("Failed to update treatment: " + (err.message || "Unknown error"));
    }
  }

  async function handleDiscontinue(treatment: Treatment) {
    setDiscontinuingTreatment(treatment);
    setDiscontinueForm({
      reason: "",
      end_date: new Date().toISOString().split('T')[0],
      who_advised: "",
      progress_notes: "",
    });
  }

  async function saveDiscontinue() {
    if (!discontinuingTreatment) return;

    if (!discontinueForm.reason || !discontinueForm.end_date) {
      alert("Please provide a reason and end date");
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const updateData = {
        is_active: false,
        end_date: discontinueForm.end_date || null,
        discontinue_reason: discontinueForm.reason || null,
        discontinued_by: discontinueForm.who_advised || null,
        progress_notes: discontinueForm.progress_notes || null,
        notes: `${discontinuingTreatment.notes || ''}\n[${format(new Date(), 'MMM d, yyyy')}] Discontinued: ${discontinueForm.reason}${discontinueForm.who_advised ? ` (Advised by: ${discontinueForm.who_advised})` : ''}`.trim(),
        updated_at: new Date().toISOString(),
      };

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_treatments?id=eq.${discontinuingTreatment.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to discontinue treatment');
      }

      // Save review with "discontinued" status
      await saveTreatmentReview([{
        treatment_id: discontinuingTreatment.id,
        treatment_type: discontinuingTreatment.treatment_type,
        provider_name: discontinuingTreatment.provider_name,
        facility_name: discontinuingTreatment.facility_name,
        frequency: discontinuingTreatment.frequency,
        injury_related: discontinuingTreatment.injury_related,
        status: "discontinued",
        reason: discontinueForm.reason,
        who_advised: discontinueForm.who_advised,
        progress_notes: discontinueForm.progress_notes,
        reviewed_at: new Date().toISOString(),
      }], discontinueForm.progress_notes || null);

      setDiscontinuingTreatment(null);
      const treatmentType = discontinuingTreatment.treatment_type;
      const reason = discontinueForm.reason;
      setDiscontinueForm({ reason: "", end_date: "", who_advised: "", progress_notes: "" });
      await fetchTreatments();
      alert("Treatment discontinued successfully");
      
      // Create auto-note for treatment discontinuation
      try {
        await createAutoNote({
          caseId: caseId,
          noteType: 'treatment',
          title: 'Treatment Ended',
          content: `Treatment ended: ${treatmentType} - Reason: ${reason}`,
          triggerEvent: 'treatment_ended',
          visibleToClient: true,
          visibleToRN: true,
          visibleToAttorney: false
        });
      } catch (err) {
        console.error("Failed to create auto-note for treatment discontinuation:", err);
      }
    } catch (err: any) {
      console.error("Error discontinuing treatment:", err);
      alert("Failed to discontinue treatment: " + (err.message || "Unknown error"));
    }
  }

  const toggleExpand = (treatmentId: string) => {
    const newExpanded = new Set(expandedTreatments);
    if (newExpanded.has(treatmentId)) {
      newExpanded.delete(treatmentId);
    } else {
      newExpanded.add(treatmentId);
    }
    setExpandedTreatments(newExpanded);
  };

  // Filter treatments
  const activeTreatments = treatments.filter((t) => t.is_active);
  const discontinuedTreatments = treatments.filter((t) => !t.is_active);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-slate-600">Loading treatments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <CardTitle className="text-white text-2xl">My Treatments</CardTitle>
          <p className="text-white/80 text-sm mt-1">
            Track all treatments and therapies related to your injury and recovery
          </p>
        </CardHeader>
      </Card>

      {/* 2. Treatment Review History */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white">Treatment Review History</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="text-white hover:text-white/80"
            >
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        {showHistory && (
          <CardContent className="space-y-3">
            {reconciliations.length === 0 ? (
              <p className="text-white/80 text-sm">No treatment reviews completed yet.</p>
            ) : (
              reconciliations.map((recon) => (
                <div key={recon.id} className="bg-white/20 rounded-lg p-3 border border-white/30">
                  <button
                    onClick={() => setExpandedRecon(expandedRecon === recon.id ? null : recon.id)}
                    className="w-full flex justify-between items-center text-left"
                  >
                    <span className="text-white font-medium">
                      Treatment Review - {format(new Date(recon.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-white/70 transition-transform ${expandedRecon === recon.id ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {expandedRecon === recon.id && (
                    <div className="mt-4 pt-4 border-t border-white/20 space-y-4 text-white/90 text-sm">
                      {/* a) Treatments Reviewed Section */}
                      {recon.treatment_review_data && (
                        <div>
                          <h5 className="font-semibold text-white mb-2">Treatments Reviewed</h5>
                          {(() => {
                            try {
                              const reviewData = JSON.parse(recon.treatment_review_data);
                              const treatmentsList = Array.isArray(reviewData) ? reviewData : [];
                              
                              // Group by pre-injury and post-injury (if available in data)
                              const preInjury = treatmentsList.filter((t: any) => !t.injury_related);
                              const postInjury = treatmentsList.filter((t: any) => t.injury_related);
                              
                              return (
                                <div className="space-y-3 ml-2">
                                  {preInjury.length > 0 && (
                                    <div>
                                      <p className="font-medium mb-1">Pre-Injury Treatments:</p>
                                      <ul className="list-disc list-inside ml-2 space-y-1">
                                        {preInjury.map((t: any, idx: number) => (
                                          <li key={idx}>
                                            <strong>{t.treatment_type}</strong>
                                            {t.provider_name && <span> - {t.provider_name}</span>}
                                            {t.frequency && <span> ({t.frequency})</span>}
                                            {t.status && <span> - Status: {t.status.replace(/_/g, ' ')}</span>}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {postInjury.length > 0 && (
                                    <div>
                                      <p className="font-medium mb-1">Post-Injury Treatments:</p>
                                      <ul className="list-disc list-inside ml-2 space-y-1">
                                        {postInjury.map((t: any, idx: number) => (
                                          <li key={idx}>
                                            <strong>{t.treatment_type}</strong>
                                            {t.provider_name && <span> - {t.provider_name}</span>}
                                            {t.frequency && <span> ({t.frequency})</span>}
                                            {t.status && <span> - Status: {t.status.replace(/_/g, ' ')}</span>}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {preInjury.length === 0 && postInjury.length === 0 && (
                                    <p className="ml-2">No treatments reviewed</p>
                                  )}
                                </div>
                              );
                            } catch {
                              return <p className="ml-2">{recon.treatment_review_data}</p>;
                            }
                          })()}
                        </div>
                      )}

                      {/* b) Additional Comments */}
                      {recon.additional_comments && (
                        <div>
                          <h5 className="font-semibold text-white mb-2">Additional Comments</h5>
                          <p className="ml-2">{recon.additional_comments}</p>
                        </div>
                      )}

                      {/* c) Attestation */}
                      {recon.attested_at && (
                        <div>
                          <p className="font-semibold text-white">Attestation</p>
                          <p className="ml-2">Attested on {format(new Date(recon.attested_at), "MMM d, yyyy 'at' h:mm a")}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        )}
      </Card>

      {/* 3. Current Treatments */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <CardTitle className="text-white">Current Treatments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeTreatments.length === 0 ? (
            <p className="text-white/80 text-sm">No active treatments recorded</p>
          ) : (
            activeTreatments.map((treatment) => (
              <Card key={treatment.id} className="bg-white border-slate-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-teal-600" />
                        <h4 className="font-semibold text-slate-800">{treatment.treatment_type}</h4>
                        <Badge className={treatment.injury_related ? "bg-amber-600 text-white text-xs" : "bg-blue-600 text-white text-xs"}>
                          {treatment.injury_related ? "Post-Injury" : "Pre-Injury"}
                        </Badge>
                      </div>
                      {(treatment.provider_name || treatment.facility_name) && (
                        <p className="text-sm text-slate-600">
                          {treatment.provider_name || treatment.facility_name}
                          {treatment.provider_name && treatment.facility_name && <span> - {treatment.facility_name}</span>}
                        </p>
                      )}
                      {treatment.frequency && (
                        <p className="text-sm text-slate-600">Frequency: {treatment.frequency}</p>
                      )}
                      {treatment.start_date && (
                        <p className="text-sm text-slate-600">Started: {format(new Date(treatment.start_date), "MMM d, yyyy")}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleExpand(treatment.id)}
                    >
                      {expandedTreatments.has(treatment.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {expandedTreatments.has(treatment.id) && (
                    <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                      {treatment.notes && (
                        <div>
                          <span className="font-medium text-slate-700">Notes: </span>
                          <span className="text-slate-600">{treatment.notes}</span>
                        </div>
                      )}
                      {treatment.progress_notes && (
                        <div>
                          <span className="font-medium text-slate-700">Progress Notes: </span>
                          <span className="text-slate-600">{treatment.progress_notes}</span>
                        </div>
                      )}
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Button
                          size="sm"
                          onClick={() => handleContinueNoChanges(treatment)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Continue - No Changes
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleContinueWithChanges(treatment)}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Continue - With Changes
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDiscontinue(treatment)}
                          variant="destructive"
                          className="text-xs"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Discontinue
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* 4. Add New Treatment Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Treatment
        </Button>
      </div>

      {/* 5. Discontinued/Completed Treatments */}
      {discontinuedTreatments.length > 0 && (
        <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-white">Discontinued/Completed Treatments</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDiscontinued(!showDiscontinued)}
                className="text-white hover:text-white/80"
              >
                {showDiscontinued ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          {showDiscontinued && (
            <CardContent className="space-y-3">
              {discontinuedTreatments.map((treatment) => (
                <Card key={treatment.id} className="bg-slate-100 border-slate-300 opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-4 h-4 text-slate-500" />
                      <h4 className="font-semibold text-slate-600 line-through">{treatment.treatment_type}</h4>
                    </div>
                    <p className="text-sm text-slate-500">
                      {treatment.provider_name && <span>{treatment.provider_name}</span>}
                      {treatment.start_date && (
                        <>
                          {treatment.provider_name && <span> • </span>}
                          <span>Started: {format(new Date(treatment.start_date), "MMM d, yyyy")}</span>
                        </>
                      )}
                      {treatment.end_date && (
                        <>
                          {treatment.start_date && <span> • </span>}
                          <span>Ended: {format(new Date(treatment.end_date), "MMM d, yyyy")}</span>
                        </>
                      )}
                    </p>
                    {treatment.discontinue_reason && (
                      <p className="text-xs text-slate-500 mt-1">
                        Reason: {treatment.discontinue_reason}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Add Treatment Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Treatment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Treatment Type *</Label>
              <Select
                value={newTreatment.treatment_type}
                onValueChange={(value) => setNewTreatment({ ...newTreatment, treatment_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select treatment type" />
                </SelectTrigger>
                <SelectContent>
                  {TREATMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Provider Name</Label>
                <Input
                  value={newTreatment.provider_name}
                  onChange={(e) => setNewTreatment({ ...newTreatment, provider_name: e.target.value })}
                  placeholder="e.g., Dr. Smith"
                />
              </div>
              <div>
                <Label>Facility Name</Label>
                <Input
                  value={newTreatment.facility_name}
                  onChange={(e) => setNewTreatment({ ...newTreatment, facility_name: e.target.value })}
                  placeholder="e.g., ABC Physical Therapy"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Frequency</Label>
                <Select
                  value={newTreatment.frequency}
                  onValueChange={(value) => setNewTreatment({ ...newTreatment, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {freq}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newTreatment.start_date}
                  onChange={(e) => setNewTreatment({ ...newTreatment, start_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={newTreatment.notes}
                onChange={(e) => setNewTreatment({ ...newTreatment, notes: e.target.value })}
                placeholder="Additional notes about this treatment"
                rows={3}
              />
            </div>
            <div>
              <Label>Treatment Type</Label>
              <RadioGroup
                value={newTreatment.injury_related ? "post-injury" : "pre-injury"}
                onValueChange={(value) => setNewTreatment({ ...newTreatment, injury_related: value === "post-injury" })}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pre-injury" id="pre-injury" />
                  <Label htmlFor="pre-injury" className="cursor-pointer">
                    Pre-Injury Treatment
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="post-injury" id="post-injury" />
                  <Label htmlFor="post-injury" className="cursor-pointer">
                    Post-Injury Treatment
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTreatment} className="bg-amber-600 hover:bg-amber-700 text-white">
                Save Treatment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Treatment Dialog */}
      <Dialog open={!!editingTreatment} onOpenChange={() => setEditingTreatment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Treatment: {editingTreatment?.treatment_type}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Frequency</Label>
                <Select
                  value={editForm.frequency}
                  onValueChange={(value) => setEditForm({ ...editForm, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {freq}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Provider Name</Label>
                <Input
                  value={editForm.provider_name}
                  onChange={(e) => setEditForm({ ...editForm, provider_name: e.target.value })}
                  placeholder="e.g., Dr. Smith"
                />
              </div>
              <div>
                <Label>Facility Name</Label>
                <Input
                  value={editForm.facility_name}
                  onChange={(e) => setEditForm({ ...editForm, facility_name: e.target.value })}
                  placeholder="e.g., ABC Physical Therapy"
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Additional notes"
                rows={3}
              />
            </div>
            <div>
              <Label>Reason for Change</Label>
              <Textarea
                value={editForm.reason_for_change}
                onChange={(e) => setEditForm({ ...editForm, reason_for_change: e.target.value })}
                placeholder="Why are you making these changes?"
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditingTreatment(null)}>
                Cancel
              </Button>
              <Button onClick={saveTreatmentChanges} className="bg-amber-600 hover:bg-amber-700 text-white">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discontinue Treatment Dialog */}
      <Dialog open={!!discontinuingTreatment} onOpenChange={() => setDiscontinuingTreatment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Discontinue Treatment: {discontinuingTreatment?.treatment_type}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason *</Label>
              <Select
                value={discontinueForm.reason}
                onValueChange={(value) => setDiscontinueForm({ ...discontinueForm, reason: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {DISCONTINUE_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={discontinueForm.end_date}
                  onChange={(e) => setDiscontinueForm({ ...discontinueForm, end_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Who Advised</Label>
                <Input
                  value={discontinueForm.who_advised}
                  onChange={(e) => setDiscontinueForm({ ...discontinueForm, who_advised: e.target.value })}
                  placeholder="e.g., Dr. Smith, Self, Other"
                />
              </div>
            </div>
            <div>
              <Label>Outcome/Progress Notes</Label>
              <Textarea
                value={discontinueForm.progress_notes}
                onChange={(e) => setDiscontinueForm({ ...discontinueForm, progress_notes: e.target.value })}
                placeholder="Final progress notes or outcome"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDiscontinuingTreatment(null)}>
                Cancel
              </Button>
              <Button onClick={saveDiscontinue} variant="destructive">
                Discontinue Treatment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}