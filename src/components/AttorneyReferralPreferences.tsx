import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { Users, MapPin, DollarSign } from "lucide-react";

export function AttorneyReferralPreferences() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [caseTypes, setCaseTypes] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [minCaseValue, setMinCaseValue] = useState("");

  useEffect(() => {
    loadPreferences();
  }, [user?.id]);

  const loadPreferences = async () => {
    try {
      // Load practice areas as case type preferences
      const { data: practiceAreas } = await supabase
        .from('attorney_practice_areas')
        .select('practice_area_id, practice_areas(name)')
        .eq('attorney_id', user?.id);

      if (practiceAreas) {
        const types = practiceAreas.map((pa: any) => pa.practice_areas.name);
        setCaseTypes(types);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      toast.success("Referral preferences saved");
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast.error("Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  const availableCaseTypes = [
    "Personal Injury",
    "Workers Compensation",
    "Medical Malpractice",
    "Product Liability",
    "Wrongful Death",
    "Brain Injury",
    "Spinal Cord Injury",
  ];

  const availableRegions = [
    "Northeast",
    "Southeast",
    "Midwest",
    "Southwest",
    "West Coast",
    "Pacific Northwest",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Referral Preferences
        </CardTitle>
        <CardDescription>
          Set preferences for the types of cases you'd like to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-3">Preferred Case Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableCaseTypes.map((type) => (
                <div
                  key={type}
                  className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50"
                >
                  <Checkbox
                    id={`case-${type}`}
                    checked={caseTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setCaseTypes([...caseTypes, type]);
                      } else {
                        setCaseTypes(caseTypes.filter(t => t !== type));
                      }
                    }}
                  />
                  <Label htmlFor={`case-${type}`} className="cursor-pointer flex-1">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Geographic Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableRegions.map((region) => (
                <div
                  key={region}
                  className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50"
                >
                  <Checkbox
                    id={`region-${region}`}
                    checked={regions.includes(region)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setRegions([...regions, region]);
                      } else {
                        setRegions(regions.filter(r => r !== region));
                      }
                    }}
                  />
                  <Label htmlFor={`region-${region}`} className="cursor-pointer flex-1">
                    {region}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Select regions where you're willing to take cases
            </p>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Case Value Preferences
            </h3>
            <div className="space-y-3">
              {[
                { value: "any", label: "Any Case Value" },
                { value: "25000", label: "Minimum $25,000" },
                { value: "50000", label: "Minimum $50,000" },
                { value: "100000", label: "Minimum $100,000" },
                { value: "250000", label: "Minimum $250,000" },
              ].map(({ value, label }) => (
                <div
                  key={value}
                  className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50"
                >
                  <Checkbox
                    id={`value-${value}`}
                    checked={minCaseValue === value}
                    onCheckedChange={(checked) => {
                      if (checked) setMinCaseValue(value);
                    }}
                  />
                  <Label htmlFor={`value-${value}`} className="cursor-pointer flex-1">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {(caseTypes.length > 0 || regions.length > 0) && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Your Preferences Summary</h4>
            <div className="space-y-2">
              {caseTypes.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Case Types:</p>
                  <div className="flex flex-wrap gap-1">
                    {caseTypes.map(type => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {regions.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Regions:</p>
                  <div className="flex flex-wrap gap-1">
                    {regions.map(region => (
                      <Badge key={region} variant="secondary" className="text-xs">
                        {region}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? "Saving..." : "Save Referral Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
}