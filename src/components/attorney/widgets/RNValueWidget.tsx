import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Clock, Award } from "lucide-react";

export function RNValueWidget() {
  const metrics = [
    { label: "Avg Settlement Increase", value: "+23%", icon: TrendingUp, color: "text-green-600" },
    { label: "Time to Settlement", value: "-4 mo", icon: Clock, color: "text-blue-600" },
    { label: "Case Value Improvement", value: "$45K", icon: DollarSign, color: "text-emerald-600" },
    { label: "Client Satisfaction", value: "4.8/5", icon: Award, color: "text-amber-600" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">RN Clinical Impact</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="text-center p-2 border rounded-lg">
              <metric.icon className={`h-4 w-4 mx-auto mb-1 ${metric.color}`} />
              <div className="text-lg font-bold">{metric.value}</div>
              <div className="text-xs text-muted-foreground leading-tight">{metric.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
