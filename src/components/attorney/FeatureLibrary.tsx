import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Lock, Sparkles } from "lucide-react";

export function FeatureLibrary() {
  // Core features always included
  const coreFeatures = [
    { name: "RN Clinical Coordination", description: "Full care coordination with RN liaison" },
    { name: "Case Management", description: "Track cases, deadlines, and documents" },
    { name: "Client Portal", description: "Secure client communication and updates" },
    { name: "AI Case Prioritization", description: "Smart prioritization based on urgency" },
    { name: "AI Document Assembly", description: "Generate legal documents instantly" },
    { name: "Basic Time Tracking", description: "Track billable hours and tasks" },
  ];

  // Premium modules we provide
  const premiumModules = [
    { 
      name: "AI Settlement Predictor",
      description: "Advanced ML predictions for case outcomes",
      price: "$99/month",
      setup: "Included"
    },
    { 
      name: "Expert Witness Management",
      description: "Database and coordination tools",
      price: "$79/month",
      setup: "Included"
    },
    { 
      name: "Financial Forecasting",
      description: "Advanced practice analytics and projections",
      price: "$129/month",
      setup: "Included"
    },
    { 
      name: "Trust Accounting Suite",
      description: "Full IOLTA compliance and management",
      price: "$149/month",
      setup: "Included"
    },
  ];

  // Integration modules - connect your existing tools
  const integrationModules = [
    { 
      name: "Court E-Filing Integration",
      description: "Connect your existing e-filing accounts (FileAndServe, Tyler Technologies, etc.)",
      price: "Free",
      setup: "Bring your own account"
    },
    { 
      name: "Legal Research Integration",
      description: "Connect Westlaw, LexisNexis, or your existing research platform",
      price: "Free",
      setup: "Bring your own subscription"
    },
    { 
      name: "Practice Management Integration",
      description: "Sync with Clio, MyCase, or other practice management software",
      price: "Free",
      setup: "API connection required"
    },
    { 
      name: "Accounting Software Integration",
      description: "Connect QuickBooks, Xero, or your existing accounting system",
      price: "Free",
      setup: "OAuth connection"
    },
  ];

  return (
    <div className="space-y-8">
      {/* Core Features Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Core Features</h2>
          <Badge className="bg-green-600">Included</Badge>
        </div>
        <p className="text-muted-foreground mb-6">
          These essential features are included in your base subscription
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {coreFeatures.map((feature) => (
            <Card key={feature.name} className="p-6 border-2 border-primary/20">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{feature.name}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Premium Modules Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Premium Modules</h2>
          <Badge variant="outline">Add-Ons</Badge>
        </div>
        <p className="text-muted-foreground mb-6">
          Enhance your practice with specialized modules - pay only for what you need
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {premiumModules.map((module) => (
            <Card key={module.name} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">{module.name}</h4>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm">
                    <div className="font-semibold text-primary">{module.price}</div>
                    <div className="text-muted-foreground text-xs">Setup: {module.setup}</div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Lock className="h-3 w-3 mr-2" />
                    Add Module
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Integration Modules Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-bold">Connect Your Tools</h2>
          <Badge className="bg-blue-600">Integrations</Badge>
        </div>
        <p className="text-muted-foreground mb-6">
          Reconcile C.A.R.E. acts as your central hub - connect your existing tools and subscriptions
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {integrationModules.map((module) => (
            <Card key={module.name} className="p-6 hover:shadow-lg transition-shadow border-2 border-blue-200">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">{module.name}</h4>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm">
                    <div className="font-semibold text-blue-600">{module.price}</div>
                    <div className="text-muted-foreground text-xs">{module.setup}</div>
                  </div>
                  <Button size="sm" variant="outline">
                    Connect
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Banner */}
      <Card className="p-6 bg-muted/50">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-1" />
          <div>
            <h4 className="font-semibold mb-2">Custom Enterprise Modules</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Need something specific? We can build custom integrations and modules for your practice.
            </p>
            <Button size="sm" variant="default">Contact Sales</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
