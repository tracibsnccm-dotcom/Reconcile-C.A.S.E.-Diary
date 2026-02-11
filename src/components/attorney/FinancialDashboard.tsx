import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, TrendingDown, Download, CreditCard, Wallet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const revenueData = [
  { month: "Jan", revenue: 45000, expenses: 12000, profit: 33000 },
  { month: "Feb", revenue: 52000, expenses: 13500, profit: 38500 },
  { month: "Mar", revenue: 48000, expenses: 14000, profit: 34000 },
  { month: "Apr", revenue: 58000, expenses: 13000, profit: 45000 },
  { month: "May", revenue: 61000, expenses: 15000, profit: 46000 },
  { month: "Jun", revenue: 55000, expenses: 14500, profit: 40500 },
];

const caseValueData = [
  { range: "$0-25k", count: 12, color: "#3b82f6" },
  { range: "$25-50k", count: 18, color: "#10b981" },
  { range: "$50-100k", count: 8, color: "#f59e0b" },
  { range: "$100k+", count: 4, color: "#8b5cf6" },
];

const receivables = [
  { client: "Johnson, M.", caseId: "C-2024-1892", amount: 4500, dueDate: "2024-07-15", status: "current" },
  { client: "Williams, R.", caseId: "C-2024-1876", amount: 8200, dueDate: "2024-07-08", status: "overdue" },
  { client: "Davis, K.", caseId: "C-2024-1845", amount: 6750, dueDate: "2024-07-20", status: "current" },
];

export function FinancialDashboard() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="receivables">Receivables</TabsTrigger>
          <TabsTrigger value="cases">Case Value</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">Monthly Revenue</div>
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold">$55,000</div>
              <div className="flex items-center gap-1 text-sm text-green-600 mt-2">
                <TrendingUp className="h-4 w-4" />
                +8.5% from last month
              </div>
            </Card>

            <Card className="p-6 border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">Net Profit</div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600">$40,500</div>
              <div className="text-sm text-muted-foreground mt-2">
                73.6% margin
              </div>
            </Card>

            <Card className="p-6 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">Outstanding AR</div>
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold">$19,450</div>
              <div className="text-sm text-muted-foreground mt-2">
                3 invoices pending
              </div>
            </Card>

            <Card className="p-6 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">Total Case Value</div>
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-3xl font-bold">$2.1M</div>
              <div className="text-sm text-muted-foreground mt-2">
                42 active cases
              </div>
            </Card>
          </div>

          {/* Revenue Trend */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Revenue & Profit Trend</h3>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
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
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Avg Case Value</div>
              <div className="text-xl font-bold">$50,000</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Collection Rate</div>
              <div className="text-xl font-bold text-green-600">94%</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">YTD Revenue</div>
              <div className="text-xl font-bold">$319,000</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">YTD Profit</div>
              <div className="text-xl font-bold text-green-600">$237,000</div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="receivables" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Accounts Receivable</h3>
                <p className="text-sm text-muted-foreground">Track outstanding invoices</p>
              </div>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Export AR Report
              </Button>
            </div>

            <div className="space-y-3">
              {receivables.map((item, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{item.client}</div>
                      <div className="text-sm text-muted-foreground">Case: {item.caseId}</div>
                      <div className="text-sm mt-1">Due: {item.dueDate}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">${item.amount.toLocaleString()}</div>
                      <Badge
                        variant="secondary"
                        className={
                          item.status === "current"
                            ? "bg-green-500/10 text-green-700 border-green-500/20"
                            : "bg-red-500/10 text-red-700 border-red-500/20"
                        }
                      >
                        {item.status === "current" ? "Current" : "Overdue"}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <Card className="p-4 bg-green-500/5 border-green-500/20">
                <div className="text-sm text-muted-foreground">Current (0-30 days)</div>
                <div className="text-2xl font-bold text-green-600">$11,250</div>
              </Card>
              <Card className="p-4 bg-yellow-500/5 border-yellow-500/20">
                <div className="text-sm text-muted-foreground">30-60 days</div>
                <div className="text-2xl font-bold text-yellow-600">$8,200</div>
              </Card>
              <Card className="p-4 bg-red-500/5 border-red-500/20">
                <div className="text-sm text-muted-foreground">60+ days</div>
                <div className="text-2xl font-bold text-red-600">$0</div>
              </Card>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="cases" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Case Value Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={caseValueData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, count }) => `${range}: ${count} cases`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {caseValueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {caseValueData.map((item, idx) => (
                <Card key={idx} className="p-4">
                  <div className="text-sm text-muted-foreground">{item.range}</div>
                  <div className="text-2xl font-bold">{item.count}</div>
                  <div className="text-xs text-muted-foreground mt-1">cases</div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Monthly Expenses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
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
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Office & Rent</div>
                <div className="text-xl font-bold">$5,500</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Staff Salaries</div>
                <div className="text-xl font-bold">$6,800</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Technology</div>
                <div className="text-xl font-bold">$1,200</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Marketing</div>
                <div className="text-xl font-bold">$1,000</div>
              </Card>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
