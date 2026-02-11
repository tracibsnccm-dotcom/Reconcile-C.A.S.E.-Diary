import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, FileText, AlertTriangle, CheckCircle, TrendingDown, Building2, Clock } from "lucide-react";

interface Lien {
  id: string;
  provider: string;
  type: "medicare" | "medicaid" | "hospital" | "insurance" | "erisa";
  amount: number;
  status: "active" | "negotiating" | "resolved";
  dateAsserted: string;
  reductionAmount?: number;
  finalAmount?: number;
}

const mockLiens: Lien[] = [
  {
    id: "L-001",
    provider: "Medicare",
    type: "medicare",
    amount: 45000,
    status: "active",
    dateAsserted: "2024-01-15",
  },
  {
    id: "L-002",
    provider: "St. Mary's Hospital",
    type: "hospital",
    amount: 125000,
    status: "negotiating",
    dateAsserted: "2024-02-20",
    reductionAmount: 40000,
  },
  {
    id: "L-003",
    provider: "Blue Cross Insurance",
    type: "insurance",
    amount: 18500,
    status: "resolved",
    dateAsserted: "2024-01-10",
    reductionAmount: 6500,
    finalAmount: 12000,
  },
];

export function MedicalLienManagement() {
  const [liens, setLiens] = useState<Lien[]>(mockLiens);
  const [selectedCase, setSelectedCase] = useState("C-2024-1892");

  const totalLiens = liens.reduce((sum, lien) => sum + lien.amount, 0);
  const totalReductions = liens.reduce((sum, lien) => sum + (lien.reductionAmount || 0), 0);
  const activeLiens = liens.filter(l => l.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
        <div className="flex items-start gap-3">
          <DollarSign className="h-6 w-6 text-primary mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Medical Lien Management</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Track and negotiate medical liens to maximize client recovery
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Total Liens</div>
                <div className="text-2xl font-bold">${totalLiens.toLocaleString()}</div>
              </Card>
              <Card className="p-4 border-green-500/20 bg-green-500/5">
                <div className="text-sm text-muted-foreground mb-1">Reductions Secured</div>
                <div className="text-2xl font-bold text-green-600">
                  ${totalReductions.toLocaleString()}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Active Liens</div>
                <div className="text-2xl font-bold">{activeLiens}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Reduction Rate</div>
                <div className="text-2xl font-bold text-green-600">
                  {totalLiens > 0 ? Math.round((totalReductions / totalLiens) * 100) : 0}%
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Liens</TabsTrigger>
          <TabsTrigger value="negotiating">In Negotiation</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        {["active", "negotiating", "resolved"].map(status => (
          <TabsContent key={status} value={status} className="space-y-4">
            {liens.filter(l => l.status === status).map((lien, idx) => (
              <Card key={idx} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold mb-1">{lien.provider}</h4>
                      <div className="flex gap-2">
                        <Badge variant="secondary">
                          {lien.type.charAt(0).toUpperCase() + lien.type.slice(1)}
                        </Badge>
                        <Badge variant="secondary">ID: {lien.id}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Asserted: {lien.dateAsserted}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {lien.status === "active" && (
                      <Badge className="mb-2">Active</Badge>
                    )}
                    {lien.status === "negotiating" && (
                      <Badge className="mb-2 bg-yellow-500">Negotiating</Badge>
                    )}
                    {lien.status === "resolved" && (
                      <Badge className="mb-2 bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Resolved
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Original Amount</div>
                    <div className="text-lg font-bold">${lien.amount.toLocaleString()}</div>
                  </div>
                  {lien.reductionAmount && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Reduction</div>
                      <div className="text-lg font-bold text-green-600 flex items-center gap-1">
                        <TrendingDown className="h-4 w-4" />
                        ${lien.reductionAmount.toLocaleString()}
                      </div>
                    </div>
                  )}
                  {lien.finalAmount && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Final Amount</div>
                      <div className="text-lg font-bold">${lien.finalAmount.toLocaleString()}</div>
                    </div>
                  )}
                  {lien.reductionAmount && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Savings Rate</div>
                      <div className="text-lg font-bold text-green-600">
                        {Math.round((lien.reductionAmount / lien.amount) * 100)}%
                      </div>
                    </div>
                  )}
                </div>

                {lien.type === "medicare" && lien.status === "active" && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <span className="font-semibold">Medicare MSP Compliance Required:</span>
                        <span className="text-muted-foreground"> Must report settlement amount and resolve lien before distribution</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {lien.status === "active" && (
                    <>
                      <Button size="sm" variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        Request Itemization
                      </Button>
                      <Button size="sm">
                        Begin Negotiation
                      </Button>
                    </>
                  )}
                  {lien.status === "negotiating" && (
                    <>
                      <Button size="sm" variant="outline">
                        Update Offer
                      </Button>
                      <Button size="sm">
                        Submit Counter
                      </Button>
                    </>
                  )}
                  {lien.status === "resolved" && (
                    <Button size="sm" variant="outline">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      View Final Agreement
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>

      {/* Lien Resolution Checklist */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Pre-Settlement Lien Checklist</h4>
        <div className="space-y-3">
          {[
            { task: "Identify all lien holders", status: "complete" },
            { task: "Request itemized billing", status: "complete" },
            { task: "Review for overcharges & duplicates", status: "complete" },
            { task: "Submit negotiation letters", status: "in-progress" },
            { task: "Obtain final lien amounts", status: "pending" },
            { task: "Get lien satisfaction agreements", status: "pending" },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {item.status === "complete" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : item.status === "in-progress" ? (
                  <Clock className="h-5 w-5 text-yellow-600" />
                ) : (
                  <div className="h-5 w-5 border-2 border-muted-foreground rounded-full" />
                )}
                <span className={item.status === "complete" ? "text-muted-foreground" : ""}>
                  {item.task}
                </span>
              </div>
              <Badge variant="secondary">
                {item.status === "complete" ? "Done" : 
                 item.status === "in-progress" ? "In Progress" : "Pending"}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Info */}
      <Card className="p-6 bg-muted/30">
        <div className="flex items-start gap-3">
          <DollarSign className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-2">Lien Management Best Practices</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Identify all lien holders early in the case</li>
              <li>• Always request itemized billing to identify overcharges</li>
              <li>• Medicare/Medicaid liens require specific federal procedures</li>
              <li>• Hospital liens must be filed within statutory timeframes</li>
              <li>• Average lien reduction: 30-40% through proper negotiation</li>
              <li>• Get signed satisfaction agreements before settlement distribution</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
