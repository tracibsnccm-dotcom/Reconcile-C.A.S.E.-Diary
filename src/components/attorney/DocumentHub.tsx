import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, FileText, Download, Eye, Filter, Upload, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  caseId: string;
  uploadedAt: Date;
  uploadedBy: string;
  status: 'pending' | 'reviewed' | 'urgent';
  size: string;
  category: string;
}

export default function DocumentHub() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const documents: Document[] = [
    {
      id: '1',
      fileName: 'Medical Report - Initial Assessment.pdf',
      fileType: 'PDF',
      caseId: 'RC-12345678',
      uploadedAt: new Date(),
      uploadedBy: 'Dr. Smith',
      status: 'urgent',
      size: '2.4 MB',
      category: 'Medical'
    },
    {
      id: '2',
      fileName: 'Incident Report.docx',
      fileType: 'DOCX',
      caseId: 'RC-12345678',
      uploadedAt: new Date(Date.now() - 86400000),
      uploadedBy: 'Client',
      status: 'pending',
      size: '1.1 MB',
      category: 'Legal'
    }
  ];

  const filteredDocs = documents.filter(doc => 
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.caseId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const urgentDocs = documents.filter(d => d.status === 'urgent');
  const pendingDocs = documents.filter(d => d.status === 'pending');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'urgent': return <Badge variant="destructive">Urgent</Badge>;
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
      case 'reviewed': return <Badge variant="default">Reviewed</Badge>;
      default: return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">{documents.length}</p>
              <p className="text-sm text-muted-foreground">Total Documents</p>
            </div>
            <FileText className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-destructive">{urgentDocs.length}</p>
              <p className="text-sm text-muted-foreground">Urgent Review</p>
            </div>
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-warning">{pendingDocs.length}</p>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </div>
            <Clock className="h-8 w-8 text-warning" />
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents by name or case ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="urgent">Urgent</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {filteredDocs.map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50 ${
                        selectedDoc?.id === doc.id ? 'bg-accent/50 border-primary' : 'border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{doc.fileName}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{doc.caseId}</span>
                            <span>•</span>
                            <span>{doc.size}</span>
                            <span>•</span>
                            <span>{format(doc.uploadedAt, 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                        {getStatusBadge(doc.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="urgent">
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {urgentDocs.map(doc => (
                    <div key={doc.id} className="p-4 rounded-lg border border-destructive/50 bg-destructive/5">
                      <p className="font-medium text-foreground">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground mt-1">{doc.caseId}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="pending">
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {pendingDocs.map(doc => (
                    <div key={doc.id} className="p-4 rounded-lg border border-warning/50 bg-warning/5">
                      <p className="font-medium text-foreground">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground mt-1">{doc.caseId}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Document Preview</h3>
          {selectedDoc ? (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Case ID:</span>
                  <span className="font-medium">{selectedDoc.caseId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-medium">{selectedDoc.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  {getStatusBadge(selectedDoc.status)}
                </div>
              </div>
              <div className="pt-4 space-y-2">
                <Button className="w-full" variant="default">
                  <Eye className="h-4 w-4 mr-2" />
                  View Document
                </Button>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Select a document to view details</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
