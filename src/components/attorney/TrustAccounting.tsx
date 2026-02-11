import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, AlertTriangle, CheckCircle, Download, Shield, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const trustBalanceData = [
  { month: "Jan", balance: 245000, deposits: 85000, withdrawals: 42000 },
  { month: "Feb", balance: 288000, deposits: 52000, withdrawals: 9000 },
  { month: "Mar", balance: 331000, deposits: 68000, withdrawals: 25000 },
  { month: "Apr", balance: 374000, deposits: 95000, withdrawals: 52000 },
  { month: "May", balance: 417000, deposits: 78000, withdrawals: 35000 },
  { month: "Jun", balance: 460000, deposits: 92000, withdrawals: 49000 },
];

const clientLedgers = [
  { client: "Johnson, M.", caseId: "C-2024-1892", balance: 125000, lastActivity: "2024-06-25", status: "active" },
  { client: "Williams, R.", caseId: "C-2024-1876", balance: 85000, lastActivity: "2024-06-20", status: "active" },
  { client: "Davis, K.", caseId: "C-2024-1845", balance: 45000, lastActivity: "2024-06-15", status: "pending-disbursement" },
  { client: "Martinez, J.", caseId: "C-2024-1823", balance: 205000, lastActivity: "2024-06-26", status: "active" },
];

export function TrustAccounting() {
  const [selectedTab, setSelectedTab] = useState("overview");

  const totalTrustBalance = clientLedgers.reduce((sum, ledger) => sum + ledger.balance, 0);
  const activeClients = clientLedgers.filter(l => l.status === "active").length;
  const pendingDisbursements = clientLedgers.filter(l => l.status === "pending-disbursement").length;

  return (
    <div className="space-y-6">
      {/* Header Alert */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
        <div className="flex items-start gap-3">
          <Shield className="h-6 w-6 text-primary mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Trust Account & IOLTA Management</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Bar-compliant trust accounting with automatic three-way reconciliation
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 border-green-500/50 bg-green-500/5">
                <div className="text-sm text-muted-foreground mb-1">Total Trust Balance</div>
                <div className="text-2xl font-bold text-green-600">
                  ${totalTrustBalance.toLocaleString()}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Active Client Ledgers</div>
                <div className="text-2xl font-bold">{activeClients}</div>
              </Card>
              <Card className="p-4 border-yellow-500/50 bg-yellow-500/5">
                <div className="text-sm text-muted-foreground mb-1">Pending Disbursements</div>
                <div className="text-2xl font-bold text-yellow-600">{pendingDisbursements}</div>
              </Card>
              <Card className="p-4 border-green-500/50 bg-green-500/5">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Compliance Status</span>
                </div>
                <div className="text-lg font-bold text-green-600">In Compliance</div>
              </Card>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ledgers">Client Ledgers</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6">
            <h4 className="font-semibold mb-4">Trust Account Balance Trend</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trustBalanceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2} name="Balance" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Monthly Activity</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={trustBalanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="deposits" fill="#10b981" name="Deposits" />
                  <Bar dataKey="withdrawals" fill="#ef4444" name="Withdrawals" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-4">Quick Stats</h4>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">This Month Deposits</div>
                  <div className="text-2xl font-bold text-green-600">$92,000</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">This Month Withdrawals</div>
                  <div className="text-2xl font-bold text-red-600">$49,000</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Net Change</div>
                  <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    $43,000
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ledgers" className="space-y-4">
          {clientLedgers.map((ledger, idx) => (
            <Card key={idx} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{ledger.client}</h4>
                    <Badge variant="secondary">{ledger.caseId}</Badge>
                    {ledger.status === "active" && (
                      <Badge className="bg-green-600">Active</Badge>
                    )}
                    {ledger.status === "pending-disbursement" && (
                      <Badge className="bg-yellow-600">Pending Disbursement</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last Activity: {ledger.lastActivity}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-1">Trust Balance</div>
                  <div className="text-3xl font-bold text-green-600">
                    ${ledger.balance.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline">View Ledger</Button>
                <Button size="sm" variant="outline">Transaction History</Button>
                {ledger.status === "pending-disbursement" && (
                  <Button size="sm">Process Disbursement</Button>
                )}
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-4">
          <Card className="p-6 bg-gradient-to-r from-green-500/10 to-transparent border-green-500/20">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h4 className="font-semibold">Three-Way Reconciliation Status</h4>
                <p className="text-sm text-muted-foreground">Last reconciled: June 26, 2024</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Bank Balance</div>
                <div className="text-xl font-bold">$460,000</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Client Ledgers Total</div>
                <div className="text-xl font-bold">$460,000</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Difference</div>
                <div className="text-xl font-bold text-green-600">$0</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="font-semibold mb-4">Reconciliation Checklist</h4>
            <div className="space-y-3">
              {[
                { task: "Bank statement imported", status: "complete" },
                { task: "All transactions categorized", status: "complete" },
                { task: "Client ledgers balanced", status: "complete" },
                { task: "Interest calculations verified", status: "complete" },
                { task: "Three-way reconciliation complete", status: "complete" },
                { task: "Report generated and saved", status: "complete" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>{item.task}</span>
                  </div>
                  <Badge className="bg-green-600">Complete</Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="font-semibold">Trust Account Reports</h4>
                <p className="text-sm text-muted-foreground">Generate compliance reports for bar requirements</p>
              </div>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Export All
              </Button>
            </div>

            <div className="space-y-3">
              {[
                { name: "Monthly Trust Account Report", date: "June 2024", type: "Monthly" },
                { name: "Client Ledger Summary", date: "Q2 2024", type: "Quarterly" },
                { name: "Three-Way Reconciliation Report", date: "June 2024", type: "Monthly" },
                { name: "Interest Calculation Report", date: "June 2024", type: "Monthly" },
                { name: "Bar Compliance Report", date: "Q2 2024", type: "Quarterly" },
              ].map((report, idx) => (
                <Card key={idx} className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{report.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {report.date} • {report.type}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card className="p-6 border-green-500/50 bg-green-500/5">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
              <div>
                <h4 className="font-semibold mb-2">Compliance Status: Excellent</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  All trust accounting requirements met. No compliance issues detected.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Monthly Reconciliation</div>
                    <div className="flex items-center gap-1 font-medium text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Current
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Client Notice Letters</div>
                    <div className="flex items-center gap-1 font-medium text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Sent
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Interest Calculations</div>
                    <div className="flex items-center gap-1 font-medium text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Accurate
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Bar Reporting</div>
                    <div className="flex items-center gap-1 font-medium text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Filed
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="font-semibold mb-4">Trust Account Rules Compliance</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Separate IOLTA account maintained</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Individual client ledgers for each matter</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Monthly three-way reconciliation performed</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Client notifications sent for deposits/withdrawals</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>No commingling of personal and client funds</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Records retained per bar requirements (5 years)</span>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="p-6 bg-muted/30">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-2">Trust Accounting Protection</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Automatic three-way reconciliation prevents errors</li>
              <li>• Audit trail for every transaction</li>
              <li>• Bar-compliant reports generated automatically</li>
              <li>• Client notification system built-in</li>
              <li>• Interest calculations per IOLTA rules</li>
              <li>• Malpractice protection through proper record-keeping</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
