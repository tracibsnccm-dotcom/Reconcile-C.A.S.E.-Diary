import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, Eye, Clock, Shield } from "lucide-react";
import { format } from "date-fns";

interface Document {
  id: string;
  created_at: string;
  file_name: string;
  case_id: string;
  uploaded_by: string;
  document_type: string;
  status: string;
  read_by: string[];
  requires_attention: boolean;
  file_path: string;
  mime_type: string | null;
  category: string;
  is_sensitive: boolean;
  note: string | null;
}

interface UrgentDocumentsSectionProps {
  documents: Document[];
  onMarkAsRead: (docId: string) => void;
  getDocumentTypeColor: (type: string) => string;
}

export function UrgentDocumentsSection({
  documents,
  onMarkAsRead,
  getDocumentTypeColor,
}: UrgentDocumentsSectionProps) {
  if (documents.length === 0) return null;

  return (
    <Card className="border-2 border-orange-500 bg-orange-50 dark:bg-orange-950/20 animate-pulse-border">
      <div className="p-4 border-b border-orange-200 dark:border-orange-800 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-orange-600 animate-bounce" />
        <h3 className="font-bold text-orange-900 dark:text-orange-100">
          🚨 Urgent Documents Requiring Immediate Attention
        </h3>
        <Badge variant="destructive" className="ml-auto animate-pulse">
          {documents.length}
        </Badge>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="font-semibold">Date & Time</TableHead>
              <TableHead className="font-semibold">File Name</TableHead>
              <TableHead className="font-semibold">Case ID</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow
                key={doc.id}
                className="animate-pulse-orange hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-all cursor-pointer hover:scale-[1.01]"
              >
                <TableCell className="font-medium">
                  {format(new Date(doc.created_at), "MMM dd, yyyy HH:mm")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 animate-pulse" />
                    <div>
                      <span className="truncate max-w-xs font-bold text-orange-900 dark:text-orange-100 block">
                        {doc.file_name}
                      </span>
                      {doc.note && (
                        <span className="text-xs text-muted-foreground italic truncate max-w-xs block">
                          📝 {doc.note}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm">{doc.case_id}</span>
                </TableCell>
                <TableCell>
                  <Badge className={getDocumentTypeColor(doc.document_type)}>
                    {doc.document_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{doc.category}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {doc.is_sensitive && (
                      <Badge variant="destructive" className="animate-pulse">
                        <Shield className="w-3 h-3 mr-1" />
                        Sensitive
                      </Badge>
                    )}
                    {doc.status === "pending" && (
                      <Badge className="bg-orange-500 text-white animate-pulse">
                        <Clock className="w-3 h-3 mr-1" />
                        Review
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead(doc.id);
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white transition-all hover:scale-105"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Mark as Read
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <style>{`
        @keyframes pulse-orange {
          0%, 100% {
            background-color: rgba(251, 146, 60, 0.15);
          }
          50% {
            background-color: rgba(251, 146, 60, 0.35);
          }
        }
        
        @keyframes pulse-border {
          0%, 100% {
            border-color: rgba(249, 115, 22, 0.5);
            box-shadow: 0 0 0 0 rgba(249, 115, 22, 0);
          }
          50% {
            border-color: rgba(249, 115, 22, 1);
            box-shadow: 0 0 20px 2px rgba(249, 115, 22, 0.4);
          }
        }
        
        .animate-pulse-orange {
          animation: pulse-orange 2s ease-in-out infinite;
        }
        
        .animate-pulse-border {
          animation: pulse-border 2s ease-in-out infinite;
        }
      `}</style>
    </Card>
  );
}
