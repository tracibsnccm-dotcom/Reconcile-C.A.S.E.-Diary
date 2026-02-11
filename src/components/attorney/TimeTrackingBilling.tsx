import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, DollarSign, FileText, Download, Timer } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const billableActivities = [
  { value: "consultation", label: "Client Consultation", rate: 350 },
  { value: "research", label: "Legal Research", rate: 300 },
  { value: "document_review", label: "Document Review", rate: 275 },
  { value: "court_appearance", label: "Court Appearance", rate: 400 },
  { value: "deposition", label: "Deposition", rate: 400 },
  { value: "negotiation", label: "Settlement Negotiation", rate: 375 },
  { value: "drafting", label: "Document Drafting", rate: 325 },
  { value: "correspondence", label: "Client Correspondence", rate: 250 },
  { value: "case_management", label: "Case Management", rate: 275 },
  { value: "travel", label: "Travel Time", rate: 200 },
];

const mockTimeData = [
  { month: "Jan", billable: 120, nonBillable: 20 },
  { month: "Feb", billable: 135, nonBillable: 18 },
  { month: "Mar", billable: 142, nonBillable: 15 },
  { month: "Apr", billable: 138, nonBillable: 22 },
  { month: "May", billable: 155, nonBillable: 12 },
  { month: "Jun", billable: 148, nonBillable: 16 },
];

const mockUtilizationData = [
  { name: "Billable", value: 75, color: "#10b981" },
  { name: "Non-Billable", value: 15, color: "#f59e0b" },
  { name: "Available", value: 10, color: "#6b7280" },
];

export function TimeTrackingBilling() {
  const [activity, setActivity] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");

  const selectedActivity = billableActivities.find(a => a.value === activity);
  const estimatedBilling = selectedActivity && duration 
    ? (parseFloat(duration) * selectedActivity.rate).toFixed(2)
    : "0.00";

  return (
    <div className="space-y-6">
      <Tabs defaultValue="track" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="track">Time Entry</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="track" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Timer className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Log Billable Time</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Activity Type</Label>
                <Select value={activity} onValueChange={setActivity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity" />
                  </SelectTrigger>
                  <SelectContent>
                    {billableActivities.map((act) => (
                      <SelectItem key={act.value} value={act.value}>
                        {act.label} (${act.rate}/hr)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duration (hours)</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="1.5"
                  />
                </div>
                <div>
                  <Label>Estimated Billing</Label>
                  <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {estimatedBilling}
                  </div>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of work performed"
                />
              </div>

              <Button className="w-full">
                <Clock className="mr-2 h-4 w-4" />
                Log Time Entry
              </Button>
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Today</div>
              <div className="text-2xl font-bold">6.5 hrs</div>
              <div className="text-sm text-green-600">$2,275 billed</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">This Week</div>
              <div className="text-2xl font-bold">38.2 hrs</div>
              <div className="text-sm text-green-600">$13,370 billed</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">This Month</div>
              <div className="text-2xl font-bold">148 hrs</div>
              <div className="text-sm text-green-600">$51,800 billed</div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Billable vs Non-Billable Hours</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockTimeData}>
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
                  <Bar dataKey="billable" fill="#10b981" name="Billable" />
                  <Bar dataKey="nonBillable" fill="#f59e0b" name="Non-Billable" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-4">Utilization Rate</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mockUtilizationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mockUtilizationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="p-6">
            <h4 className="font-semibold mb-4">Performance Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Avg. Rate</div>
                <div className="text-xl font-bold">$325/hr</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Realization Rate</div>
                <div className="text-xl font-bold text-green-600">92%</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Collection Rate</div>
                <div className="text-xl font-bold text-green-600">88%</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Utilization</div>
                <div className="text-xl font-bold text-blue-600">75%</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Billing Reports</h3>
                <p className="text-sm text-muted-foreground">
                  Generate and export billing reports
                </p>
              </div>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Export All
              </Button>
            </div>

            <div className="space-y-3">
              {[
                { name: "June 2024 - Detailed Time Report", date: "Jul 1, 2024", hours: 148, amount: "$51,800" },
                { name: "May 2024 - Detailed Time Report", date: "Jun 1, 2024", hours: 155, amount: "$54,250" },
                { name: "April 2024 - Detailed Time Report", date: "May 1, 2024", hours: 138, amount: "$48,300" },
                { name: "Q2 2024 - Quarterly Summary", date: "Jul 1, 2024", hours: 441, amount: "$154,350" },
              ].map((report, idx) => (
                <Card key={idx} className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{report.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {report.date} • {report.hours} hours
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">{report.amount}</div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
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
