import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Calendar } from "lucide-react";
import { toast } from "sonner";

export function RNDataExport() {
  const handleExport = (type: string) => {
    toast.success(`Preparing ${type} export...`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>Download your data for records or analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Activity History</div>
                <div className="text-sm text-muted-foreground">All your actions and case notes</div>
              </div>
            </div>
            <Button onClick={() => handleExport("Activity History")} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Performance Metrics</div>
                <div className="text-sm text-muted-foreground">Your quality metrics and statistics</div>
              </div>
            </div>
            <Button onClick={() => handleExport("Performance Metrics")} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Caseload Report</div>
                <div className="text-sm text-muted-foreground">Complete list of current and past cases</div>
              </div>
            </div>
            <Button onClick={() => handleExport("Caseload Report")} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-200 dark:border-orange-900">
        <CardHeader>
          <CardTitle className="text-orange-700 dark:text-orange-400">Data Privacy Notice</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Exported data contains Protected Health Information (PHI) and must be handled according to HIPAA
            regulations. Do not share, store on unsecured devices, or transmit via unencrypted channels.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
