import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Plus, Edit2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Allergy {
  id: string;
  allergen_name: string;
  reaction: string | null;
  severity: string | null;
  notes: string | null;
  reported_date: string | null;
  is_active: boolean;
  created_at: string;
}

interface ClientAllergyTrackerProps {
  caseId: string;
}

export function ClientAllergyTracker({ caseId }: ClientAllergyTrackerProps) {
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState<Allergy | null>(null);
  
  const [formData, setFormData] = useState({
    allergen_name: "",
    reaction: "",
    severity: "",
    notes: "",
    reported_date: "",
  });

  useEffect(() => {
    fetchAllergies();
  }, [caseId]);

  const fetchAllergies = async () => {
    try {
      setLoading(true);
      const user = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("client_allergies")
        .select("*")
        .eq("client_id", user.data.user?.id)
        .eq("case_id", caseId)
        .order("is_active", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAllergies(data || []);
    } catch (error: any) {
      console.error("Error fetching allergies:", error);
      toast.error("Failed to load allergies");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const user = await supabase.auth.getUser();
      
      if (editingAllergy) {
        // Update existing allergy
        const { error } = await supabase
          .from("client_allergies")
          .update({
            allergen_name: formData.allergen_name,
            reaction: formData.reaction || null,
            severity: formData.severity || null,
            notes: formData.notes || null,
            reported_date: formData.reported_date || null,
          })
          .eq("id", editingAllergy.id);

        if (error) throw error;
        toast.success("Allergy updated successfully");
      } else {
        // Create new allergy
        const { error } = await supabase
          .from("client_allergies")
          .insert({
            case_id: caseId,
            client_id: user.data.user?.id,
            allergen_name: formData.allergen_name,
            reaction: formData.reaction || null,
            severity: formData.severity || null,
            notes: formData.notes || null,
            reported_date: formData.reported_date || new Date().toISOString().split('T')[0],
            is_active: true,
          });

        if (error) throw error;
        toast.success("Allergy added successfully");
      }

      setFormData({
        allergen_name: "",
        reaction: "",
        severity: "",
        notes: "",
        reported_date: "",
      });
      setShowForm(false);
      setEditingAllergy(null);
      fetchAllergies();
    } catch (error: any) {
      console.error("Error saving allergy:", error);
      toast.error("Failed to save allergy");
    }
  };

  const handleEdit = (allergy: Allergy) => {
    setEditingAllergy(allergy);
    setFormData({
      allergen_name: allergy.allergen_name,
      reaction: allergy.reaction || "",
      severity: allergy.severity || "",
      notes: allergy.notes || "",
      reported_date: allergy.reported_date || "",
    });
    setShowForm(true);
  };

  const handleRemove = async (allergyId: string) => {
    if (!confirm("Are you sure you want to remove this allergy from your active list?")) return;

    try {
      const { error } = await supabase
        .from("client_allergies")
        .update({ is_active: false })
        .eq("id", allergyId);

      if (error) throw error;
      toast.success("Allergy removed from active list");
      fetchAllergies();
    } catch (error: any) {
      console.error("Error removing allergy:", error);
      toast.error("Failed to remove allergy");
    }
  };

  const getSeverityColor = (severity: string | null) => {
    switch (severity?.toLowerCase()) {
      case "severe":
        return "bg-red-100 text-red-800 border-red-300";
      case "moderate":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "mild":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const activeAllergies = allergies.filter(a => a.is_active);
  const inactiveAllergies = allergies.filter(a => !a.is_active);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <h3 className="text-lg font-semibold">My Allergies</h3>
        </div>
        <Button
          onClick={() => {
            setEditingAllergy(null);
            setFormData({
              allergen_name: "",
              reaction: "",
              severity: "",
              notes: "",
              reported_date: "",
            });
            setShowForm(true);
          }}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Allergy
        </Button>
      </div>

      {activeAllergies.length === 0 && inactiveAllergies.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No allergies recorded</p>
          <p className="text-sm mt-1">Click "Add Allergy" if you have any allergies to record</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Allergies */}
          {activeAllergies.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-destructive">Active Allergies</h4>
              <div className="space-y-3">
                {activeAllergies.map((allergy) => (
                  <Card key={allergy.id} className={`p-4 border-2 ${getSeverityColor(allergy.severity)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-bold text-foreground">{allergy.allergen_name}</h4>
                          {allergy.severity && (
                            <Badge variant="outline" className={getSeverityColor(allergy.severity)}>
                              {allergy.severity}
                            </Badge>
                          )}
                        </div>
                        {allergy.reaction && (
                          <p className="text-sm text-muted-foreground mb-1">
                            <strong>Reaction:</strong> {allergy.reaction}
                          </p>
                        )}
                        {allergy.reported_date && (
                          <p className="text-sm text-muted-foreground mb-1">
                            <strong>Reported:</strong> {new Date(allergy.reported_date).toLocaleDateString()}
                          </p>
                        )}
                        {allergy.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">{allergy.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(allergy)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(allergy.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Inactive Allergies */}
          {inactiveAllergies.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Past Allergies (Resolved)</h4>
              <div className="space-y-3">
                {inactiveAllergies.map((allergy) => (
                  <Card key={allergy.id} className="p-4 border-muted bg-muted/30 opacity-75">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{allergy.allergen_name}</h4>
                        {allergy.reaction && (
                          <p className="text-sm text-muted-foreground">Reaction: {allergy.reaction}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">Resolved</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAllergy ? "Edit Allergy" : "Add New Allergy"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="allergen_name">Allergen *</Label>
              <Input
                id="allergen_name"
                value={formData.allergen_name}
                onChange={(e) => setFormData({ ...formData, allergen_name: e.target.value })}
                placeholder="e.g., Penicillin, Peanuts, Latex"
                required
              />
            </div>

            <div>
              <Label htmlFor="severity">Severity</Label>
              <select
                id="severity"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select severity...</option>
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
              </select>
            </div>

            <div>
              <Label htmlFor="reaction">Reaction</Label>
              <Input
                id="reaction"
                value={formData.reaction}
                onChange={(e) => setFormData({ ...formData, reaction: e.target.value })}
                placeholder="e.g., Rash, Difficulty breathing, Swelling"
              />
            </div>

            <div>
              <Label htmlFor="reported_date">Reported Date</Label>
              <Input
                id="reported_date"
                type="date"
                value={formData.reported_date}
                onChange={(e) => setFormData({ ...formData, reported_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information about this allergy..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {editingAllergy ? "Update" : "Add"} Allergy
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingAllergy(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
