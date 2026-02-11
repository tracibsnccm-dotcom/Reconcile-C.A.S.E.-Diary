import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createAutoNote } from "@/lib/autoNotes";

interface Message {
  id: string;
  message_text: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  read_at: string | null;
}

interface CareTeamMember {
  user_id: string;
  display_name: string;
  role: string;
}

interface ClientQuickMessageProps {
  caseId: string;
}

export function ClientQuickMessage({ caseId }: ClientQuickMessageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [careTeam, setCareTeam] = useState<CareTeamMember[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCareTeam();
    fetchMessages();
  }, [caseId]);

  async function fetchCareTeam() {
    try {
      const { data, error } = await supabase
        .from("rc_case_assignments")
        .select(`
          user_id,
          role,
          profiles:user_id (display_name)
        `)
        .eq("case_id", caseId)
        .in("role", ["RN_CM", "RCMS_CLINICAL_MGMT", "ATTORNEY"]);

      if (error) throw error;
      
      const team = (data || []).map((item: any) => ({
        user_id: item.user_id,
        display_name: item.profiles?.display_name || "Unknown",
        role: item.role
      }));
      
      setCareTeam(team);
      if (team.length > 0 && !recipient) {
        setRecipient(team[0].user_id);
      }
    } catch (err: any) {
      console.error("Error fetching care team:", err);
    }
  }

  async function fetchMessages() {
    try {
      const user = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("client_direct_messages")
        .select("*")
        .eq("case_id", caseId)
        .or(`sender_id.eq.${user.data.user?.id},recipient_id.eq.${user.data.user?.id}`)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      console.error("Error fetching messages:", err);
    }
  }

  async function handleSendMessage() {
    if (!newMessage.trim() || !recipient) {
      toast.error("Please select a recipient and enter a message");
      return;
    }

    try {
      setLoading(true);
      const user = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("client_direct_messages")
        .insert({
          case_id: caseId,
          sender_id: user.data.user?.id,
          recipient_id: recipient,
          message_text: newMessage,
        });

      if (error) throw error;

      toast.success("Message sent!");
      setNewMessage("");
      fetchMessages();
      
      // Create auto-note for message sent
      try {
        const recipientMember = careTeam.find(m => m.user_id === recipient);
        const recipientType = recipientMember?.role || 'team member';
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
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6 border-rcms-gold bg-white shadow-xl">
      <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-6">
        <MessageSquare className="w-6 h-6 text-rcms-teal" />
        Quick Message
      </h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Send to
          </label>
          <Select value={recipient} onValueChange={setRecipient}>
            <SelectTrigger>
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              {careTeam.map((member) => (
                <SelectItem key={member.user_id} value={member.user_id}>
                  {member.display_name} ({member.role === "RN_CM" || member.role === "RCMS_CLINICAL_MGMT" ? "RN Case Manager" : "Attorney"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Your message
          </label>
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message here..."
            rows={4}
            maxLength={5000}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {newMessage.length} / 5000 characters
          </p>
        </div>

        <Button
          onClick={handleSendMessage}
          disabled={loading || !newMessage.trim() || !recipient}
          className="w-full bg-rcms-gold text-rcms-black hover:bg-rcms-black hover:text-rcms-gold transition-all"
        >
          <Send className="w-4 h-4 mr-2" />
          {loading ? "Sending..." : "Send Message"}
        </Button>

        {messages.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">Recent Messages</h3>
            <div className="space-y-2">
              {messages.slice(0, 3).map((msg) => (
                <div
                  key={msg.id}
                  className="p-3 border border-border rounded bg-muted/20 text-sm"
                >
                  <p className="text-foreground">{msg.message_text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(msg.created_at).toLocaleDateString()} at{" "}
                    {new Date(msg.created_at).toLocaleTimeString([], { 
                      hour: "2-digit", 
                      minute: "2-digit" 
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
