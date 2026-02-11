import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award } from "lucide-react";

interface TeamMetric {
  label: string;
  yourValue: number;
  teamAverage: number;
  unit: string;
}

export function RNTeamPerformance() {
  const metrics: TeamMetric[] = [
    { label: "Response Time", yourValue: 2.5, teamAverage: 3.2, unit: "hrs" },
    { label: "Care Plan Completion", yourValue: 95, teamAverage: 88, unit: "%" },
    { label: "Client Satisfaction", yourValue: 4.8, teamAverage: 4.5, unit: "/5" },
    { label: "Documentation Quality", yourValue: 92, teamAverage: 87, unit: "%" },
  ];

  const isAboveAverage = (value: number, average: number) => value > average;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Team Performance Comparison
        </CardTitle>
        <CardDescription>How you compare to team averages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics.map((metric, index) => {
          const aboveAverage = isAboveAverage(metric.yourValue, metric.teamAverage);
          const percentDiff = ((metric.yourValue - metric.teamAverage) / metric.teamAverage) * 100;
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{metric.label}</span>
                {aboveAverage && (
                  <Badge variant="secondary" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{Math.abs(percentDiff).toFixed(0)}%
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">You</p>
                  <p className={`text-lg font-bold ${aboveAverage ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {metric.yourValue}{metric.unit}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Team Avg</p>
                  <p className="text-lg font-bold text-muted-foreground">
                    {metric.teamAverage}{metric.unit}
                  </p>
                </div>
              </div>
              
              <Progress 
                value={(metric.yourValue / metric.teamAverage) * 100} 
                className="h-2"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
