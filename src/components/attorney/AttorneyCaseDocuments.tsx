// src/components/attorney/AttorneyCaseDocuments.tsx
// Case-scoped Documents for attorney. Read-only. Uses listCaseDocuments helper;
// missing table/bucket → empty state, no errors.

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink, Loader2, Inbox, Download } from "lucide-react";
import {
  listCaseDocuments,
  getDocumentUrl,
  type CaseDocument,
} from "@/attorney/lib/attorneyDocuments";

type Status = "loading" | "data" | "empty" | "error";

type Props = {
  caseId: string;
  variant?: "documents" | "reports";
};

function isReportLike(doc: CaseDocument): boolean {
  const ft = (doc.file_type || "").toLowerCase();
  const fn = (doc.name || "").toLowerCase();
  return ft.includes("report") || fn.includes("report");
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function inferTypeBadge(name: string, fileType?: string | null): string {
  if (fileType && fileType !== "—") return fileType;
  const ext = (name.split(".").pop() || "").toLowerCase();
  const map: Record<string, string> = {
    pdf: "PDF",
    doc: "Word",
    docx: "Word",
    jpg: "Image",
    jpeg: "Image",
    png: "Image",
    gif: "Image",
    webp: "Image",
    xls: "Excel",
    xlsx: "Excel",
    txt: "Text",
  };
  return map[ext] || ext || "File";
}

export function AttorneyCaseDocuments({ caseId, variant = "documents" }: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [rows, setRows] = useState<CaseDocument[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) return;

    let cancelled = false;
    setStatus("loading");

    listCaseDocuments(caseId).then((list) => {
      if (cancelled) return;
      const filtered = variant === "reports" ? list.filter(isReportLike) : list;
      setRows(filtered);
      setStatus(filtered.length > 0 ? "data" : "empty");
    }).catch(() => {
      if (cancelled) return;
      setRows([]);
      setStatus("empty");
    });

    return () => { cancelled = true; };
  }, [caseId, variant]);

  const handleView = async (doc: CaseDocument) => {
    if (!doc.storage_path) return;
    setLoadingId(doc.id);
    try {
      const url = await getDocumentUrl(doc, caseId);
      if (url) window.open(url, "_blank");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDownload = async (doc: CaseDocument) => {
    if (!doc.storage_path) return;
    setLoadingId(doc.id);
    try {
      const url = await getDocumentUrl(doc, caseId);
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = doc.name;
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } finally {
      setLoadingId(null);
    }
  };

  const hasStorage = (d: CaseDocument) => !!d.storage_path;
  const title = variant === "reports" ? "Reports" : "Documents";
  const icon = <FileText className="h-5 w-5 text-primary" />;

  if (status === "loading") {
    return (
      <Card className="p-6 border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading…</span>
        </div>
      </Card>
    );
  }

  if (status === "empty") {
    return (
      <Card className="p-6 border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
          {variant === "reports" ? (
            <>
              <p className="font-medium text-foreground">No reports for this case yet.</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                RN outputs and reports will appear here after release or when available. You have read-only access.
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-foreground">No documents are available yet.</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Supporting files will appear here after RN Clinical Coordination releases them.
              </p>
            </>
          )}
        </div>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card className="p-6 border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <p className="text-muted-foreground">Unable to load {variant}. Please try again later.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-border">
      <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <div className="border rounded-lg divide-y divide-border overflow-hidden">
        {rows.map((d) => {
          const canOpen = hasStorage(d);
          const typeLabel = inferTypeBadge(d.name, d.file_type);

          return (
            <div
              key={d.id}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{d.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs font-normal">
                      {typeLabel}
                    </Badge>
                    {fmtDate(d.created_at)}
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {canOpen ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(d)}
                      disabled={loadingId === d.id}
                    >
                      {loadingId === d.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(d)}
                      disabled={loadingId === d.id}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    File link not available yet.
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
