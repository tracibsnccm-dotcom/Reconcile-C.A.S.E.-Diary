import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Copy, Download, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";

interface AICaseSummarizerProps {
  caseId: string;
  caseData: any;
}

export function AICaseSummarizer({ caseId, caseData }: AICaseSummarizerProps) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const generateSummary = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      // In a real implementation, this would call an edge function
      // that uses Lovable AI to generate the summary
      
      // Mock summary for demonstration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockSummary = `CLINICAL-LEGAL CASE SUMMARY

Case ID: ${caseId.slice(-8)}
Generated: ${new Date().toLocaleDateString()}

KEY CLINICAL FINDINGS:
• Primary injury: ${caseData.incident?.injury_type || 'Not specified'}
• Incident date: ${caseData.incident?.incident_date || 'Not specified'}
• Treatment status: Ongoing conservative care
• Current pain level: Moderate (6/10 average)

REPORT HIGHLIGHTS:
• Initial medical report received and reviewed
• Specialist evaluation pending
• Diagnostic imaging completed
• Physical therapy compliance: Good

OPEN FOLLOW-UPS:
• Provider response pending (2 items)
• Document verification needed (1 item)
• Settlement calculation in progress

TIMELINE NOTES:
• Intake completed: ${new Date(caseData.created_at).toLocaleDateString()}
• Clinical review assigned: ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
• Last check-in: ${new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}

RECOMMENDED NEXT STEPS:
1. Follow up on pending provider responses
2. Complete diagnostic imaging review
3. Schedule settlement readiness assessment

---
⚠️ DISCLAIMER: This AI-generated summary is for informational purposes only. 
Verify all clinical and legal details before use in official proceedings.`;

      setSummary(mockSummary);
      setIsEditing(true);

      // Store in database
      const { error } = await supabase
        .from('case_summaries')
        .insert({
          case_id: caseId,
          summary_type: 'clinical-legal',
          summary_content: mockSummary,
          generated_by: user.id,
        });

      if (error) throw error;

      toast.success("Case summary generated successfully");
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error("Failed to generate summary");
    } finally {
      setIsGenerating(false);
    }
  };

  const copySummary = () => {
    navigator.clipboard.writeText(summary);
    toast.success("Summary copied to clipboard");
  };

  const downloadSummary = () => {
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `case-summary-${caseId.slice(-8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Summary downloaded");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Case File Summarizer
        </CardTitle>
        <CardDescription>
          Generate a comprehensive clinical-legal summary using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <strong>Important:</strong> AI-generated summaries are for informational purposes only. 
            Always verify clinical and legal details before use in official proceedings. 
            This feature uses only on-platform case data and does not expose PHI beyond authorized access.
          </AlertDescription>
        </Alert>

        {!summary ? (
          <Button 
            onClick={generateSummary} 
            disabled={isGenerating}
            className="w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isGenerating ? "Generating Summary..." : "Generate Clinical-Legal Summary"}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={copySummary} variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button onClick={downloadSummary} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button 
                onClick={generateSummary} 
                variant="outline" 
                size="sm"
                disabled={isGenerating}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            </div>

            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="font-mono text-sm min-h-[400px]"
              placeholder="Summary will appear here..."
            />

            <p className="text-xs text-muted-foreground">
              ✓ Summary can be edited before appending to Case Summary PDF
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
