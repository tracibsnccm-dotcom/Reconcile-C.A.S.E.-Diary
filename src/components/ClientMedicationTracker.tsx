import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Pill, Plus, ChevronDown, ChevronUp, FileText, CheckCircle, Edit, X } from "lucide-react";
import { format } from "date-fns";
import { createAutoNote } from "@/lib/autoNotes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Medication {
  id: string;
  medication_name: string;
  dosage: string | null;
  frequency: string | null;
  prescribing_doctor: string | null;
  start_date: string | null;
  end_date: string | null;
  side_effects: string | null;
  reason_for_taking: string | null;
  pharmacy: string | null;
  notes: string | null;
  prn_frequency: string | null;
  prn_reason: string | null;
  injury_related: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Reconciliation {
  id: string;
  case_id: string;
  has_allergies: boolean;
  medication_allergies: string | null;
  food_allergies: string | null;
  allergy_reactions: string | null;
  allergy_attested_at: string | null;
  med_review_data: string | null;
  additional_comments: string | null;
  med_attested_at: string | null;
  created_at: string;
}

interface ClientMedicationTrackerProps {
  caseId: string;
}

export function ClientMedicationTracker({ caseId }: ClientMedicationTrackerProps) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedMeds, setExpandedMeds] = useState<Set<string>>(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [expandedRecon, setExpandedRecon] = useState<string | null>(null);
  const [showDiscontinued, setShowDiscontinued] = useState(false);
  
  // Edit/Discontinue dialogs
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [discontinuingMed, setDiscontinuingMed] = useState<Medication | null>(null);
  const [editForm, setEditForm] = useState({
    dosage: "",
    frequency: "",
    side_effects: "",
    reason_for_change: "",
  });
  const [discontinueForm, setDiscontinueForm] = useState({
    reason_stopped: "",
    date_stopped: "",
    who_advised: "",
  });

  const [newMed, setNewMed] = useState({
    medication_name: "",
    dosage: "",
    frequency: "",
    prescribing_doctor: "",
    start_date: "",
    reason_for_taking: "",
    pharmacy: "",
    notes: "",
    injury_related: true,
  });
  const [prnFrequency, setPrnFrequency] = useState("");
  const [prnReason, setPrnReason] = useState("");

  useEffect(() => {
    fetchMedications();
    fetchReconciliations();
  }, [caseId]);

  async function fetchMedications() {
    try {
      setLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_medications?case_id=eq.${caseId}&order=created_at.desc`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch medications');
      }

      const data = await response.json();
      setMedications(data || []);
    } catch (err) {
      console.error("Error fetching medications:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReconciliations() {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_med_reconciliations?case_id=eq.${caseId}&order=created_at.desc`,
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

  async function handleAddMedication() {
    if (!newMed.medication_name.trim()) {
      alert("Please enter a medication name");
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const medicationData = {
        case_id: caseId,
        medication_name: newMed.medication_name.trim(),
        dosage: newMed.dosage || null,
        frequency: newMed.frequency || null,
        prescribing_doctor: newMed.prescribing_doctor || null,
        start_date: newMed.start_date || null,
        reason_for_taking: newMed.reason_for_taking || null,
        pharmacy: newMed.pharmacy || null,
        notes: newMed.notes || null,
        injury_related: newMed.injury_related,
        prn_frequency: newMed.frequency === "As needed (PRN)" ? prnFrequency || null : null,
        prn_reason: newMed.frequency === "As needed (PRN)" ? prnReason || null : null,
        is_active: true,
      };

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_medications`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(medicationData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save medication');
      }

      // Reset form and refresh
      setNewMed({
        medication_name: "",
        dosage: "",
        frequency: "",
        prescribing_doctor: "",
        start_date: "",
        reason_for_taking: "",
        pharmacy: "",
        notes: "",
        injury_related: true,
      });
      setPrnFrequency("");
      setPrnReason("");
      setShowAddForm(false);
      await fetchMedications();
      
      // Create auto-note for medication addition
      try {
        await createAutoNote({
          caseId: caseId,
          noteType: 'medication',
          title: 'Medication Added',
          content: `New medication added: ${newMed.medication_name.trim()}`,
          triggerEvent: 'medication_added',
          visibleToClient: true,
          visibleToRN: true,
          visibleToAttorney: false
        });
      } catch (err) {
        console.error("Failed to create auto-note for medication addition:", err);
      }
    } catch (err: any) {
      console.error("Error adding medication:", err);
      alert("Failed to add medication: " + (err.message || "Unknown error"));
    }
  }

  async function handleContinueNoChanges(med: Medication) {
    alert(`Confirmed: ${med.medication_name} - No changes needed`);
  }

  async function handleContinueWithChanges(med: Medication) {
    setEditingMed(med);
    setEditForm({
      dosage: med.dosage || "",
      frequency: med.frequency || "",
      side_effects: med.side_effects || "",
      reason_for_change: "",
    });
  }

  async function saveMedicationChanges() {
    if (!editingMed) return;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const updateData: any = {
        dosage: editForm.dosage || null,
        frequency: editForm.frequency || null,
        side_effects: editForm.side_effects || null,
        notes: editForm.reason_for_change ? `${editingMed.notes || ''}\n[${format(new Date(), 'MMM d, yyyy')}] Changed: ${editForm.reason_for_change}`.trim() : editingMed.notes,
      };

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_medications?id=eq.${editingMed.id}`,
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
        throw new Error(errorText || 'Failed to update medication');
      }

      setEditingMed(null);
      setEditForm({ dosage: "", frequency: "", side_effects: "", reason_for_change: "" });
      await fetchMedications();
      alert("Medication updated successfully");
    } catch (err: any) {
      console.error("Error updating medication:", err);
      alert("Failed to update medication: " + (err.message || "Unknown error"));
    }
  }

  async function handleDiscontinue(med: Medication) {
    setDiscontinuingMed(med);
    setDiscontinueForm({
      reason_stopped: "",
      date_stopped: new Date().toISOString().split('T')[0],
      who_advised: "",
    });
  }

  async function saveDiscontinue() {
    if (!discontinuingMed) return;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const updateData = {
        is_active: false,
        end_date: discontinueForm.date_stopped || null,
        notes: `${discontinuingMed.notes || ''}\n[${format(new Date(), 'MMM d, yyyy')}] Discontinued: ${discontinueForm.reason_stopped}${discontinueForm.who_advised ? ` (Advised by: ${discontinueForm.who_advised})` : ''}`.trim(),
      };

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_medications?id=eq.${discontinuingMed.id}`,
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
        throw new Error(errorText || 'Failed to discontinue medication');
      }

      setDiscontinuingMed(null);
      const medicationName = discontinuingMed.medication_name;
      const reason = discontinueForm.reason_stopped;
      setDiscontinueForm({ reason_stopped: "", date_stopped: "", who_advised: "" });
      await fetchMedications();
      alert("Medication discontinued successfully");
      
      // Create auto-note for medication discontinuation
      try {
        await createAutoNote({
          caseId: caseId,
          noteType: 'medication',
          title: 'Medication Discontinued',
          content: `Medication discontinued: ${medicationName} - Reason: ${reason}`,
          triggerEvent: 'medication_discontinued',
          visibleToClient: true,
          visibleToRN: true,
          visibleToAttorney: false
        });
      } catch (err) {
        console.error("Failed to create auto-note for medication discontinuation:", err);
      }
    } catch (err: any) {
      console.error("Error discontinuing medication:", err);
      alert("Failed to discontinue medication: " + (err.message || "Unknown error"));
    }
  }

  const toggleExpand = (medId: string) => {
    const newExpanded = new Set(expandedMeds);
    if (newExpanded.has(medId)) {
      newExpanded.delete(medId);
    } else {
      newExpanded.add(medId);
    }
    setExpandedMeds(newExpanded);
  };

  // Filter medications
  const activeMeds = medications.filter((m) => m.is_active);
  const discontinuedMeds = medications.filter((m) => !m.is_active);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-slate-600">Loading medications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <CardTitle className="text-white text-2xl">My Medications</CardTitle>
          <p className="text-white/80 text-sm mt-1">
            Track all medications related to your injury and recovery
          </p>
        </CardHeader>
      </Card>

      {/* 2. Medication Review History */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white">Medication Review History</CardTitle>
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
              <p className="text-white/80 text-sm">No medication reviews completed yet.</p>
            ) : (
              reconciliations.map((recon) => (
                <div key={recon.id} className="bg-white/20 rounded-lg p-3 border border-white/30">
                  <button
                    onClick={() => setExpandedRecon(expandedRecon === recon.id ? null : recon.id)}
                    className="w-full flex justify-between items-center text-left"
                  >
                    <span className="text-white font-medium">
                      Medication Review - {format(new Date(recon.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-white/70 transition-transform ${expandedRecon === recon.id ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {expandedRecon === recon.id && (
                    <div className="mt-4 pt-4 border-t border-white/20 space-y-4 text-white/90 text-sm">
                      {/* a) Allergies Section */}
                      <div>
                        <h5 className="font-semibold text-white mb-2">Allergies</h5>
                        <div className="space-y-1 ml-2">
                          <p><strong>Has allergies:</strong> {recon.has_allergies ? 'Yes' : 'No'}</p>
                          {recon.medication_allergies && (
                            <div>
                              <p className="font-medium">Medication allergies:</p>
                              {(() => {
                                try {
                                  const allergies = JSON.parse(recon.medication_allergies);
                                  return Array.isArray(allergies) ? (
                                    <ul className="list-disc list-inside ml-2">
                                      {allergies.map((a: any, idx: number) => (
                                        <li key={idx}>
                                          {a.medication} - {a.reaction} ({a.severity})
                                        </li>
                                      ))}
                                    </ul>
                                  ) : <p className="ml-2">{recon.medication_allergies}</p>;
                                } catch {
                                  return <p className="ml-2">{recon.medication_allergies}</p>;
                                }
                              })()}
                            </div>
                          )}
                          {recon.food_allergies && (
                            <div>
                              <p className="font-medium">Food allergies:</p>
                              <p className="ml-2">{recon.food_allergies}</p>
                            </div>
                          )}
                          {recon.allergy_reactions && (
                            <div>
                              <p className="font-medium">Reactions:</p>
                              {(() => {
                                try {
                                  const reactions = JSON.parse(recon.allergy_reactions);
                                  return Array.isArray(reactions) ? (
                                    <ul className="list-disc list-inside ml-2">
                                      {reactions.map((r: any, idx: number) => (
                                        <li key={idx}>
                                          {r.medication} - {r.reaction} ({r.severity})
                                        </li>
                                      ))}
                                    </ul>
                                  ) : <p className="ml-2">{recon.allergy_reactions}</p>;
                                } catch {
                                  return <p className="ml-2">{recon.allergy_reactions}</p>;
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* b) Medications Reviewed Section */}
                      {recon.med_review_data && (
                        <div>
                          <h5 className="font-semibold text-white mb-2">Medications Reviewed</h5>
                          {(() => {
                            try {
                              const reviewData = JSON.parse(recon.med_review_data);
                              return (
                                <div className="space-y-3 ml-2">
                                  {reviewData.preInjuryMeds && reviewData.preInjuryMeds.length > 0 && (
                                    <div>
                                      <p className="font-medium mb-1">Pre-Injury Medications:</p>
                                      <ul className="list-disc list-inside ml-2 space-y-1">
                                        {reviewData.preInjuryMeds.map((m: any, idx: number) => (
                                          <li key={idx}>
                                            <strong>{m.brandName || m.genericName}</strong>
                                            {m.dose && <span> - {m.dose}</span>}
                                            {m.frequency && <span> {m.frequency}</span>}
                                            {m.purpose && <span> (for {m.purpose})</span>}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {reviewData.postInjuryMeds && reviewData.postInjuryMeds.length > 0 && (
                                    <div>
                                      <p className="font-medium mb-1">Post-Injury Medications:</p>
                                      <ul className="list-disc list-inside ml-2 space-y-1">
                                        {reviewData.postInjuryMeds.map((m: any, idx: number) => (
                                          <li key={idx}>
                                            <strong>{m.brandName || m.genericName}</strong>
                                            {m.dose && <span> - {m.dose}</span>}
                                            {m.frequency && <span> {m.frequency}</span>}
                                            {m.purpose && <span> (for {m.purpose})</span>}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              );
                            } catch {
                              return <p className="ml-2">{recon.med_review_data}</p>;
                            }
                          })()}
                        </div>
                      )}

                      {/* c) Attestation */}
                      {recon.med_attested_at && (
                        <div>
                          <p className="font-semibold text-white">Attestation</p>
                          <p className="ml-2">Attested on {format(new Date(recon.med_attested_at), "MMM d, yyyy 'at' h:mm a")}</p>
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

      {/* 3. Current Medications */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <CardTitle className="text-white">Current Medications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeMeds.length === 0 ? (
            <p className="text-white/80 text-sm">No active medications recorded</p>
          ) : (
            activeMeds.map((med) => (
              <Card key={med.id} className="bg-white border-slate-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Pill className="w-4 h-4 text-teal-600" />
                        <h4 className="font-semibold text-slate-800">{med.medication_name}</h4>
                        <Badge className={med.injury_related ? "bg-amber-600 text-white text-xs" : "bg-blue-600 text-white text-xs"}>
                          {med.injury_related ? "Post-Injury" : "Pre-Injury"}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {med.dosage && <span>{med.dosage}</span>}
                        {med.dosage && med.frequency && <span> • </span>}
                        {med.frequency && <span>{med.frequency}</span>}
                      </p>
                      {med.prescribing_doctor && (
                        <p className="text-sm text-slate-600">Prescriber: {med.prescribing_doctor}</p>
                      )}
                      {med.start_date && (
                        <p className="text-sm text-slate-600">Started: {format(new Date(med.start_date), "MMM d, yyyy")}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleExpand(med.id)}
                    >
                      {expandedMeds.has(med.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {expandedMeds.has(med.id) && (
                    <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                      {med.reason_for_taking && (
                        <div>
                          <span className="font-medium text-slate-700">Reason for Taking: </span>
                          <span className="text-slate-600">{med.reason_for_taking}</span>
                        </div>
                      )}
                      {med.side_effects && (
                        <div>
                          <span className="font-medium text-slate-700">Side Effects: </span>
                          <span className="text-slate-600">{med.side_effects}</span>
                        </div>
                      )}
                      {med.pharmacy && (
                        <div>
                          <span className="font-medium text-slate-700">Pharmacy: </span>
                          <span className="text-slate-600">{med.pharmacy}</span>
                        </div>
                      )}
                      {med.prn_frequency && (
                        <div>
                          <span className="font-medium text-slate-700">PRN Frequency: </span>
                          <span className="text-slate-600">{med.prn_frequency}</span>
                        </div>
                      )}
                      {med.prn_reason && (
                        <div>
                          <span className="font-medium text-slate-700">PRN Reason: </span>
                          <span className="text-slate-600">{med.prn_reason}</span>
                        </div>
                      )}
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Button
                          size="sm"
                          onClick={() => handleContinueNoChanges(med)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Continue - No Changes
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleContinueWithChanges(med)}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Continue - With Changes
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDiscontinue(med)}
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

      {/* 4. Add New Medication Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Medication
        </Button>
      </div>

      {/* 5. Discontinued Medications */}
      {discontinuedMeds.length > 0 && (
        <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-white">Discontinued Medications</CardTitle>
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
              {discontinuedMeds.map((med) => (
                <Card key={med.id} className="bg-slate-100 border-slate-300 opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Pill className="w-4 h-4 text-slate-500" />
                      <h4 className="font-semibold text-slate-600 line-through">{med.medication_name}</h4>
                    </div>
                    <p className="text-sm text-slate-500">
                      {med.dosage && <span>{med.dosage}</span>}
                      {med.start_date && (
                        <>
                          {med.dosage && <span> • </span>}
                          <span>Started: {format(new Date(med.start_date), "MMM d, yyyy")}</span>
                        </>
                      )}
                      {med.end_date && (
                        <>
                          {med.start_date && <span> • </span>}
                          <span>Stopped: {format(new Date(med.end_date), "MMM d, yyyy")}</span>
                        </>
                      )}
                    </p>
                    {med.notes && med.notes.includes("Discontinued:") && (
                      <p className="text-xs text-slate-500 mt-1">
                        {med.notes.split("Discontinued:")[1]?.trim() || med.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Add Medication Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Medication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Medication Name *</Label>
              <Input
                value={newMed.medication_name}
                onChange={(e) => setNewMed({ ...newMed, medication_name: e.target.value })}
                placeholder="e.g., Ibuprofen"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Dosage</Label>
                <Input
                  value={newMed.dosage}
                  onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                  placeholder="e.g., 200mg"
                />
              </div>
              <div>
                <Label>Frequency</Label>
                <Select
                  value={newMed.frequency}
                  onValueChange={(value) => setNewMed({ ...newMed, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Once daily">Once daily</SelectItem>
                    <SelectItem value="Twice daily">Twice daily</SelectItem>
                    <SelectItem value="Three times daily">Three times daily</SelectItem>
                    <SelectItem value="Four times daily">Four times daily</SelectItem>
                    <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                    <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                    <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                    <SelectItem value="Every 12 hours">Every 12 hours</SelectItem>
                    <SelectItem value="Once weekly">Once weekly</SelectItem>
                    <SelectItem value="As needed (PRN)">As needed (PRN)</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {newMed.frequency === "As needed (PRN)" && (
              <div className="space-y-4">
                <div>
                  <Label>How often can you take this medication?</Label>
                  <Select
                    value={prnFrequency}
                    onValueChange={setPrnFrequency}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select PRN frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Every 2 hours">Every 2 hours</SelectItem>
                      <SelectItem value="Every 3 hours">Every 3 hours</SelectItem>
                      <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                      <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                      <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                      <SelectItem value="Every 12 hours">Every 12 hours</SelectItem>
                      <SelectItem value="Once daily maximum">Once daily maximum</SelectItem>
                      <SelectItem value="As directed">As directed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>What do you take this medication for?</Label>
                  <Input
                    value={prnReason}
                    onChange={(e) => setPrnReason(e.target.value)}
                    placeholder="e.g., breakthrough pain, anxiety, sleep, nausea"
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prescribing Doctor</Label>
                <Input
                  value={newMed.prescribing_doctor}
                  onChange={(e) => setNewMed({ ...newMed, prescribing_doctor: e.target.value })}
                  placeholder="e.g., Dr. Smith"
                />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newMed.start_date}
                  onChange={(e) => setNewMed({ ...newMed, start_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Reason for Taking</Label>
              <Textarea
                value={newMed.reason_for_taking}
                onChange={(e) => setNewMed({ ...newMed, reason_for_taking: e.target.value })}
                placeholder="e.g., pain management, inflammation"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pharmacy</Label>
                <Input
                  value={newMed.pharmacy}
                  onChange={(e) => setNewMed({ ...newMed, pharmacy: e.target.value })}
                  placeholder="e.g., CVS Pharmacy"
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={newMed.notes}
                onChange={(e) => setNewMed({ ...newMed, notes: e.target.value })}
                placeholder="Additional notes about this medication"
                rows={2}
              />
            </div>
            <div>
              <Label>Medication Type</Label>
              <RadioGroup
                value={newMed.injury_related ? "post-injury" : "pre-injury"}
                onValueChange={(value) => setNewMed({ ...newMed, injury_related: value === "post-injury" })}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pre-injury" id="pre-injury" />
                  <Label htmlFor="pre-injury" className="cursor-pointer">
                    Pre-Injury Medication
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="post-injury" id="post-injury" />
                  <Label htmlFor="post-injury" className="cursor-pointer">
                    Post-Injury Medication
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMedication} className="bg-amber-600 hover:bg-amber-700 text-white">
                Save Medication
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Medication Dialog */}
      <Dialog open={!!editingMed} onOpenChange={() => setEditingMed(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Medication: {editingMed?.medication_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Dosage</Label>
                <Input
                  value={editForm.dosage}
                  onChange={(e) => setEditForm({ ...editForm, dosage: e.target.value })}
                  placeholder="e.g., 200mg"
                />
              </div>
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
                    <SelectItem value="Once daily">Once daily</SelectItem>
                    <SelectItem value="Twice daily">Twice daily</SelectItem>
                    <SelectItem value="Three times daily">Three times daily</SelectItem>
                    <SelectItem value="Four times daily">Four times daily</SelectItem>
                    <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                    <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                    <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                    <SelectItem value="Every 12 hours">Every 12 hours</SelectItem>
                    <SelectItem value="Once weekly">Once weekly</SelectItem>
                    <SelectItem value="As needed (PRN)">As needed (PRN)</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Side Effects</Label>
              <Textarea
                value={editForm.side_effects}
                onChange={(e) => setEditForm({ ...editForm, side_effects: e.target.value })}
                placeholder="Any side effects you've noticed"
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
              <Button variant="outline" onClick={() => setEditingMed(null)}>
                Cancel
              </Button>
              <Button onClick={saveMedicationChanges} className="bg-amber-600 hover:bg-amber-700 text-white">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discontinue Medication Dialog */}
      <Dialog open={!!discontinuingMed} onOpenChange={() => setDiscontinuingMed(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Discontinue Medication: {discontinuingMed?.medication_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason Stopped *</Label>
              <Textarea
                value={discontinueForm.reason_stopped}
                onChange={(e) => setDiscontinueForm({ ...discontinueForm, reason_stopped: e.target.value })}
                placeholder="Why are you stopping this medication?"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date Stopped *</Label>
                <Input
                  type="date"
                  value={discontinueForm.date_stopped}
                  onChange={(e) => setDiscontinueForm({ ...discontinueForm, date_stopped: e.target.value })}
                />
              </div>
              <div>
                <Label>Who Advised Stopping</Label>
                <Input
                  value={discontinueForm.who_advised}
                  onChange={(e) => setDiscontinueForm({ ...discontinueForm, who_advised: e.target.value })}
                  placeholder="e.g., Dr. Smith, self, pharmacist"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDiscontinuingMed(null)}>
                Cancel
              </Button>
              <Button onClick={saveDiscontinue} variant="destructive">
                Discontinue Medication
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}