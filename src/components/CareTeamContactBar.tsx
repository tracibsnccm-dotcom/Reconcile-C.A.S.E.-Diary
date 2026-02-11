import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Phone, Video, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TeamMember {
  user_id: string;
  role: string;
  display_name: string;
  email: string;
  unread_count: number;
  status?: string;
}

interface CareTeamContactBarProps {
  caseId: string;
}

export function CareTeamContactBar({ caseId }: CareTeamContactBarProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    fetchTeamMembers();

    // Scroll listener for sticky behavior
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [caseId]);

  async function fetchTeamMembers() {
    try {
      setLoading(true);
      
      // Check if caseId is valid before querying
      if (!caseId || caseId.trim() === '') {
        setTeamMembers([]);
        setLoading(false);
        return;
      }
      
      const currentUser = await supabase.auth.getUser();

      // Get team members assigned to this case
      const { data: assignments, error: assignError } = await supabase
        .from("rc_case_assignments")
        .select("user_id, role")
        .eq("case_id", caseId)
        .neq("user_id", currentUser.data.user?.id); // Exclude self

      if (assignError) throw assignError;

      if (!assignments || assignments.length === 0) {
        setTeamMembers([]);
        setLoading(false);
        return;
      }

      // Get profile info for each team member
      const userIds = assignments.map((a) => a.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .in("user_id", userIds);

      if (profileError) throw profileError;

      // Get unread message counts
      const { data: unreadMessages, error: unreadError } = await supabase
        .from("client_direct_messages")
        .select("sender_id")
        .eq("recipient_id", currentUser.data.user?.id)
        .is("read_at", null);

      if (unreadError) throw unreadError;

      // Count unread messages per sender
      const unreadCounts: Record<string, number> = {};
      unreadMessages?.forEach((msg) => {
        unreadCounts[msg.sender_id] = (unreadCounts[msg.sender_id] || 0) + 1;
      });

      // Combine data
      const members: TeamMember[] = assignments.map((assignment) => {
        const profile = profiles?.find((p) => p.user_id === assignment.user_id);
        return {
          user_id: assignment.user_id,
          role: assignment.role,
          display_name: profile?.display_name || "Team Member",
          email: profile?.email || "",
          unread_count: unreadCounts[assignment.user_id] || 0,
        };
      });

      setTeamMembers(members);
    } catch (err: any) {
      console.error("Error fetching team members:", err);
      toast.error("Failed to load care team");
    } finally {
      setLoading(false);
    }
  }

  function getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      RN_CM: "RN Case Manager",
      RCMS_CLINICAL_MGMT: "RN Clinical Manager",
      CLINICAL_STAFF_EXTERNAL: "Clinical Staff",
      ATTORNEY: "Attorney",
      PROVIDER: "Provider",
      STAFF: "Staff",
    };
    return labels[role] || role;
  }

  function getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      RN_CM: "bg-blue-500",
      RCMS_CLINICAL_MGMT: "bg-blue-600",
      CLINICAL_STAFF_EXTERNAL: "bg-blue-400",
      ATTORNEY: "bg-purple-500",
      PROVIDER: "bg-green-500",
      STAFF: "bg-gray-500",
    };
    return colors[role] || "bg-gray-500";
  }

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function handleMessage(memberId: string, memberName: string) {
    toast.info(`Opening message to ${memberName}...`);
    // Navigate to messaging or open modal
  }

  if (loading) {
    return (
      <div className="bg-white border-b-2 border-rcms-gold shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center gap-3 animate-pulse">
            <div className="h-4 w-32 bg-muted rounded"></div>
            <div className="flex gap-2">
              <div className="h-10 w-40 bg-muted rounded-lg"></div>
              <div className="h-10 w-40 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (teamMembers.length === 0) {
    return null; // Don't show anything if no team members
  }

  return (
    <div
      className={`bg-white border-b-2 border-rcms-gold shadow-md transition-all duration-300 z-40 ${
        isSticky ? "fixed top-0 left-0 right-0 animate-in slide-in-from-top" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground hidden sm:inline">
              Your Care Team:
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto flex-1">
            {teamMembers.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2 min-w-fit hover:bg-muted/50 transition-colors"
              >
                <div className="relative">
                  <Avatar className="w-8 h-8 border-2 border-rcms-gold">
                    <AvatarFallback className={`${getRoleColor(member.role)} text-white text-xs`}>
                      {getInitials(member.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  {member.unread_count > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                      {member.unread_count}
                    </Badge>
                  )}
                </div>

                <div className="hidden md:flex flex-col min-w-0">
                  <span className="text-xs font-medium text-foreground truncate max-w-[120px]">
                    {member.display_name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {getRoleLabel(member.role)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 hover:bg-rcms-gold/20"
                    onClick={() => handleMessage(member.user_id, member.display_name)}
                    title="Send Message"
                  >
                    <MessageSquare className="w-4 h-4 text-rcms-gold" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 hover:bg-rcms-gold/20 hidden sm:flex"
                    title="Email"
                  >
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            className="border-rcms-gold text-rcms-gold hover:bg-rcms-gold hover:text-white whitespace-nowrap"
            onClick={() => toast.info("Opening full team directory...")}
          >
            View All
          </Button>
        </div>
      </div>
    </div>
  );
}
