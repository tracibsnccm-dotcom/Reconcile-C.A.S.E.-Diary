import { useState } from "react";
import { Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "@/hooks/use-toast";
import { addDays } from "date-fns";

interface MessageReminderDropdownProps {
  messageId: string;
  caseId?: string;
  hasReminder?: boolean;
}

export function MessageReminderDropdown({
  messageId,
  caseId,
  hasReminder = false,
}: MessageReminderDropdownProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customDays, setCustomDays] = useState("1");
  const { user } = useAuth();

  const setReminder = async (days: number) => {
    if (!user) return;

    try {
      const remindAt = addDays(new Date(), days);
      
      const { error } = await supabase.from("message_reminders").insert({
        user_id: user.id,
        message_id: messageId,
        case_id: caseId || null,
        remind_at: remindAt.toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Reminder set",
        description: `You'll be reminded in ${days} day${days !== 1 ? "s" : ""} if no reply`,
      });
    } catch (error) {
      console.error("Error setting reminder:", error);
      toast({
        title: "Error",
        description: "Failed to set reminder",
        variant: "destructive",
      });
    }
  };

  const handleCustomReminder = () => {
    const days = parseInt(customDays);
    if (isNaN(days) || days < 1) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid number of days",
        variant: "destructive",
      });
      return;
    }
    setReminder(days);
    setShowCustom(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={hasReminder ? "text-rcms-gold" : "text-muted-foreground"}
        >
          {hasReminder ? (
            <Check className="w-4 h-4 mr-1" />
          ) : (
            <Clock className="w-4 h-4 mr-1" />
          )}
          {hasReminder ? "Reminder Set" : "Remind me"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {!showCustom ? (
          <>
            <DropdownMenuItem onClick={() => setReminder(1)}>
              <Clock className="w-4 h-4 mr-2" />
              1 day
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setReminder(3)}>
              <Clock className="w-4 h-4 mr-2" />
              3 days
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setReminder(7)}>
              <Clock className="w-4 h-4 mr-2" />
              7 days
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowCustom(true)}>
              <Clock className="w-4 h-4 mr-2" />
              Custom...
            </DropdownMenuItem>
          </>
        ) : (
          <div className="p-2 space-y-2">
            <Label htmlFor="custom-days" className="text-xs">
              Days until reminder:
            </Label>
            <div className="flex gap-2">
              <Input
                id="custom-days"
                type="number"
                min="1"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                className="h-8"
                autoFocus
              />
              <Button size="sm" onClick={handleCustomReminder}>
                Set
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setShowCustom(false)}
            >
              Back
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}