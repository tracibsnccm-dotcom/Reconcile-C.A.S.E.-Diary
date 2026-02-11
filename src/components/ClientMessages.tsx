import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Check, CheckCheck } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  case_id: string;
  sender_type: 'client' | 'rn';
  sender_id: string | null;
  sender_name?: string;
  message_text: string;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
}

interface ClientMessagesProps {
  caseId: string;
}

export function ClientMessages({ caseId }: ClientMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    
    // Auto-refresh messages every 30 seconds
    const interval = setInterval(() => {
      fetchMessages();
    }, 30000);

    return () => clearInterval(interval);
  }, [caseId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
    // Mark RN messages as read when viewing
    markRNMessagesAsRead();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function fetchMessages() {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_messages?case_id=eq.${caseId}&order=created_at.asc`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      
      // Get client ID from sessionStorage
      const clientCaseId = sessionStorage.getItem('client_case_id');
      
      // Process messages to determine sender type and name
      const processedMessages = (data || []).map((msg: any) => {
        const isClientMessage = msg.sender_type === 'client' || msg.sender_id === clientCaseId;
        return {
          ...msg,
          sender_type: isClientMessage ? 'client' : 'rn',
          sender_name: isClientMessage ? 'You' : (msg.sender_name || 'Care Team'),
        };
      });
      
      setMessages(processedMessages);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  }

  async function markRNMessagesAsRead() {
    // Mark all unread RN messages as read
    const unreadRNMessages = messages.filter(
      (msg) => msg.sender_type === 'rn' && !msg.is_read
    );

    if (unreadRNMessages.length === 0) return;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Update all unread RN messages
      const updatePromises = unreadRNMessages.map((msg) =>
        fetch(
          `${supabaseUrl}/rest/v1/rc_messages?id=eq.${msg.id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              is_read: true,
              read_at: new Date().toISOString(),
            }),
          }
        )
      );

      await Promise.all(updatePromises);
      
      // Refresh messages to show updated read status
      fetchMessages();
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || newMessage.trim().length > 2000) {
      return;
    }

    setSending(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const clientCaseId = sessionStorage.getItem('client_case_id');

      const messageData = {
        case_id: caseId,
        sender_type: 'client',
        sender_id: clientCaseId,
        message_text: newMessage.trim(),
        is_read: false,
      };

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_messages`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(messageData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to send message');
      }

      // Clear input and refresh messages
      setNewMessage("");
      await fetchMessages();
    } catch (err: any) {
      console.error("Error sending message:", err);
      alert("Failed to send message: " + (err.message || "Unknown error"));
    } finally {
      setSending(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-slate-600">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <CardTitle className="text-white text-2xl flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Messages
          </CardTitle>
          <p className="text-white/80 text-sm mt-1">
            Secure communication with your care team
          </p>
        </CardHeader>
      </Card>

      {/* Messaging guardrail */}
      <p className="text-slate-600 text-sm px-1">
        Messages are for non-urgent communication related to your case.
        Do not use messages for emergencies or urgent medical concerns.
      </p>
      <p className="text-slate-600 text-sm px-1">
        Messages are reviewed by your care team and attorney's office.
      </p>

      {/* Message Thread */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#4fb9af' }}>
        <CardContent className="p-4">
          <div
            ref={messagesContainerRef}
            className="bg-white rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-y-auto space-y-4"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <MessageSquare className="w-12 h-12 text-slate-400 mb-4" />
                <p className="text-slate-500 text-center">
                  No messages yet. Send a message to start a conversation with your care team.
                </p>
              </div>
            ) : (
              messages.map((message) => {
                const isClient = message.sender_type === 'client';
                return (
                  <div
                    key={message.id}
                    className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg p-3 ${
                        isClient
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {message.sender_name}
                        </span>
                        {isClient && message.is_read && (
                          <CheckCheck className="w-3 h-3 text-white/80" />
                        )}
                        {isClient && !message.is_read && (
                          <Check className="w-3 h-3 text-white/80" />
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.message_text}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isClient ? 'text-white/70' : 'text-slate-500'
                        }`}
                      >
                        {format(new Date(message.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Compose Message */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardContent className="p-4">
          <div className="space-y-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message to your care team..."
              rows={4}
              maxLength={2000}
              className="bg-white border-slate-200 resize-none"
            />
            <div className="flex justify-between items-center">
              <p className="text-white/70 text-xs">
                {newMessage.length}/2000 characters
              </p>
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || newMessage.length > 2000 || sending}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                {sending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
