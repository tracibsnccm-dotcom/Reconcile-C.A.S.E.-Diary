import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  FileText,
  Settings,
  LogOut,
  Activity,
  UserCircle,
  ClipboardEdit,
  Route as RouteIcon,
  HeartPulse,
  FolderKanban,
  Shield,
  BarChart3,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Role, ROLES } from "@/config/rcms";
import { useApp } from "@/context/AppContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GlobalSearchBar } from "@/components/GlobalSearchBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { isOptionalTableError } from "@/lib/optionalTableUtils";

interface AppLayoutProps {
  children: ReactNode;
}

const navigation = [
  // Attorney Navigation
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: [ROLES.ATTORNEY, ROLES.STAFF, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Attorney Portal", href: "/attorney-portal", icon: UserCircle, roles: [ROLES.ATTORNEY, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Attorney Dashboard", href: "/attorney-dashboard", icon: LayoutDashboard, roles: [ROLES.ATTORNEY, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Attorney Settings", href: "/attorney/settings", icon: Settings, roles: [ROLES.ATTORNEY, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Billing & Subscriptions", href: "/attorney/billing", icon: ClipboardCheck, roles: [ROLES.ATTORNEY, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Referrals", href: "/referrals", icon: Users, roles: [ROLES.ATTORNEY, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "RN Clinical Coordination", href: "/attorney/rn-coordination", icon: HeartPulse, roles: [ROLES.ATTORNEY, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  
  // RN Navigation (Consolidated): Dashboard is canonical RN home at /rn/dashboard
  { name: "Dashboard", href: "/rn/dashboard", icon: LayoutDashboard, roles: [ROLES.RN_CM, ROLES.RCMS_CLINICAL_MGMT, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Clinical Management", href: "/clinical-management-portal", icon: Users, roles: [ROLES.RN_CM_DIRECTOR, ROLES.RN_CM_SUPERVISOR, ROLES.RN_CM_MANAGER, ROLES.RCMS_CLINICAL_MGMT, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "RN Diary", href: "/rn-diary", icon: ClipboardEdit, roles: [ROLES.RN_CM, ROLES.RCMS_CLINICAL_MGMT, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "RN Caseload", href: "/rn/caseload", icon: Users, roles: [ROLES.RN_CM, ROLES.RCMS_CLINICAL_MGMT, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Time Tracking", href: "/rn/time-tracking", icon: Activity, roles: [ROLES.RN_CM, ROLES.RCMS_CLINICAL_MGMT, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "RN Settings", href: "/rn/settings", icon: Settings, roles: [ROLES.RN_CM, ROLES.RCMS_CLINICAL_MGMT, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  
  // Shared Navigation
  { name: "Documents & Files", href: "/documents", icon: FolderKanban, roles: [ROLES.ATTORNEY, ROLES.STAFF, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Reports", href: "/reports", icon: BarChart3, roles: [ROLES.ATTORNEY, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Client Intake", href: "/client-intake", icon: ClipboardEdit, roles: [ROLES.CLIENT, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Cases", href: "/cases", icon: FileText, roles: [ROLES.ATTORNEY, ROLES.RN_CM, ROLES.RCMS_CLINICAL_MGMT, ROLES.STAFF, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  
  // Attorney-Only Tools
  { name: "Providers", href: "/providers", icon: Stethoscope, roles: [ROLES.ATTORNEY, ROLES.STAFF, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Router", href: "/router", icon: RouteIcon, roles: [ROLES.ATTORNEY, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  
  // Other Portals
  { name: "Client Portal", href: "/client-portal", icon: UserCircle, roles: [ROLES.CLIENT, ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  
  // Admin & Analytics
  { name: "Journal Analytics", href: "/journal-analytics", icon: BarChart3, roles: [ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Admin", href: "/admin-dashboard", icon: Shield, roles: [ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Analytics", href: "/analytics", icon: Activity, roles: [ROLES.SUPER_USER, ROLES.SUPER_ADMIN] },
  { name: "Settings", href: "/settings", icon: Settings, roles: "all" },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, setRole, currentTier, setCurrentTier } = useApp();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from user preferences (optional table)
  useEffect(() => {
    if (!user) return;

    const loadNavState = async () => {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("nav_collapsed")
        .eq("user_id", user.id)
        .single();

      if (error && isOptionalTableError(error)) return;
      if (data?.nav_collapsed !== undefined) {
        setIsCollapsed(data.nav_collapsed);
      }
    };

    loadNavState();
  }, [user]);

  // Save collapsed state to user preferences (optional table)
  const toggleCollapse = async () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);

    if (user) {
      const { error } = await supabase
        .from("user_preferences")
        .upsert(
          { user_id: user.id, nav_collapsed: newState },
          { onConflict: "user_id" }
        );
      if (error && !isOptionalTableError(error)) {
        console.warn("AppLayout: could not save nav_collapsed", error);
      }
    }
  };

  const canAccessRoute = (routeRoles: string | Role[]) => {
    if (routeRoles === "all") return true;
    return (routeRoles as Role[]).includes(role);
  };

  const filteredNav = navigation.filter((item) => canAccessRoute(item.roles));

  // Hide sidebar for attorneys - they use Quick Actions instead
  const shouldShowSidebar = role !== ROLES.ATTORNEY;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Hidden for attorneys */}
      {shouldShowSidebar && (
        <aside
          className={cn(
            "bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
            isCollapsed ? "w-16" : "w-64"
          )}
        >
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-sidebar-foreground">
                Reconcile <span className="text-sidebar-primary">C.A.R.E.</span>
              </h1>
              <p className="text-xs text-sidebar-foreground/60 mt-1">Care Management System</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="text-sidebar-foreground hover:bg-sidebar-accent ml-auto"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <TooltipProvider>
            {filteredNav.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                        isCollapsed && "justify-center"
                      )}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && item.name}
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">{item.name}</TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </nav>

        <div className={cn("p-4 border-t border-sidebar-border space-y-3", isCollapsed && "px-2")}>
          {/* Role Display */}
          {!isCollapsed && (
            <div className="px-3 py-2 bg-sidebar-accent/50 rounded-lg">
              <p className="text-xs font-medium text-sidebar-foreground/60 mb-1">Your Role</p>
              <p className="text-sm font-semibold text-sidebar-foreground">{role.replace(/_/g, " ")}</p>
            </div>
          )}

          {/* Tier Display */}
          {!isCollapsed && (
            <div className="px-3 py-2 bg-sidebar-accent/50 rounded-lg">
              <p className="text-xs font-medium text-sidebar-foreground/60">Tier</p>
              <p className="text-sm font-semibold text-sidebar-foreground">{currentTier}</p>
            </div>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate('/logout')}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                    "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    "transition-all w-full",
                    isCollapsed && "justify-center"
                  )}
                >
                  <LogOut className="w-5 h-5" />
                  {!isCollapsed && "Sign Out"}
                </button>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        </div>
      </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 border-b border-secondary-foreground/10 bg-secondary text-secondary-foreground">
          <div className="flex h-16 items-center gap-4 px-6">
            <div className="flex-1 flex items-center gap-4">
              <GlobalSearchBar />
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <ThemeToggle />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate('/logout')}
                      className="text-secondary-foreground hover:bg-secondary-foreground/10"
                      aria-label="Sign Out"
                    >
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Sign Out</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
