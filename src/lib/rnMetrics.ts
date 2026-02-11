// Mock RN Metrics Data
export interface RNMetricsData {
  ok: boolean;
  timestamp: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
  metrics: {
    period: string;
    targets: {
      notes_24h: number;
      followup_calls: number;
      med_reconciliation: number;
      care_plans_current: number;
    };
    my_performance: {
      notes_24h: number;
      followup_calls: number;
      med_reconciliation: number;
      care_plans_current: number;
    };
    team_averages: {
      notes_24h: number;
      followup_calls: number;
      med_reconciliation: number;
      care_plans_current: number;
    };
    trend: {
      week_change: {
        notes_24h: string;
        followup_calls: string;
        med_reconciliation: string;
        care_plans_current: string;
      };
      month_change: {
        notes_24h: string;
        followup_calls: string;
        med_reconciliation: string;
        care_plans_current: string;
      };
    };
    alerts: Array<{
      type: string;
      case_id: string;
      days_overdue: number;
      priority: "high" | "medium" | "low";
    }>;
  };
}

const mockRNMetrics: RNMetricsData = {
  ok: true,
  timestamp: "2025-10-26T09:00:00Z",
  user: {
    id: "rn_123",
    name: "Jane Doe",
    role: "RN_CCM"
  },
  metrics: {
    period: "Week 43, 2025",
    targets: {
      notes_24h: 95,
      followup_calls: 92,
      med_reconciliation: 90,
      care_plans_current: 92
    },
    my_performance: {
      notes_24h: 93,
      followup_calls: 88,
      med_reconciliation: 90,
      care_plans_current: 91
    },
    team_averages: {
      notes_24h: 94,
      followup_calls: 90,
      med_reconciliation: 89,
      care_plans_current: 90
    },
    trend: {
      week_change: {
        notes_24h: "+2%",
        followup_calls: "-1%",
        med_reconciliation: "0%",
        care_plans_current: "+1%"
      },
      month_change: {
        notes_24h: "+4%",
        followup_calls: "+3%",
        med_reconciliation: "+2%",
        care_plans_current: "+3%"
      }
    },
    alerts: [
      {
        type: "Late Note",
        case_id: "RC-2410-0067",
        days_overdue: 2,
        priority: "high"
      },
      {
        type: "Follow-Up Missing",
        case_id: "RC-2410-0054",
        days_overdue: 1,
        priority: "medium"
      }
    ]
  }
};

// Fetch RN metrics (mock implementation, can be replaced with real API)
export async function fetchRNMetrics(): Promise<RNMetricsData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // TODO: Replace with actual API call
  // const res = await fetch("/api/rn-metrics");
  // return await res.json();
  
  return mockRNMetrics;
}
