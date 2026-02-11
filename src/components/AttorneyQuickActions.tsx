import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FolderOpen, 
  Users, 
  FileText, 
  Stethoscope, 
  BarChart3,
  Wallet,
  MessageSquare,
  Calendar,
  BookOpen,
  Lock
} from "lucide-react";

export function AttorneyQuickActions() {
  const navigate = useNavigate();

  // Tier 1: Primary actions (largest) — all routes stay inside attorney portal
  const tier1Actions = [
    {
      icon: FolderOpen,
      label: "View Cases",
      description: "Browse all your cases",
      onClick: () => navigate("/attorney/cases"),
      color: "bg-primary/10 text-primary",
    },
    {
      icon: FileText,
      label: "Intakes Awaiting Review",
      description: "Review intakes awaiting your confirmation",
      onClick: () => navigate("/attorney/pending-intakes"),
      color: "bg-orange-500/10 text-orange-600",
    },
    {
      icon: Stethoscope,
      label: "RN Clinical Coordination",
      description: "Released RN care coordination (read-only)",
      onClick: () => navigate("/attorney/rn-coordination"),
      color: "bg-teal-500/10 text-teal-600",
    },
    {
      icon: FileText,
      label: "Care Plans",
      description: "View and export released care plans",
      onClick: () => navigate("/attorney/care-plans"),
      color: "bg-blue-500/10 text-blue-600",
    },
  ];

  // Tier 2: Supporting actions (medium) — all routes stay inside attorney portal
  const tier2Actions = [
    {
      icon: Calendar,
      label: "Appointments",
      description: "Read-only client appointments",
      onClick: () => navigate("/attorney/calendar"),
      color: "bg-purple-500/10 text-purple-600",
    },
    {
      icon: BookOpen,
      label: "Case Notes",
      description: "View case notes",
      onClick: () => navigate("/attorney/notes"),
      color: "bg-indigo-500/10 text-indigo-600",
    },
    {
      icon: Lock,
      label: "Private Case Notes",
      description: "Attorney-only working notes",
      onClick: () => navigate("/attorney/private-notes"),
      color: "bg-slate-600/10 text-slate-600",
    },
    {
      icon: FileText,
      label: "Documents",
      description: "Access document hub",
      onClick: () => navigate("/attorney/documents"),
      color: "bg-green-500/10 text-green-600",
    },
    {
      icon: Users,
      label: "Providers",
      description: "Manage provider network",
      onClick: () => navigate("/attorney/providers"),
      color: "bg-cyan-500/10 text-cyan-600",
    },
    {
      icon: BarChart3,
      label: "Reports",
      description: "View analytics & reports",
      onClick: () => navigate("/attorney/reports"),
      color: "bg-orange-500/10 text-orange-600",
    },
  ];

  // Tier 3: Admin actions (small) — all routes stay inside attorney portal
  const tier3Actions = [
    {
      icon: Wallet,
      label: "Billing & Subscription",
      description: "Manage payments",
      onClick: () => navigate("/attorney/billing"),
      color: "bg-[#b09837]/10 text-[#b09837]",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tier 1: Primary Actions */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Primary Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tier1Actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto flex-col items-start p-5 hover:border-primary"
                  onClick={action.onClick}
                >
                  <div className={`p-3 rounded-lg mb-3 ${action.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-base">{action.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Tier 2: Supporting Actions */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Supporting Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {tier2Actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto flex-col items-start p-4 hover:border-primary"
                  onClick={action.onClick}
                >
                  <div className={`p-2 rounded-lg mb-2 ${action.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Tier 3: Admin Actions */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Administrative</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tier3Actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto flex-col items-start p-3 hover:border-primary"
                  onClick={action.onClick}
                >
                  <div className={`p-2 rounded-lg mb-2 ${action.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
