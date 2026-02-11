import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { Scale, Plus } from "lucide-react";

interface PracticeArea {
  id: string;
  name: string;
  description: string;
}

export function AttorneyPracticeAreas() {
  const { user } = useAuth();
  const [allAreas, setAllAreas] = useState<PracticeArea[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPracticeAreas();
    loadSelectedAreas();
  }, [user?.id]);

  const loadPracticeAreas = async () => {
    try {
      const { data, error } = await supabase
        .from('practice_areas')
        .select('*')
        .order('name');

      if (error) throw error;
      setAllAreas(data || []);
    } catch (error: any) {
      console.error('Error loading practice areas:', error);
      toast.error("Failed to load practice areas");
    }
  };

  const loadSelectedAreas = async () => {
    try {
      const { data, error } = await supabase
        .from('attorney_practice_areas')
        .select('practice_area_id')
        .eq('attorney_id', user?.id);

      if (error) throw error;
      setSelectedAreas(data?.map(item => item.practice_area_id) || []);
    } catch (error: any) {
      console.error('Error loading selected areas:', error);
    }
  };

  const handleToggleArea = async (areaId: string, checked: boolean) => {
    try {
      if (checked) {
        const { error } = await supabase
          .from('attorney_practice_areas')
          .insert({
            attorney_id: user?.id,
            practice_area_id: areaId,
          });

        if (error) throw error;
        setSelectedAreas([...selectedAreas, areaId]);
        toast.success("Practice area added");
      } else {
        const { error } = await supabase
          .from('attorney_practice_areas')
          .delete()
          .eq('attorney_id', user?.id)
          .eq('practice_area_id', areaId);

        if (error) throw error;
        setSelectedAreas(selectedAreas.filter(id => id !== areaId));
        toast.success("Practice area removed");
      }
    } catch (error: any) {
      console.error('Error toggling practice area:', error);
      toast.error(error.message || "Failed to update practice area");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          Practice Area Specializations
        </CardTitle>
        <CardDescription>
          Select the areas of law you specialize in
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {allAreas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading practice areas...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allAreas.map((area) => (
                <div
                  key={area.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={area.id}
                    checked={selectedAreas.includes(area.id)}
                    onCheckedChange={(checked) =>
                      handleToggleArea(area.id, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={area.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {area.name}
                    </label>
                    {area.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {area.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedAreas.length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">
                Selected Specializations ({selectedAreas.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {allAreas
                  .filter(area => selectedAreas.includes(area.id))
                  .map(area => (
                    <Badge key={area.id} variant="secondary">
                      {area.name}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}