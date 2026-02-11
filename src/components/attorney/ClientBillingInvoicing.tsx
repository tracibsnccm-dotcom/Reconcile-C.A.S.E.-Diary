import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Clock, FileText, Send, Download, Eye } from "lucide-react";

interface Invoice {
  id: string;
  clientName: string;
  caseNumber: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  items: InvoiceItem[];
}

interface InvoiceItem {
  description: string;
  hours?: number;
  rate?: number;
  amount: number;
}

export function ClientBillingInvoicing() {
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: "1",
      clientName: "Sarah Johnson",
      caseNumber: "2024-PI-001",
      invoiceNumber: "INV-2024-001",
      date: "2024-10-01",
      dueDate: "2024-10-31",
      amount: 5250.00,
      status: "paid",
      items: [
        { description: "Initial consultation", hours: 2, rate: 350, amount: 700 },
        { description: "Case research and preparation", hours: 8, rate: 350, amount: 2800 },
        { description: "Court appearance", hours: 3, rate: 450, amount: 1350 },
        { description: "Filing fees", amount: 400 }
      ]
    },
    {
      id: "2",
      clientName: "Michael Chen",
      caseNumber: "2024-PI-003",
      invoiceNumber: "INV-2024-002",
      date: "2024-11-01",
      dueDate: "2024-11-30",
      amount: 3200.00,
      status: "sent",
      items: [
        { description: "Legal consultation", hours: 4, rate: 350, amount: 1400 },
        { description: "Document review", hours: 5, rate: 350, amount: 1750 },
        { description: "Administrative fees", amount: 50 }
      ]
    }
  ]);

  const [filterStatus, setFilterStatus] = useState("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500/10 text-green-500";
      case "sent": return "bg-blue-500/10 text-blue-500";
      case "overdue": return "bg-red-500/10 text-red-500";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  const filteredInvoices = filterStatus === "all" 
    ? invoices 
    : invoices.filter(i => i.status === filterStatus);

  const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((sum, inv) => sum + inv.amount, 0);
  const totalOutstanding = invoices.filter(i => i.status !== "paid").reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Client Billing & Invoicing</h2>
          <p className="text-muted-foreground">Synced with time tracking and trust accounting</p>
        </div>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Billed</span>
          </div>
          <div className="text-2xl font-bold">${totalBilled.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">Collected</span>
          </div>
          <div className="text-2xl font-bold text-green-500">
            ${totalPaid.toLocaleString()}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-muted-foreground">Outstanding</span>
          </div>
          <div className="text-2xl font-bold text-yellow-500">
            ${totalOutstanding.toLocaleString()}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Invoices</span>
          </div>
          <div className="text-2xl font-bold">{invoices.length}</div>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input placeholder="Search invoices..." />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredInvoices.map((invoice) => (
          <Card key={invoice.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{invoice.invoiceNumber}</h3>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {invoice.clientName} • Case {invoice.caseNumber}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">${invoice.amount.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">
                  Due: {new Date(invoice.dueDate).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <div className="space-y-2">
                {invoice.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <span>{item.description}</span>
                      {item.hours && (
                        <span className="text-muted-foreground ml-2">
                          ({item.hours}h @ ${item.rate}/hr)
                        </span>
                      )}
                    </div>
                    <span className="font-medium">${item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              {invoice.status !== "paid" && (
                <Button size="sm">
                  <Send className="h-4 w-4 mr-1" />
                  Send
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
