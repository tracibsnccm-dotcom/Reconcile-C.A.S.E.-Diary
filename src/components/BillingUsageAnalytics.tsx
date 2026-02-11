import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, DollarSign, FileText, Wallet } from "lucide-react";

export function BillingUsageAnalytics() {
  const monthlySpendingData = [
    { month: "Jul", amount: 2000 },
    { month: "Aug", amount: 2500 },
    { month: "Sep", amount: 1800 },
    { month: "Oct", amount: 3200 },
    { month: "Nov", amount: 2800 },
    { month: "Dec", amount: 3500 },
  ];

  const spendingBreakdown = [
    { name: "Subscription", value: 1500, color: "#0f2a6a" },
    { name: "Referral Fees", value: 4500, color: "#b09837" },
    { name: "RN CM Services", value: 2000, color: "#27a29d" },
    { name: "Other", value: 500, color: "#94a3b8" },
  ];

  const stats = [
    {
      label: "Average Monthly Spend",
      value: "$2,633",
      icon: DollarSign,
      trend: "+12%",
      trendUp: true,
    },
    {
      label: "Total Invoices (2025)",
      value: "3",
      icon: FileText,
      trend: "YTD",
      trendUp: null,
    },
    {
      label: "eWallet Usage",
      value: "$6,500",
      icon: Wallet,
      trend: "Last 6 months",
      trendUp: null,
    },
    {
      label: "Cost Per Referral",
      value: "$1,548",
      icon: TrendingUp,
      trend: "Average",
      trendUp: null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-5 h-5 text-primary" />
                {stat.trendUp !== null && (
                  <span className={`text-xs ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
              {stat.trendUp === null && stat.trend && (
                <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Trend</CardTitle>
            <CardDescription>Your spending over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlySpendingData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending Breakdown</CardTitle>
            <CardDescription>Where your money goes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={spendingBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {spendingBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cost Optimization Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Switch to Annual Billing
              </p>
              <p className="text-sm text-muted-foreground">
                Save 10% by paying annually. Estimated savings: $600/year
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Optimize eWallet Usage
              </p>
              <p className="text-sm text-muted-foreground">
                Maintain a balance of $3,000-$5,000 to avoid frequent deposits and processing fees
              </p>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Consider Plan Optimization
              </p>
              <p className="text-sm text-muted-foreground">
                Based on your usage, you might benefit from a different tier. Contact support for a plan review.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}