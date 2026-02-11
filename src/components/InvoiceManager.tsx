import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download, Eye, Filter, Search, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Invoice {
  id: string;
  date: string;
  description: string;
  type: 'subscription' | 'referral' | 'service';
  amount: number;
  tax: number;
  total: number;
  status: 'paid' | 'pending' | 'failed';
  invoiceNumber: string;
}

export function InvoiceManager() {
  const [invoices] = useState<Invoice[]>([
    {
      id: '1',
      date: '2025-01-01',
      description: 'Professional Plan - January 2025',
      type: 'subscription',
      amount: 500,
      tax: 0,
      total: 500,
      status: 'paid',
      invoiceNumber: 'INV-2025-001',
    },
    {
      id: '2',
      date: '2024-12-15',
      description: 'Case Referral Fee - Case #RC-12345',
      type: 'referral',
      amount: 1500,
      tax: 48.75,
      total: 1548.75,
      status: 'paid',
      invoiceNumber: 'INV-2024-142',
    },
    {
      id: '3',
      date: '2024-12-01',
      description: 'Professional Plan - December 2024',
      type: 'subscription',
      amount: 500,
      tax: 0,
      total: 500,
      status: 'paid',
      invoiceNumber: 'INV-2024-120',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || invoice.type === filterType;
    const matchesStatus = filterStatus === "all" || invoice.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleDownloadInvoice = (invoice: Invoice) => {
    toast.success(`Downloading ${invoice.invoiceNumber}`);
    // Future: Generate and download PDF
  };

  const handleViewInvoice = (invoice: Invoice) => {
    toast.info(`Viewing ${invoice.invoiceNumber}`);
    // Future: Open invoice detail modal
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const variants = {
      paid: 'default',
      pending: 'secondary',
      failed: 'destructive',
    };
    return <Badge variant={variants[status] as any}>{status}</Badge>;
  };

  const getTypeBadge = (type: Invoice['type']) => {
    const labels = {
      subscription: 'Subscription',
      referral: 'Referral',
      service: 'Service',
    };
    return <Badge variant="outline">{labels[type]}</Badge>;
  };

  const totalPaid = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Total Paid (All Time)</p>
            <p className="text-2xl font-bold">${totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Invoices This Year</p>
            <p className="text-2xl font-bold">{invoices.filter(i => i.date.startsWith('2025')).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Pending Payments</p>
            <p className="text-2xl font-bold">{invoices.filter(i => i.status === 'pending').length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Invoices & Receipts
          </CardTitle>
          <CardDescription>
            View and download your billing history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        {format(new Date(invoice.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {invoice.description}
                      </TableCell>
                      <TableCell>{getTypeBadge(invoice.type)}</TableCell>
                      <TableCell className="font-semibold">
                        ${invoice.total.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadInvoice(invoice)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}