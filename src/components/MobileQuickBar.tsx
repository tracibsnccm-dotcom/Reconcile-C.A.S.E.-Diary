import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FileText, MessageSquare, Briefcase, Search, CheckSquare } from "lucide-react";

export function MobileQuickBar() {
  const location = useLocation();

  const links = [
    { to: "/cases", icon: Briefcase, label: "Cases" },
    { to: "/document-hub", icon: FileText, label: "Docs" },
    { to: "/rn-clinical-liaison", icon: MessageSquare, label: "Messages" },
    { to: "/dashboard", icon: CheckSquare, label: "Follow-Ups" },
    { to: "/dashboard", icon: Search, label: "Search" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-inset-bottom">
      <nav className="flex justify-around items-center h-16 px-2">
        {links.map(({ to, icon: Icon, label }) => (
          <Link
            key={to + label}
            to={to}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
              "active:scale-95 active:bg-accent",
              location.pathname === to
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
