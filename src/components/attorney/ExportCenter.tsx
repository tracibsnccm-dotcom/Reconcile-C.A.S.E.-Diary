import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, FileText, Loader2 } from "lucide-react";
import { getAttorneyCases, getAttorneyRcUserId } from "@/lib/attorneyCaseQueries";
import { supabase } from "@/integrations/supabase/client";
import { isOptionalTableError } from "@/lib/optionalTableUtils";

function toCsv(rows: Record<string, string | number | null | undefined>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(",")];
  for (const r of rows) {
    lines.push(
      headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
    );
  }
  return lines.join("\n");
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export default function ExportCenter() {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<"cases" | "documents" | "activity" | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);

  const clearUnavailable = () => setUnavailable(null);

  const handleExportCases = async () => {
    setExporting("cases");
    setUnavailable(null);
    try {
      const rows = await getAttorneyCases();
      const data = (rows || []).map((c: any) => ({
        id: c.id,
        case_number: c.case_number ?? "",
        case_status: c.case_status ?? "",
        client_id: c.client_id ?? "",
        created_at: c.created_at ?? "",
        updated_at: c.updated_at ?? "",
      }));
      const csv = toCsv(data);
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(csv, `cases_${date}.csv`);
    } catch (e) {
      if (isOptionalTableError(e)) {
        setUnavailable("Export not available yet for this dataset.");
      } else {
        setUnavailable("Export not available yet for this dataset.");
      }
    } finally {
      setExporting(null);
    }
  };

  const handleExportDocuments = async () => {
    setExporting("documents");
    setUnavailable(null);
    try {
      const attorneyRcId = await getAttorneyRcUserId();
      if (!attorneyRcId) {
        setUnavailable("Export not available yet for this dataset.");
        setExporting(null);
        return;
      }
      const { data: caseRows } = await supabase
        .from("rc_cases")
        .select("id")
        .eq("attorney_id", attorneyRcId)
        .eq("is_superseded", false)
        .in("case_status", ["released", "closed", "ready"]);
      const caseIds = (caseRows || []).map((c: any) => c.id);
      if (caseIds.length === 0) {
        downloadCsv(toCsv([]), `documents_${new Date().toISOString().slice(0, 10)}.csv`);
        setExporting(null);
        return;
      }
      const { data: docRows, error } = await supabase
        .from("documents")
        .select("id, file_name, case_id, created_at, document_type")
        .in("case_id", caseIds);
      if (error) throw error;
      const data = (docRows || []).map((d: any) => ({
        id: d.id,
        file_name: d.file_name ?? "",
        case_id: d.case_id ?? "",
        created_at: d.created_at ?? "",
        document_type: d.document_type ?? "",
      }));
      const csv = toCsv(data);
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(csv, `documents_${date}.csv`);
    } catch (e) {
      if (isOptionalTableError(e)) {
        setUnavailable("Export not available yet for this dataset.");
      } else {
        setUnavailable("Export not available yet for this dataset.");
      }
    } finally {
      setExporting(null);
    }
  };

  const handleExportActivity = async () => {
    setExporting("activity");
    setUnavailable(null);
    try {
      const attorneyRcId = await getAttorneyRcUserId();
      if (!attorneyRcId) {
        setUnavailable("Export not available yet for this dataset.");
        setExporting(null);
        return;
      }
      const { data: caseRows } = await supabase
        .from("rc_cases")
        .select("id")
        .eq("attorney_id", attorneyRcId)
        .eq("is_superseded", false)
        .in("case_status", ["released", "closed", "ready"]);
      const caseIds = (caseRows || []).map((c: any) => c.id);
      if (caseIds.length === 0) {
        downloadCsv(toCsv([]), `activity_${new Date().toISOString().slice(0, 10)}.csv`);
        setExporting(null);
        return;
      }
      const { data: actRows, error } = await supabase
        .from("rc_case_activity")
        .select("id, case_id, activity_type, actor_role, summary, created_at")
        .in("case_id", caseIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const data = (actRows || []).map((a: any) => ({
        id: a.id,
        case_id: a.case_id ?? "",
        activity_type: a.activity_type ?? "",
        actor_role: a.actor_role ?? "",
        summary: (a.summary || "").slice(0, 200),
        created_at: a.created_at ?? "",
      }));
      const csv = toCsv(data);
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(csv, `activity_${date}.csv`);
    } catch (e) {
      if (isOptionalTableError(e)) {
        setUnavailable("Export not available yet for this dataset.");
      } else {
        setUnavailable("Export not available yet for this dataset.");
      }
    } finally {
      setExporting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setUnavailable(null); setExporting(null); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={clearUnavailable}>
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Data (CSV)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {unavailable && (
            <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded p-2">
              {unavailable}
            </p>
          )}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleExportCases}
            disabled={!!exporting}
          >
            {exporting === "cases" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Export Cases (CSV)
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleExportDocuments}
            disabled={!!exporting}
          >
            {exporting === "documents" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Export Documents Index (CSV)
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleExportActivity}
            disabled={!!exporting}
          >
            {exporting === "activity" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Export Activity Log (CSV)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
