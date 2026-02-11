import { useEffect, useState } from "react";
import { fetchRNMetrics } from "@/lib/rnMetrics";
import type { RNMetricsData } from "@/lib/rnMetrics";

export default function RNMetricsDashboard() {
  const [metrics, setMetrics] = useState<RNMetricsData["metrics"] | null>(null);

  useEffect(() => {
    fetchRNMetrics().then((data) => setMetrics(data.metrics));
  }, []);

  if (!metrics) return <p className="text-muted-foreground text-center">Loading metrics...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <h2 className="text-3xl font-bold text-center text-primary mb-6">
        RN Case Management Dashboard
      </h2>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Object.entries(metrics.my_performance).map(([key, value]) => (
          <div
            key={key}
            className="bg-card rounded-2xl shadow-md p-4 text-center border border-border"
          >
            <p className="uppercase text-sm text-muted-foreground">{key.replace(/_/g, " ")}</p>
            <p
              className={`text-3xl font-bold ${
                value >= metrics.targets[key as keyof typeof metrics.targets]
                  ? "text-green-600"
                  : value >= metrics.targets[key as keyof typeof metrics.targets] - 5
                  ? "text-yellow-500"
                  : "text-red-600"
              }`}
            >
              {value}%
            </p>
            <p className="text-xs text-muted-foreground">Target: {metrics.targets[key as keyof typeof metrics.targets]}%</p>
          </div>
        ))}
      </div>

      {/* Team Comparison */}
      <div className="bg-muted/30 rounded-2xl shadow-sm p-5 mb-8">
        <h3 className="text-xl font-semibold text-primary mb-4">
          Team Comparison
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(metrics.team_averages).map(([key, value]) => (
            <div key={key} className="bg-card rounded-xl shadow-sm p-4 text-center border border-border">
              <p className="uppercase text-xs text-muted-foreground">
                {key.replace(/_/g, " ")}
              </p>
              <p className="text-lg font-semibold text-primary">{value}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-card rounded-2xl shadow-md p-6 border border-border">
        <h3 className="text-xl font-semibold text-primary mb-3">Alerts</h3>
        {metrics.alerts.length === 0 ? (
          <p className="text-muted-foreground">No alerts — all cases are compliant.</p>
        ) : (
          <ul className="space-y-3">
            {metrics.alerts.map((alert, idx) => (
              <li
                key={idx}
                className={`border-l-4 pl-3 ${
                  alert.priority === "high"
                    ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                    : alert.priority === "medium"
                    ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                    : "border-green-500 bg-green-50 dark:bg-green-950/20"
                } p-3 rounded-md`}
              >
                <p className="font-semibold text-foreground">{alert.type}</p>
                <p className="text-sm text-muted-foreground">
                  Case ID: {alert.case_id} — {alert.days_overdue} day(s) overdue
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
