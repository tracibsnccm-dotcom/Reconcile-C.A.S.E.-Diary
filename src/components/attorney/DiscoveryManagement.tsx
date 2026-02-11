import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload, Download, Search, AlertCircle, CheckCircle, Clock } from "lucide-react";

const discoveryItems = [
  {
    type: "Interrogatories",
    from: "Plaintiff",
    to: "Defendant",
    dueDate: "2024-07-15",
    status: "pending-response",
    daysLeft: 19,
  },
  {
    type: "Request for Production",
    from: "Defendant",
    to: "Plaintiff",
    dueDate: "2024-07-08",
    status: "responded",
    daysLeft: null,
  },
  {
    type: "Request for Admissions",
    from: "Plaintiff",
    to: "Defendant",
    dueDate: "2024-07-20",
    status: "draft",
    daysLeft: 24,
  },
  {
    type: "Deposition Notice",
    from: "Plaintiff",
    to: "Expert Witness",
    dueDate: "2024-07-12",
    status: "scheduled",
    daysLeft: 16,
  },
];

const documents = [
  { name: "Medical Records - Hospital A.pdf", category: "Medical", pages: 45, uploaded: "2024-06-10" },
  { name: "Employment Records.pdf", category: "Employment", pages: 12, uploaded: "2024-06-12" },
  { name: "Incident Report.pdf", category: "Incident", pages: 8, uploaded: "2024-06-08" },
  { name: "Witness Statements.pdf", category: "Witness", pages: 15, uploaded: "2024-06-15" },
];

export function DiscoveryManagement() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requests">Discovery Requests</TabsTrigger>
          <TabsTrigger value="documents">Document Production</TabsTrigger>
          <TabsTrigger value="depositions">Depositions</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Discovery Requests</h3>
                <p className="text-sm text-muted-foreground">
                  Track and manage all discovery requests
                </p>
              </div>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Total Requests</div>
                <div className="text-2xl font-bold">12</div>
              </Card>
              <Card className="p-4 border-yellow-500/20 bg-yellow-500/5">
                <div className="text-sm text-muted-foreground">Pending Response</div>
                <div className="text-2xl font-bold text-yellow-600">3</div>
              </Card>
              <Card className="p-4 border-green-500/20 bg-green-500/5">
                <div className="text-sm text-muted-foreground">Completed</div>
                <div className="text-2xl font-bold text-green-600">7</div>
              </Card>
              <Card className="p-4 border-red-500/20 bg-red-500/5">
                <div className="text-sm text-muted-foreground">Overdue</div>
                <div className="text-2xl font-bold text-red-600">0</div>
              </Card>
            </div>

            <div className="space-y-3">
              {discoveryItems.map((item, idx) => (
                <Card key={idx} className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <div className="font-semibold">{item.type}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.from} → {item.to}
                        </div>
                        <div className="text-sm mt-1">
                          Due: {item.dueDate}
                          {item.daysLeft !== null && (
                            <span className="text-muted-foreground ml-2">
                              ({item.daysLeft} days remaining)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      {item.status === "responded" && (
                        <Badge className="bg-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Responded
                        </Badge>
                      )}
                      {item.status === "pending-response" && (
                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                          <Clock className="mr-1 h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                      {item.status === "draft" && (
                        <Badge variant="secondary">
                          Draft
                        </Badge>
                      )}
                      {item.status === "scheduled" && (
                        <Badge className="bg-blue-600">
                          Scheduled
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Document Production</h3>
                <p className="text-sm text-muted-foreground">
                  Organize and track produced documents
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export List
                </Button>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Documents
                </Button>
              </div>
            </div>

            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search documents..." className="pl-10" />
              </div>
            </div>

            <div className="space-y-3">
              {documents.map((doc, idx) => (
                <Card key={idx} className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {doc.pages} pages • Uploaded {doc.uploaded}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{doc.category}</Badge>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-semibold">Production Privilege Log</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    3 documents withheld on privilege grounds. Log available for review.
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="depositions" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Deposition Schedule</h3>
                <p className="text-sm text-muted-foreground">
                  Track deposition dates and preparation
                </p>
              </div>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Schedule Deposition
              </Button>
            </div>

            <div className="space-y-3">
              {[
                { name: "Dr. Sarah Johnson", role: "Treating Physician", date: "2024-07-12", time: "10:00 AM", location: "Law Office", status: "scheduled" },
                { name: "Michael Chen", role: "Accident Witness", date: "2024-07-18", time: "2:00 PM", location: "Virtual", status: "scheduled" },
                { name: "Robert Martinez", role: "Defendant", date: "2024-07-25", time: "9:00 AM", location: "Law Office", status: "pending-confirmation" },
              ].map((depo, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold">{depo.name}</div>
                      <div className="text-sm text-muted-foreground">{depo.role}</div>
                    </div>
                    <Badge
                      variant={depo.status === "scheduled" ? "default" : "secondary"}
                      className={depo.status === "scheduled" ? "bg-green-600" : ""}
                    >
                      {depo.status === "scheduled" ? "Confirmed" : "Pending"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Date & Time</div>
                      <div className="font-medium">{depo.date} at {depo.time}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Location</div>
                      <div className="font-medium">{depo.location}</div>
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
