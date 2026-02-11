import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Shield, CheckCircle, Clock, FileCheck, AlertCircle } from "lucide-react";

const complianceItems = [
  { category: "Client Trust Account", status: "compliant", lastCheck: "2024-06-25", nextReview: "2024-07-25" },
  { category: "Malpractice Insurance", status: "compliant", lastCheck: "2024-01-01", nextReview: "2025-01-01" },
  { category: "CLE Requirements", status: "warning", lastCheck: "2024-06-01", nextReview: "2024-12-31" },
  { category: "Conflict Checks", status: "compliant", lastCheck: "2024-06-26", nextReview: "2024-06-27" },
  { category: "File Retention", status: "compliant", lastCheck: "2024-06-20", nextReview: "2024-07-20" },
];

const riskAssessments = [
  {
    caseId: "C-2024-1892",
    client: "Johnson, M.",
    riskLevel: "low",
    factors: ["Clear liability", "Strong evidence", "Cooperative client"],
    lastReview: "2024-06-20",
  },
  {
    caseId: "C-2024-1876",
    client: "Williams, R.",
    riskLevel: "medium",
    factors: ["Statute of limitations approaching", "Missing documentation"],
    lastReview: "2024-06-18",
  },
  {
    caseId: "C-2024-1845",
    client: "Davis, K.",
    riskLevel: "high",
    factors: ["Unresponsive client", "Trial date approaching", "Incomplete discovery"],
    lastReview: "2024-06-15",
  },
];

const cleProgress = {
  required: 15,
  completed: 9,
  inProgress: 2,
  deadline: "Dec 31, 2024",
};

export function ComplianceRiskManagement() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="compliance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
        </TabsList>

        <TabsContent value="compliance" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Compliance Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor and maintain regulatory compliance
                </p>
              </div>
              <Button>
                <FileCheck className="mr-2 h-4 w-4" />
                Run Compliance Check
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4 border-green-500/20 bg-green-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Compliant</span>
                </div>
                <div className="text-3xl font-bold">4</div>
              </Card>
              <Card className="p-4 border-yellow-500/20 bg-yellow-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="font-semibold">Attention Needed</span>
                </div>
                <div className="text-3xl font-bold">1</div>
              </Card>
              <Card className="p-4 border-red-500/20 bg-red-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold">Non-Compliant</span>
                </div>
                <div className="text-3xl font-bold">0</div>
              </Card>
            </div>

            <div className="space-y-3">
              {complianceItems.map((item, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {item.status === "compliant" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      )}
                      <div>
                        <div className="font-medium">{item.category}</div>
                        <div className="text-sm text-muted-foreground">
                          Last checked: {item.lastCheck}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={item.status === "compliant" ? "default" : "secondary"}
                        className={item.status === "compliant" ? "bg-green-600" : "bg-yellow-600"}
                      >
                        {item.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        Next: {item.nextReview}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {/* CLE Tracker */}
          <Card className="p-6">
            <h4 className="font-semibold mb-4">Continuing Legal Education (CLE)</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress to Annual Requirement</span>
                  <span className="font-semibold">
                    {cleProgress.completed} of {cleProgress.required} hours
                  </span>
                </div>
                <Progress value={(cleProgress.completed / cleProgress.required) * 100} className="h-2" />
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  <Clock className="inline h-4 w-4 mr-1" />
                  {cleProgress.inProgress} courses in progress
                </div>
                <div className="text-sm">
                  Deadline: <span className="font-semibold">{cleProgress.deadline}</span>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Case Risk Assessment</h3>
                <p className="text-sm text-muted-foreground">
                  Identify and manage potential case risks
                </p>
              </div>
              <Button>
                <Shield className="mr-2 h-4 w-4" />
                Assess All Cases
              </Button>
            </div>

            <div className="space-y-3">
              {riskAssessments.map((assessment, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold">{assessment.caseId}</div>
                      <div className="text-sm text-muted-foreground">
                        {assessment.client}
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        assessment.riskLevel === "low"
                          ? "bg-green-500/10 text-green-700 border-green-500/20"
                          : assessment.riskLevel === "medium"
                          ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                          : "bg-red-500/10 text-red-700 border-red-500/20"
                      }
                    >
                      {assessment.riskLevel.toUpperCase()} RISK
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Risk Factors:</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {assessment.factors.map((factor, i) => (
                        <li key={i}>• {factor}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-xs text-muted-foreground mt-3">
                    Last reviewed: {assessment.lastReview}
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Audit History</h3>
            <div className="space-y-3">
              {[
                { type: "Trust Account Audit", date: "2024-03-15", result: "Pass", auditor: "State Bar" },
                { type: "File Review", date: "2024-02-01", result: "Pass", auditor: "Internal" },
                { type: "Compliance Audit", date: "2023-12-10", result: "Pass", auditor: "State Bar" },
              ].map((audit, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{audit.type}</div>
                      <div className="text-sm text-muted-foreground">
                        {audit.auditor} • {audit.date}
                      </div>
                    </div>
                    <Badge className="bg-green-600">{audit.result}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
