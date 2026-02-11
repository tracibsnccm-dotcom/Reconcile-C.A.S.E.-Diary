import { Card } from "@/components/ui/card";
import { Sparkles, TrendingUp } from "lucide-react";
import { useClientCheckins } from "@/hooks/useClientCheckins";

interface MotivationWidgetProps {
  caseId: string;
}

export function MotivationWidget({ caseId }: MotivationWidgetProps) {
  const { checkins } = useClientCheckins(caseId);

  // Calculate this month's check-ins
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyCheckins = checkins.filter(
    (c) => new Date(c.created_at) >= firstDayOfMonth
  ).length;

  const messages = [
    "Every check-in helps your care team support you better!",
    "You're taking an active role in your recovery — that's powerful!",
    "Consistency is key to healing. Keep going!",
    "Your progress matters. Thank you for staying engaged!",
    "Small steps add up to big changes. Well done!",
  ];

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  return (
    <Card className="p-6 bg-white border-2 border-rcms-gold shadow-xl hover:shadow-2xl transition-shadow duration-300 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-gold-teal opacity-10"></div>
      <div className="relative flex items-start gap-4">
        <div className="flex-shrink-0 w-14 h-14 rounded-full bg-rcms-gold/20 flex items-center justify-center animate-pulse">
          <Sparkles className="w-7 h-7 text-rcms-gold" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-rcms-gold" />
            You're Doing Great!
          </h3>
          <p className="text-3xl font-bold text-rcms-gold mb-1">{monthlyCheckins} check-ins</p>
          <p className="text-sm text-muted-foreground mb-3">completed this month</p>
          <p className="text-sm text-foreground italic leading-relaxed">"{randomMessage}"</p>
        </div>
      </div>
    </Card>
  );
}
