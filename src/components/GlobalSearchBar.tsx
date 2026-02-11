import { useState, useRef, useEffect } from "react";
import { Search, FileText, MessageSquare, Briefcase, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type SearchFilter = "all" | "cases" | "documents" | "messages";

interface SearchResult {
  type: "case" | "document" | "message";
  id: string;
  title: string;
  subtitle: string;
  link: string;
}

export function GlobalSearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<SearchFilter>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "/" && !isOpen) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      const caseBase = typeof window !== "undefined" && window.location.pathname.startsWith("/attorney")
        ? "/attorney/cases"
        : "/cases";

      // Search cases
      if (filter === "all" || filter === "cases") {
        const { data: cases } = await supabase
          .from("cases")
          .select("id, client_label, atty_ref, status")
          .or(`id.ilike.%${searchQuery}%,client_label.ilike.%${searchQuery}%,atty_ref.ilike.%${searchQuery}%`)
          .limit(5);

        if (cases) {
          searchResults.push(
            ...cases.map((c) => ({
              type: "case" as const,
              id: c.id,
              title: c.client_label || `Case ${c.id.slice(0, 8)}`,
              subtitle: `Status: ${c.status} • Ref: ${c.atty_ref || "N/A"}`,
              link: `${caseBase}/${c.id}`,
            }))
          );
        }
      }

      // Search documents
      if (filter === "all" || filter === "documents") {
        const { data: docs } = await supabase
          .from("documents")
          .select("id, file_name, document_type, case_id")
          .ilike("file_name", `%${searchQuery}%`)
          .limit(5);

        if (docs) {
          searchResults.push(
            ...docs.map((d) => ({
              type: "document" as const,
              id: d.id,
              title: d.file_name,
              subtitle: `Type: ${d.document_type}`,
              link: `${caseBase}/${d.case_id}`,
            }))
          );
        }
      }

      // Search messages
      if (filter === "all" || filter === "messages") {
        const { data: messages } = await supabase
          .from("messages")
          .select("id, subject, message_text, case_id")
          .or(`subject.ilike.%${searchQuery}%,message_text.ilike.%${searchQuery}%`)
          .limit(5);

        if (messages) {
          searchResults.push(
            ...messages.map((m) => ({
              type: "message" as const,
              id: m.id,
              title: m.subject,
              subtitle: m.message_text.substring(0, 60) + "...",
              link: `${caseBase}/${m.case_id}`,
            }))
          );
        }
      }

      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query) {
        performSearch(query);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [query, filter]);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.link);
    setIsOpen(false);
    setQuery("");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "case": return <Briefcase className="w-4 h-4" />;
      case "document": return <FileText className="w-4 h-4" />;
      case "message": return <MessageSquare className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const groupedResults = {
    cases: results.filter((r) => r.type === "case"),
    documents: results.filter((r) => r.type === "document"),
    messages: results.filter((r) => r.type === "message"),
  };

  return (
    <div className="relative w-full max-w-xl" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
        <Input
          ref={inputRef}
          type="text"
          placeholder='Search cases, documents, messages... (Press "/" to focus)'
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={cn(
            "pl-10 pr-10 h-10 border-white/30 bg-white text-foreground placeholder:text-muted-foreground",
            "focus-visible:ring-rcms-gold focus-visible:border-rcms-gold transition-colors"
          )}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && query && (
        <Card className="absolute top-12 left-0 right-0 max-h-[480px] overflow-auto z-50 border-border shadow-lg">
          {/* Filters */}
          <div className="sticky top-0 bg-background border-b border-border p-3 flex gap-2">
            {(["all", "cases", "documents", "messages"] as SearchFilter[]).map((f) => (
              <Badge
                key={f}
                variant={filter === f ? "default" : "outline"}
                className={cn(
                  "cursor-pointer capitalize transition-colors",
                  filter === f 
                    ? "bg-rcms-gold text-foreground hover:bg-rcms-gold/90"
                    : "hover:bg-accent"
                )}
                onClick={() => setFilter(f)}
              >
                {f}
              </Badge>
            ))}
            {results.length > 0 && (
              <span className="ml-auto text-xs text-muted-foreground self-center">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Results */}
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">Searching...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No results found</p>
              </div>
            ) : (
              <>
                {groupedResults.cases.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-muted/50 font-semibold text-xs text-muted-foreground uppercase">
                      Cases
                    </div>
                    {groupedResults.cases.slice(0, 3).map((result) => (
                      <div
                        key={result.id}
                        className="p-4 hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => handleResultClick(result)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-rcms-teal">{getIcon(result.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground">{result.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {groupedResults.documents.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-muted/50 font-semibold text-xs text-muted-foreground uppercase">
                      Documents
                    </div>
                    {groupedResults.documents.slice(0, 3).map((result) => (
                      <div
                        key={result.id}
                        className="p-4 hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => handleResultClick(result)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-rcms-teal">{getIcon(result.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground">{result.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {groupedResults.messages.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-muted/50 font-semibold text-xs text-muted-foreground uppercase">
                      Messages
                    </div>
                    {groupedResults.messages.slice(0, 3).map((result) => (
                      <div
                        key={result.id}
                        className="p-4 hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => handleResultClick(result)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-rcms-teal">{getIcon(result.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground">{result.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}