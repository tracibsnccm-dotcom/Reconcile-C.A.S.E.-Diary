import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Mail, Phone, Calendar, Tag, TrendingUp, DollarSign } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  caseType: string;
  estimatedValue: number;
  lastContact?: string;
  notes?: string;
}

export function MarketingLeadManagement() {
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: "1",
      name: "Jennifer Martinez",
      email: "jennifer.m@email.com",
      phone: "(555) 234-5678",
      source: "Google Ads",
      status: "qualified",
      caseType: "Personal Injury",
      estimatedValue: 50000,
      lastContact: "2024-10-28",
      notes: "Car accident, strong case, ready to sign retainer"
    },
    {
      id: "2",
      name: "Robert Thompson",
      email: "rob.t@email.com",
      phone: "(555) 345-6789",
      source: "Referral",
      status: "new",
      caseType: "Workers Comp",
      estimatedValue: 30000,
      notes: "Workplace injury, needs consultation"
    }
  ]);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSource, setFilterSource] = useState("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-500/10 text-blue-500";
      case "contacted": return "bg-purple-500/10 text-purple-500";
      case "qualified": return "bg-green-500/10 text-green-500";
      case "converted": return "bg-emerald-500/10 text-emerald-500";
      case "lost": return "bg-red-500/10 text-red-500";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  const filteredLeads = leads.filter(l =>
    (filterStatus === "all" || l.status === filterStatus) &&
    (filterSource === "all" || l.source === filterSource)
  );

  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(l => l.status === "qualified").length;
  const convertedLeads = leads.filter(l => l.status === "converted").length;
  const totalValue = leads.reduce((sum, l) => sum + l.estimatedValue, 0);
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0";

  const sources = Array.from(new Set(leads.map(l => l.source)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Marketing & Lead Management</h2>
          <p className="text-muted-foreground">Track and convert potential clients</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Lead
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Leads</span>
          </div>
          <div className="text-2xl font-bold">{totalLeads}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">Qualified</span>
          </div>
          <div className="text-2xl font-bold text-green-500">{qualifiedLeads}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-muted-foreground">Conversion Rate</span>
          </div>
          <div className="text-2xl font-bold text-blue-500">{conversionRate}%</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Pipeline Value</span>
          </div>
          <div className="text-2xl font-bold">${(totalValue / 1000).toFixed(0)}K</div>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input placeholder="Search leads..." />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {sources.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredLeads.map((lead) => (
          <Card key={lead.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{lead.name}</h3>
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">{lead.source}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.caseType}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>Est. Value: ${lead.estimatedValue.toLocaleString()}</span>
                  </div>
                </div>

                {lead.lastContact && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Calendar className="h-4 w-4" />
                    <span>Last contact: {new Date(lead.lastContact).toLocaleDateString()}</span>
                  </div>
                )}

                {lead.notes && (
                  <div className="bg-muted/50 p-3 rounded text-sm">
                    {lead.notes}
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Button>
                <Button size="sm">Convert</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
