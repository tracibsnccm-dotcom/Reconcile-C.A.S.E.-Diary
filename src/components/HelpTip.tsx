import { useState, useEffect } from "react";
import { HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";

interface HelpTipProps {
  tipId: string;
  title: string;
  content: string;
  learnMoreUrl?: string;
  className?: string;
}

export function HelpTip({ tipId, title, content, learnMoreUrl, className }: HelpTipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkDismissed = async () => {
      const { data } = await supabase
        .from("user_preferences")
        .select("dismissed_tips")
        .eq("user_id", user.id)
        .single();

      if (data?.dismissed_tips && Array.isArray(data.dismissed_tips)) {
        setIsDismissed(data.dismissed_tips.includes(tipId));
      }
    };

    checkDismissed();
  }, [user, tipId]);

  const handleDismiss = async () => {
    if (!user) return;

    try {
      // Get current dismissed tips
      const { data: currentPrefs } = await supabase
        .from("user_preferences")
        .select("dismissed_tips")
        .eq("user_id", user.id)
        .single();

      const dismissedTips = Array.isArray(currentPrefs?.dismissed_tips) 
        ? currentPrefs.dismissed_tips 
        : [];
      const newDismissedTips = [...dismissedTips, tipId];

      // Update with new dismissed tip
      await supabase
        .from("user_preferences")
        .upsert(
          {
            user_id: user.id,
            dismissed_tips: newDismissedTips,
          },
          { onConflict: "user_id" }
        );

      setIsDismissed(true);
      setIsOpen(false);
    } catch (error) {
      console.error("Error dismissing tip:", error);
    }
  };

  if (isDismissed) return null;

  return (
    <div className={cn("relative inline-block", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground hover:text-rcms-gold"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Help"
      >
        <HelpCircle className="w-4 h-4" />
      </Button>

      {isOpen && (
        <Card
          className={cn(
            "absolute z-50 w-80 p-4 shadow-lg border-rcms-gold/30",
            "top-8 right-0"
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-sm text-foreground">{title}</h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">{content}</p>
          
          <div className="flex gap-2">
            {learnMoreUrl && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-rcms-teal"
                onClick={() => window.open(learnMoreUrl, "_blank")}
              >
                Learn more
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-xs"
              onClick={handleDismiss}
            >
              Don't show again
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}