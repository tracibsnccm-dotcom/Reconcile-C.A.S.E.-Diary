import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, DollarSign, TrendingDown, AlertTriangle, Search, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BillItem {
  id: string;
  provider: string;
  date: string;
  procedureCode: string;
  description: string;
  billedAmount: number;
  ucrAmount: number;
  recommendedAmount: number;
  overchargeAmount: number;
  flags: string[];
}

const mockBillItems: BillItem[] = [
  {
    id: "B-001",
    provider: "St. Mary's Hospital",
    date: "2024-01-15",
    procedureCode: "99285",
    description: "Emergency Department Visit - High Complexity",
    billedAmount: 3500,
    ucrAmount: 2200,
    recommendedAmount: 2200,
    overchargeAmount: 1300,
    flags: ["Above UCR", "High markup"],
  },
  {
    id: "B-002",
    provider: "ABC Imaging Center",
    date: "2024-01-16",
    procedureCode: "72148",
    description: "MRI Lumbar Spine w/ Contrast",
    billedAmount: 4200,
    ucrAmount: 1800,
    recommendedAmount: 1800,
    overchargeAmount: 2400,
    flags: ["Above UCR", "Duplicate charge"],
  },
  {
    id: "B-003",
    provider: "Dr. Johnson - Orthopedics",
    date: "2024-01-20",
    procedureCode: "99213",
    description: "Office Visit - Established Patient",
    billedAmount: 250,
    ucrAmount: 235,
    recommendedAmount: 235,
    overchargeAmount: 15,
    flags: [],
  },
];

export function MedicalBillReview() {
  const [bills, setBills] = useState<BillItem[]>(mockBillItems);
  const [searchQuery, setSearchQuery] = useState("");

  const totalBilled = bills.reduce((sum, bill) => sum + bill.billedAmount, 0);
  const totalRecommended = bills.reduce((sum, bill) => sum + bill.recommendedAmount, 0);
  const totalSavings = totalBilled - totalRecommended;
  const savingsPercent = Math.round((totalSavings / totalBilled) * 100);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="text-sm text-muted-foreground mb-1">Total Billed</div>
          <div className="text-3xl font-bold">${totalBilled.toLocaleString()}</div>
        </Card>
        <Card className="p-6 border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <div className="text-sm text-muted-foreground mb-1">Recommended</div>
          <div className="text-3xl font-bold text-green-600">
            ${totalRecommended.toLocaleString()}
          </div>
        </Card>
        <Card className="p-6 border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <div className="text-sm text-muted-foreground mb-1">Potential Savings</div>
          <div className="text-3xl font-bold text-green-600 flex items-center gap-2">
            <TrendingDown className="h-6 w-6" />
            ${totalSavings.toLocaleString()}
          </div>
        </Card>
        <Card className="p-6 border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <div className="text-sm text-muted-foreground mb-1">Reduction Rate</div>
          <div className="text-3xl font-bold text-green-600">{savingsPercent}%</div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search bills by provider, procedure, or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Bills Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Medical Bill Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive review with UCR comparisons and overcharge detection
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button size="sm">
              Generate Demand Letter
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {bills.map((bill, idx) => (
            <Card key={idx} className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{bill.provider}</span>
                    <Badge variant="secondary">{bill.procedureCode}</Badge>
                    {bill.flags.length > 0 && (
                      <Badge variant="destructive" className="animate-pulse">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Flagged
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {bill.description} • {bill.date}
                  </div>
                  {bill.flags.length > 0 && (
                    <div className="flex gap-2">
                      {bill.flags.map((flag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">Billed Amount</div>
                  <div className="font-bold">${bill.billedAmount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">UCR Amount</div>
                  <div className="font-medium">${bill.ucrAmount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Recommended</div>
                  <div className="font-bold text-green-600">
                    ${bill.recommendedAmount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Overcharge</div>
                  <div className="font-bold text-red-600">
                    ${bill.overchargeAmount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Reduction</div>
                  <div className="font-bold text-green-600">
                    {Math.round((bill.overchargeAmount / bill.billedAmount) * 100)}%
                  </div>
                </div>
              </div>

              {bill.overchargeAmount > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-muted-foreground mb-1">
                    Overcharge Amount: ${bill.overchargeAmount.toLocaleString()}
                  </div>
                  <Progress 
                    value={(bill.overchargeAmount / bill.billedAmount) * 100} 
                    className="h-2"
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      </Card>

      {/* Analysis Summary */}
      <Card className="p-6 bg-gradient-to-r from-green-500/10 to-transparent border-green-500/20">
        <h4 className="font-semibold mb-3">Bill Review Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Bills Reviewed</div>
            <div className="text-2xl font-bold">{bills.length}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Flagged Items</div>
            <div className="text-2xl font-bold text-red-600">
              {bills.filter(b => b.flags.length > 0).length}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Client Savings</div>
            <div className="text-2xl font-bold text-green-600">
              ${totalSavings.toLocaleString()}
            </div>
          </div>
        </div>
      </Card>

      {/* Info */}
      <Card className="p-6 bg-muted/30">
        <div className="flex items-start gap-3">
          <DollarSign className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-2">Medical Bill Review Process</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Compare billed amounts to Usual, Customary & Reasonable (UCR) rates</li>
              <li>• Identify duplicate charges and upcoding</li>
              <li>• Flag unbundled procedures that should be combined</li>
              <li>• Check for services not medically necessary</li>
              <li>• Review for proper coding and documentation</li>
              <li>• Generate reduction demand letters with supporting documentation</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
