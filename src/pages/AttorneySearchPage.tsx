import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, FolderOpen, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAttorneyRcUserId } from "@/lib/attorneyCaseQueries";
import { isOptionalTableError } from "@/lib/optionalTableUtils";

interface CaseHit {
  id: string;
  case_number: string | null;
  client_name: string;
}

interface DocHit {
  id: string;
  file_name: string;
  case_id: string;
  file_path?: string;
  note?: string | null;
}

export default function AttorneySearchPage() {
  const [searchParams] = useSearchParams();
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseHit[]>([]);
  const [documents, setDocuments] = useState<DocHit[]>([]);
  const [loading, setLoading] = useState(true);

  const search = useCallback(async () => {
    if (!q) {
      setCases([]);
      setDocuments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const attorneyRcId = await getAttorneyRcUserId();
      if (!attorneyRcId) {
        setCases([]);
        setDocuments([]);
        setLoading(false);
        return;
      }

      // 1) Cases: rc_cases + rc_clients, attorney-accessible, filter by case_number or client name
      const { data: casesRows } = await supabase
        .from("rc_cases")
        .select("id, case_number, client_id, rc_clients(first_name, last_name)")
        .eq("attorney_id", attorneyRcId)
        .eq("is_superseded", false)
        .in("case_status", ["released", "closed", "ready"]);

      const caseHits: CaseHit[] = [];
      (casesRows || []).forEach((c: any) => {
        const cn = (c.case_number || "").toLowerCase();
        const client = Array.isArray(c.rc_clients) ? c.rc_clients[0] : c.rc_clients;
        const first = (client?.first_name || "").toLowerCase();
        const last = (client?.last_name || "").toLowerCase();
        const clientName = [first, last].filter(Boolean).join(" ") || "—";
        if (cn.includes(q) || first.includes(q) || last.includes(q) || clientName.includes(q)) {
          caseHits.push({
            id: c.id,
            case_number: c.case_number || null,
            client_name: clientName,
          });
        }
      });
      setCases(caseHits);

      // 2) Documents: only for attorney's cases
      const caseIds = (casesRows || []).map((c: any) => c.id);
      if (caseIds.length === 0) {
        setDocuments([]);
      } else {
        try {
          const { data: docRows } = await supabase
            .from("documents")
            .select("id, file_name, case_id, file_path, note")
            .in("case_id", caseIds);

          const docHits: DocHit[] = (docRows || []).filter((d: any) => {
            const fn = (d.file_name || "").toLowerCase();
            const note = (d.note || "").toLowerCase();
            return fn.includes(q) || note.includes(q);
          });
          setDocuments(docHits);
        } catch (docErr) {
          if (isOptionalTableError(docErr)) {
            setDocuments([]);
          } else {
            setDocuments([]);
          }
        }
      }
    } catch {
      setCases([]);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    search();
  }, [search]);

  return (
    <AppLayout>
      <div className="p-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/attorney/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-2xl font-bold text-foreground mb-1">Search</h1>
        <p className="text-muted-foreground mb-6">
          Results for &quot;{q || "(empty)"}&quot;
        </p>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-8">
            {/* Section 1: Cases */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Cases
              </h2>
              {cases.length === 0 ? (
                <p className="text-muted-foreground">No matching cases.</p>
              ) : (
                <Card className="divide-y divide-border">
                  {cases.map((c) => (
                    <div
                      key={c.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/attorney/cases/${c.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/attorney/cases/${c.id}`);
                        }
                      }}
                      className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">
                          {c.case_number || c.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-muted-foreground">{c.client_name}</p>
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </section>

            {/* Section 2: Documents */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </h2>
              {documents.length === 0 ? (
                <p className="text-muted-foreground">No matching documents.</p>
              ) : (
                <Card className="divide-y divide-border">
                  {documents.map((d) => (
                    <div
                      key={d.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/attorney/cases/${d.case_id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/attorney/cases/${d.case_id}`);
                        }
                      }}
                      className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">{d.file_name}</p>
                        {d.note && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{d.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </section>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
