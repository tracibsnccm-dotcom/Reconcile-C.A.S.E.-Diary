import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, Award, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ProgressHighlightsProps {
  caseId: string;
}

export function ProgressHighlights({ caseId }: ProgressHighlightsProps) {
  const [highlights, setHighlights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateHighlights();
  }, [caseId]);

  async function calculateHighlights() {
    try {
      setLoading(true);
      const user = await supabase.auth.getUser();
      const wins: string[] = [];

      // Check check-ins count
      const { data: checkins, error: checkinsError } = await supabase
        .from("client_checkins")
        .select("id, pain_scale, created_at")
        .eq("client_id", user.data.user?.id)
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (!checkinsError && checkins) {
        if (checkins.length >= 5) {
          wins.push(`🎯 You've completed ${checkins.length} check-ins! Great consistency!`);
        }

        // Check pain improvement
        if (checkins.length >= 2) {
          const latestPain = checkins[0].pain_scale;
          const oldestPain = checkins[checkins.length - 1].pain_scale;
          const improvement = oldestPain - latestPain;
          
          if (improvement >= 2) {
            wins.push(`💪 Your pain decreased by ${improvement} points since you started!`);
          }
        }
      }

      // Check completed goals
      const { data: goals, error: goalsError } = await supabase
        .from("client_goals")
        .select("id")
        .eq("client_id", user.data.user?.id)
        .eq("case_id", caseId)
        .eq("status", "completed");

      if (!goalsError && goals && goals.length > 0) {
        wins.push(`🏆 You've completed ${goals.length} recovery goal${goals.length > 1 ? "s" : ""}!`);
      }

      // Check completed action items
      const { data: actions, error: actionsError } = await supabase
        .from("client_action_items")
        .select("id")
        .eq("client_id", user.data.user?.id)
        .eq("case_id", caseId)
        .eq("status", "completed");

      if (!actionsError && actions && actions.length >= 5) {
        wins.push(`✅ You've completed ${actions.length} action items! Keep it up!`);
      }

      setHighlights(wins.length > 0 ? wins : ["Keep up the great work! Complete check-ins to see your progress here."]);
    } catch (err: any) {
      console.error("Error calculating highlights:", err);
      setHighlights(["Keep up the great work!"]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-6 border-rcms-gold bg-white shadow-xl">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-rcms-gold bg-gradient-to-r from-green-50 to-blue-50 shadow-xl">
      <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-4">
        <Award className="w-6 h-6 text-rcms-teal" />
        Your Progress Wins
      </h2>
      <div className="space-y-3">
        {highlights.map((highlight, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200"
          >
            <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
            <p className="text-sm text-foreground">{highlight}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-sm text-muted-foreground">
        <Heart className="w-4 h-4 text-red-500" />
        <p>Every step forward is a victory. We're proud of your progress!</p>
      </div>
    </Card>
  );
}
