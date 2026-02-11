import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useApp } from "@/context/AppContext";
import { Skeleton } from "@/components/ui/skeleton";
import { createAutoNote } from "@/lib/autoNotes";

interface Message {
  id: string;
  message_text: string;
  created_at: string;
  read_at: string | null;
  sender_id: string;
  recipient_id: string;
  sender_profile?: {
    display_name: string | null;
  } | null;
  recipient_profile?: {
    display_name: string | null;
  } | null;
}

interface TeamMember {
  user_id: string;
  role: string;
  profile: {
    display_name: string | null;
  } | null;
}

interface ClientMessagingProps {
  caseId: string;
}

export function ClientMessaging({ caseId }: ClientMessagingProps) {
  const { toast } = useToast();
  const { tier } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // New message form
  const [recipientId, setRecipientId] = useState<string>("");
  const [messageText, setMessageText] = useState("");

  // Check if messaging is allowed for current tier
  const messagingAllowed = tier === "Mid-Sized" || tier === "Enterprise";

  useEffect(() => {
    const initializeMessaging = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    
    initializeMessaging();
  }, []);

  useEffect(() => {
    if (messagingAllowed && currentUserId) {
      fetchTeamMembers();
      fetchMessages();
      
      // Set up realtime subscription
      const channel = supabase
        .channel('direct-messages-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'client_direct_messages',
            filter: `case_id=eq.${caseId}`
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [caseId, messagingAllowed, currentUserId]);

  const fetchTeamMembers = async () => {
    try {
      const { data: assignments, error } = await supabase
        .from("rc_case_assignments")
        .select("user_id, role")
        .eq("case_id", caseId)
        .neq("user_id", currentUserId);

      if (error) throw error;
      
      if (assignments && assignments.length > 0) {
        const userIds = assignments.map(a => a.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);
        
        const membersWithProfiles = assignments.map(assignment => ({
          user_id: assignment.user_id,
          role: assignment.role,
          profile: profiles?.find(p => p.user_id === assignment.user_id) || null
        }));
        
        setTeamMembers(membersWithProfiles);
      }
    } catch (err: any) {
      console.error("Error fetching team members:", err);
    }
  };

  const fetchMessages = async () => {
    if (!currentUserId) return;
    
    try {
      setLoading(true);
      const { data: messages, error } = await supabase
        .from("client_direct_messages")
        .select("*")
        .eq("case_id", caseId)
        .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      if (messages && messages.length > 0) {
        const allUserIds = [...new Set([
          ...messages.map(m => m.sender_id),
          ...messages.map(m => m.recipient_id)
        ])];
        
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", allUserIds);
        
        const messagesWithProfiles = messages.map(msg => ({
          ...msg,
          sender_profile: profiles?.find(p => p.user_id === msg.sender_id) || null,
          recipient_profile: profiles?.find(p => p.user_id === msg.recipient_id) || null
        }));
        
        setMessages(messagesWithProfiles);
      } else {
        setMessages([]);
      }
    } catch (err: any) {
      console.error("Error fetching messages:", err);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!recipientId || !messageText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a recipient and enter a message",
        variant: "destructive",
      });
      return;
    }

    if (!currentUserId) {
      toast({
        title: "Error",
        description: "Not authenticated",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);

      const { error } = await supabase.from("client_direct_messages").insert({
        case_id: caseId,
        sender_id: currentUserId,
        recipient_id: recipientId,
        message_text: messageText.trim(),
      });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully",
      });

      // Reset form
      setRecipientId("");
      setMessageText("");
      
      // Refresh messages
      fetchMessages();
      
      // Create auto-note for message sent
      try {
        const recipient = teamMembers.find(m => m.user_id === recipientId);
        const recipientType = recipient?.role || 'team member';
        await createAutoNote({
          caseId: caseId,
          noteType: 'communication',
          title: 'Message Sent',
          content: `Message sent from client to ${recipientType}`,
          triggerEvent: 'message_sent',
          visibleToClient: false,
          visibleToRN: true,
          visibleToAttorney: true
        });
      } catch (err) {
        console.error("Failed to create auto-note for message:", err);
      }
    } catch (err: any) {
      console.error("Error sending message:", err);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (!messagingAllowed) {
    return (
      <Alert>
        <MessageSquare className="w-4 h-4" />
        <AlertDescription>
          Messaging is available for Mid-Sized and Enterprise tier subscribers. Upgrade your plan to communicate directly with your care team.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case "RN_CM": return "RN Case Manager";
      case "RCMS_CLINICAL_MGMT": return "RN Clinical Manager";
      case "CLINICAL_STAFF_EXTERNAL": return "Clinical Staff";
      case "ATTORNEY": return "Attorney";
      case "PROVIDER": return "Provider";
      case "STAFF": return "Staff";
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      {/* Send New Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Send a Message
          </CardTitle>
          <CardDescription>
            Send a direct message to your care team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Send To</Label>
            <Select value={recipientId} onValueChange={setRecipientId}>
              <SelectTrigger id="recipient">
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No team members assigned yet
                  </div>
                ) : (
                  teamMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.profile?.display_name || "Unknown"} ({getRoleName(member.role)})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Your Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={6}
            />
          </div>

          <Button 
            onClick={handleSendMessage} 
            disabled={sending || teamMembers.length === 0}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </CardContent>
      </Card>

      {/* Message History */}
      <Card>
        <CardHeader>
          <CardTitle>Message History</CardTitle>
          <CardDescription>
            Your conversation with your care team
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <Alert>
              <AlertDescription>
                No messages yet. Send your first message to your care team above.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isSentByMe = msg.sender_id === currentUserId;
                const otherPerson = isSentByMe 
                  ? msg.recipient_profile?.display_name || "Team Member"
                  : msg.sender_profile?.display_name || "Team Member";
                
                return (
                  <Card key={msg.id} className={isSentByMe ? "border-primary/20" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {isSentByMe ? "You" : otherPerson}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {isSentByMe ? `to ${otherPerson}` : ""}
                            </span>
                          </div>
                          <CardDescription className="text-xs">
                            {format(new Date(msg.created_at), "PPp")}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className={`p-3 rounded-md ${isSentByMe ? "bg-primary/5" : "bg-muted"}`}>
                        <p className="text-sm whitespace-pre-wrap">
                          {msg.message_text}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
