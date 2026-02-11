import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Copy, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const DOCUMENT_TYPES = [
  { value: "demand_letter", label: "Demand Letter", description: "Comprehensive settlement demand" },
  { value: "medical_chronology", label: "Medical Chronology", description: "Timeline of treatments" },
  { value: "case_summary", label: "Case Summary", description: "Settlement negotiation overview" },
  { value: "discovery_requests", label: "Discovery Requests", description: "Interrogatories & production requests" },
  { value: "retainer_agreement", label: "Retainer Agreement", description: "Client engagement letter" }
];

export function AIDocumentAssembly({ caseData }: { caseData: any }) {
  const [selectedType, setSelectedType] = useState("");
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateDocument = async () => {
    if (!selectedType) {
      toast({
        title: "Select Document Type",
        description: "Please choose a document type first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-document-assembly", {
        body: { 
          documentType: selectedType,
          caseData
        }
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes("Rate limit")) {
          toast({
            title: "Rate Limit Reached",
            description: "Too many requests. Please wait a moment.",
            variant: "destructive"
          });
        } else if (data.error.includes("Payment required")) {
          toast({
            title: "AI Credits Needed",
            description: "Please add AI credits to continue.",
            variant: "destructive"
          });
        }
        return;
      }

      setDocument(data.document);
      toast({
        title: "Document Generated",
        description: "Your document is ready for review"
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (document) {
      navigator.clipboard.writeText(document.document_content);
      toast({
        title: "Copied",
        description: "Document copied to clipboard"
      });
    }
  };

  const downloadDocument = () => {
    if (document) {
      const blob = new Blob([document.document_content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${document.document_title.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">AI Document Assembly</h2>
        <p className="text-muted-foreground">Auto-populate legal documents from case data</p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Document Type</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a document type..." />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={generateDocument} disabled={loading || !selectedType} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Document...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Document
              </>
            )}
          </Button>
        </div>
      </Card>

      {document && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">{document.document_title}</h3>
              <Badge variant="secondary" className="mt-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                Generated
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={downloadDocument}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {document.document_content}
            </pre>
          </div>

          {document.missing_data && document.missing_data.length > 0 && (
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">Missing Information:</h4>
              <ul className="space-y-1">
                {document.missing_data.map((item: string, idx: number) => (
                  <li key={idx} className="text-sm">• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {document.recommendations && document.recommendations.length > 0 && (
            <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">Recommendations:</h4>
              <ul className="space-y-1">
                {document.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="text-sm">• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
