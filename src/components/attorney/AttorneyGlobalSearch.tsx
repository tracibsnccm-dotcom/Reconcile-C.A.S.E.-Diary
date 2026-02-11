import { useState, useCallback } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AttorneyGlobalSearch() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const goToSearch = useCallback(() => {
    const q = (query || "").trim();
    if (q) {
      navigate(`/attorney/search?q=${encodeURIComponent(q)}`);
    }
  }, [query, navigate]);

  return (
    <div className="flex w-full max-w-sm items-center gap-1 rounded-md border border-input bg-background px-2 has-[:focus]:ring-2 has-[:focus]:ring-ring">
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search cases, documents..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            goToSearch();
          }
        }}
        className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={goToSearch}
        className="shrink-0 h-8 px-2"
      >
        Search
      </Button>
    </div>
  );
}
