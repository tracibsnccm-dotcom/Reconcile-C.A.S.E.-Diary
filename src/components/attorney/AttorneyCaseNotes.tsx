import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  MessageSquare, 
  User, 
  UserPlus, 
  FileText, 
  Calendar, 
  Pill, 
  Activity, 
  AlertTriangle,
  Send,
  Plus,
  Trash2
} from "lucide-react";
import { useState, useEffect } from "react";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { useAuth } from "@/auth/supabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { createAutoNote } from "@/lib/autoNotes";
import { useCaseNotes } from "@/attorney/notes/useCaseNotes";

interface Case {
  id: string;
  case_number: string | null;
  client_name: string;
}

interface Note {
  id: string;
  case_id: string;
  case_number: string;
  client_name: string;
  content: string;
  title?: string;
  created_at: string;
  created_by: string | null;
  created_by_role: string | null;
  created_by_name?: string | null;
  is_auto_generated: boolean;
  note_type?: string;
  visibility?: string;
}

export default function AttorneyCaseNotes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'auto' | 'manual' | 'rn'>('all');
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [messageClientOpen, setMessageClientOpen] = useState(false);
  const [messageRNOpen, setMessageRNOpen] = useState(false);
  const [newNote, setNewNote] = useState({ caseId: '', noteText: '', shareWithRN: false, shareWithClient: false });
  const [messageClient, setMessageClient] = useState({ caseId: '', messageText: '' });
  const [messageRN, setMessageRN] = useState({ caseId: '', messageText: '' });
  const [sendingMessage, setSendingMessage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localNoteDraft, setLocalNoteDraft] = useState("");

  const attorneyKey = user?.id ?? user?.email ?? "unknown-attorney";
  const localCaseId = selectedCaseId === "all" ? null : selectedCaseId;
  const { notes: localNotes, addNote: addLocalNote, deleteNote: deleteLocalNote } = useCaseNotes(localCaseId, attorneyKey);

  useEffect(() => {
    if (user?.id) {
      fetchCases();
      fetchNotes();
    }
  }, [user?.id]);

  async function fetchCases() {
    if (!user?.id) return;
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const assignmentsUrl = `${supabaseUrl}/rest/v1/rc_case_assignments?user_id=eq.${user.id}&status=eq.active&select=case_id`;
      const assignmentsResponse = await fetch(assignmentsUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      });

      if (!assignmentsResponse.ok) return;

      const assignmentsData = await assignmentsResponse.json();
      const caseIds = assignmentsData.map((a: any) => a.case_id);

      if (caseIds.length === 0) {
        setCases([]);
        return;
      }

      const casesUrl = `${supabaseUrl}/rest/v1/rc_cases?id=in.(${caseIds.join(',')})&is_superseded=eq.false&select=id,case_number,rc_clients(first_name,last_name)`;
      const casesResponse = await fetch(casesUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      });

      if (casesResponse.ok) {
        const casesData = await casesResponse.json();
        const transformedCases: Case[] = casesData.map((c: any) => ({
          id: c.id,
          case_number: c.case_number,
          client_name: c.rc_clients
            ? `${c.rc_clients.first_name || ''} ${c.rc_clients.last_name || ''}`.trim()
            : 'Client',
        }));
        setCases(transformedCases);
      }
    } catch (err) {
      console.error("Error fetching cases:", err);
    }
  }

  async function fetchNotes() {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const assignmentsUrl = `${supabaseUrl}/rest/v1/rc_case_assignments?user_id=eq.${user.id}&status=eq.active&select=case_id`;
      const assignmentsResponse = await fetch(assignmentsUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      });

      if (!assignmentsResponse.ok) return;

      const assignmentsData = await assignmentsResponse.json();
      const caseIds = assignmentsData.map((a: any) => a.case_id);

      if (caseIds.length === 0) {
        setNotes([]);
        return;
      }

      // Fetch notes - adapt to existing schema
      const notesUrl = `${supabaseUrl}/rest/v1/rc_case_notes?case_id=in.(${caseIds.join(',')})&order=created_at.desc`;
      const notesResponse = await fetch(notesUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      });

      if (notesResponse.ok) {
        const notesData = await notesResponse.json();
        
        // Fetch case info
        const casesUrl = `${supabaseUrl}/rest/v1/rc_cases?id=in.(${caseIds.join(',')})&is_superseded=eq.false&select=id,case_number,rc_clients(first_name,last_name)`;
        const casesResponse = await fetch(casesUrl, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          }
        });

        let caseMap = new Map();
        if (casesResponse.ok) {
          const casesData = await casesResponse.json();
          casesData.forEach((c: any) => {
            caseMap.set(c.id, {
              case_number: c.case_number,
              client_name: c.rc_clients
                ? `${c.rc_clients.first_name || ''} ${c.rc_clients.last_name || ''}`.trim()
                : 'Client',
            });
          });
        }

        // Transform notes
        const transformedNotes: Note[] = notesData.map((note: any) => {
          const caseInfo = caseMap.get(note.case_id);
          return {
            id: note.id,
            case_id: note.case_id,
            case_number: caseInfo?.case_number || note.case_id.slice(0, 8),
            client_name: caseInfo?.client_name || 'Client',
            content: note.content || '',
            title: note.title,
            created_at: note.created_at,
            created_by: note.created_by,
            created_by_role: note.created_by_role,
            created_by_name: note.created_by_name || null,
            is_auto_generated: note.is_auto_generated || false,
            note_type: note.note_type,
            visibility: note.visibility,
          };
        });

        setNotes(transformedNotes);
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddNote() {
    console.log("=== SAVE NOTE CLICKED ===");
    console.log("Selected case:", newNote.caseId);
    console.log("Note text:", newNote.noteText);
    console.log("Share with RN:", newNote.shareWithRN);
    console.log("Share with Client:", newNote.shareWithClient);

    console.log("=== HANDLE SAVE NOTE ===");
    if (!newNote.caseId || !newNote.noteText.trim() || !user?.id) {
      console.log("Validation failed");
      toast({
        title: "Error",
        description: "Please select a case and enter note text",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const attorneyName = user.user_metadata?.full_name || user.email || 'Attorney';

      const noteData = {
        case_id: newNote.caseId,
        title: newNote.noteText.trim().substring(0, 50) + (newNote.noteText.trim().length > 50 ? '...' : ''),
        content: newNote.noteText.trim(),
        note_type: 'manual',
        created_by: user.id,
        created_by_role: 'ATTORNEY',
        visibility: newNote.shareWithClient && newNote.shareWithRN ? 'shared_all' : 
                    newNote.shareWithRN ? 'shared_rn' : 
                    newNote.shareWithClient ? 'shared_client' : 'private',
        is_auto_generated: false,
        created_at: new Date().toISOString(),
      };

      console.log("Sending note data:", noteData);

      const response = await fetch(`${supabaseUrl}/rest/v1/rc_case_notes`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(noteData),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error('Failed to save note');
      }

      const result = await response.json();
      console.log("Note saved successfully:", result);

      toast({
        title: "Note added",
        description: "Your note has been saved successfully.",
      });

      setAddNoteOpen(false);
      setNewNote({ caseId: '', noteText: '', shareWithRN: false, shareWithClient: false });
      fetchNotes();
    } catch (err: any) {
      console.error("Error adding note:", err);
      toast({
        title: "Error",
        description: "Failed to save note: " + (err.message || "Unknown error"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSendClientMessage() {
    if (!messageClient.caseId || !messageClient.messageText.trim() || !user?.id) {
      toast({
        title: "Error",
        description: "Please select a case and enter message text",
        variant: "destructive",
      });
      return;
    }

    setSendingMessage(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const attorneyName = user.user_metadata?.full_name || user.email || 'Attorney';

      const messageData = {
        case_id: messageClient.caseId,
        sender_type: 'attorney',
        sender_id: user.id,
        sender_name: attorneyName,
        message_text: messageClient.messageText.trim(),
        is_read: false,
        created_at: new Date().toISOString(),
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/rc_messages`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      toast({
        title: "Message sent",
        description: "Your message has been sent to the client.",
      });

      setMessageClientOpen(false);
      setMessageClient({ caseId: '', messageText: '' });
      
      // Create auto-note for message sent
      try {
        await createAutoNote({
          caseId: messageClient.caseId,
          noteType: 'communication',
          title: 'Message Sent',
          content: `Message sent from attorney to client`,
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
        description: "Failed to send message: " + (err.message || "Unknown error"),
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleSendRNMessage() {
    if (!messageRN.caseId || !messageRN.messageText.trim() || !user?.id) {
      toast({
        title: "Error",
        description: "Please select a case and enter message text",
        variant: "destructive",
      });
      return;
    }

    setSendingMessage(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const attorneyName = user.user_metadata?.full_name || user.email || 'Attorney';

      const messageData = {
        case_id: messageRN.caseId,
        sender_type: 'attorney',
        recipient_type: 'rn',
        sender_id: user.id,
        sender_name: attorneyName,
        message_text: messageRN.messageText.trim(),
        is_read: false,
        created_at: new Date().toISOString(),
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/rc_messages`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      toast({
        title: "Message sent",
        description: "Your message has been sent to the RN.",
      });

      setMessageRNOpen(false);
      setMessageRN({ caseId: '', messageText: '' });
      
      // Create auto-note for message sent
      try {
        await createAutoNote({
          caseId: messageRN.caseId,
          noteType: 'communication',
          title: 'Message Sent',
          content: `Message sent from attorney to RN`,
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
        description: "Failed to send message: " + (err.message || "Unknown error"),
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  }

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  const getNoteTypeBadge = (note: Note) => {
    if (note.is_auto_generated) {
      return <Badge className="bg-gray-500 text-white">System</Badge>;
    } else if (note.created_by_role === 'ATTORNEY') {
      return <Badge className="bg-blue-600 text-white">Attorney</Badge>;
    } else if (note.created_by_role === 'RN_CCM' || note.created_by_role === 'RN') {
      return <Badge className="bg-green-600 text-white">RN</Badge>;
    } else if (note.created_by_role === 'CLIENT') {
      return <Badge className="bg-purple-600 text-white">Client</Badge>;
    }
    return <Badge variant="outline">Note</Badge>;
  };

  const getEventIcon = (note: Note) => {
    const eventType = note.note_type || '';
    if (eventType.includes('appointment') || eventType.includes('calendar')) {
      return <Calendar className="h-4 w-4" />;
    } else if (eventType.includes('medication') || eventType.includes('med')) {
      return <Pill className="h-4 w-4" />;
    } else if (eventType.includes('wellness') || eventType.includes('treatment') || eventType.includes('activity')) {
      return <Activity className="h-4 w-4" />;
    } else if (eventType.includes('intake') || eventType.includes('document')) {
      return <FileText className="h-4 w-4" />;
    } else if (eventType.includes('alert') || eventType.includes('crisis')) {
      return <AlertTriangle className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const filteredNotes = notes.filter(note => {
    if (selectedCaseId !== 'all' && note.case_id !== selectedCaseId) return false;
    
    switch (activeFilter) {
      case 'auto':
        return note.is_auto_generated;
      case 'manual':
        return !note.is_auto_generated && note.created_by_role === 'ATTORNEY';
      case 'rn':
        return note.created_by_role === 'RN_CCM' || note.created_by_role === 'RN';
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Case Notes</h2>
          <p className="text-sm text-gray-600">View activity and communicate with your team</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setMessageClientOpen(true)}>
            <User className="h-4 w-4 mr-2" />
            Message Client
          </Button>
          <Button variant="outline" onClick={() => setMessageRNOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Message RN
          </Button>
          <Button onClick={() => setAddNoteOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Cases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cases</SelectItem>
            {cases.map(caseItem => (
              <SelectItem key={caseItem.id} value={caseItem.id}>
                {caseItem.case_number || caseItem.id.slice(0, 8)} - {caseItem.client_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="auto">Auto-Generated</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="rn">RN Notes</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {selectedCaseId !== "all" && (
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-800">My local notes</div>
          <p className="text-xs text-gray-500 mt-0.5">Private scratch notes for this case.</p>
          <p className="text-xs text-gray-500 border-b border-gray-100 pb-2 mb-2">Stored locally on this device for this attorney. Not visible to RN or client.</p>
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a note..."
              value={localNoteDraft}
              onChange={(e) => setLocalNoteDraft(e.target.value)}
              className="min-h-[60px]"
              rows={2}
            />
            <Button
              size="sm"
              onClick={() => {
                if (addLocalNote(localNoteDraft)) {
                  setLocalNoteDraft("");
                }
              }}
              disabled={!localNoteDraft.trim()}
            >
              Add
            </Button>
          </div>
          {localNotes.length > 0 && (
            <ul className="mt-3 space-y-2">
              {localNotes.map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-2 text-sm bg-gray-50 rounded p-2">
                  <span className="text-gray-700 whitespace-pre-wrap flex-1">{n.content}</span>
                  <button
                    type="button"
                    onClick={() => deleteLocalNote(n.id)}
                    className="text-gray-400 hover:text-red-600 p-1"
                    aria-label="Delete note"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Card className="p-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse h-24 bg-gray-100 rounded"></div>
            ))}
          </div>
        ) : filteredNotes.length > 0 ? (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {filteredNotes.map(note => (
                <div key={note.id} className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getEventIcon(note)}
                      <span className="text-xs text-gray-500">{formatTimestamp(note.created_at)}</span>
                    </div>
                    {getNoteTypeBadge(note)}
                  </div>
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      {note.case_number} - {note.client_name}
                    </p>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                  {note.created_by_name && (
                    <p className="text-xs text-gray-500 mt-2">By: {note.created_by_name}</p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600">No notes found</p>
          </div>
        )}
      </Card>

      {/* Add Note Dialog */}
      <Dialog open={addNoteOpen} onOpenChange={setAddNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>Create a new note for a case</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Case *</Label>
              <Select value={newNote.caseId} onValueChange={(v) => setNewNote({ ...newNote, caseId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a case" />
                </SelectTrigger>
                <SelectContent>
                  {cases.map(caseItem => (
                    <SelectItem key={caseItem.id} value={caseItem.id}>
                      {caseItem.case_number || caseItem.id.slice(0, 8)} - {caseItem.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Note Text *</Label>
              <Textarea
                value={newNote.noteText}
                onChange={(e) => setNewNote({ ...newNote, noteText: e.target.value })}
                placeholder="Enter your note..."
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="share-rn"
                  checked={newNote.shareWithRN}
                  onCheckedChange={(checked) => setNewNote({ ...newNote, shareWithRN: checked as boolean })}
                />
                <Label htmlFor="share-rn" className="font-normal cursor-pointer">Share with RN</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="share-client"
                  checked={newNote.shareWithClient}
                  onCheckedChange={(checked) => setNewNote({ ...newNote, shareWithClient: checked as boolean })}
                />
                <Label htmlFor="share-client" className="font-normal cursor-pointer">Share with Client</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddNoteOpen(false);
              setNewNote({ caseId: '', noteText: '', shareWithRN: false, shareWithClient: false });
            }}>Cancel</Button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Save button clicked");
                handleAddNote();
              }}
              disabled={!newNote.caseId || !newNote.noteText.trim() || saving}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Note"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Client Dialog */}
      <Dialog open={messageClientOpen} onOpenChange={setMessageClientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message Client</DialogTitle>
            <DialogDescription>Send a message to the client</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Case *</Label>
              <Select value={messageClient.caseId} onValueChange={(v) => setMessageClient({ ...messageClient, caseId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a case" />
                </SelectTrigger>
                <SelectContent>
                  {cases.map(caseItem => (
                    <SelectItem key={caseItem.id} value={caseItem.id}>
                      {caseItem.case_number || caseItem.id.slice(0, 8)} - {caseItem.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Message *</Label>
              <Textarea 
                value={messageClient.messageText}
                onChange={(e) => setMessageClient({ ...messageClient, messageText: e.target.value })}
                placeholder="Type your message..." 
                rows={6} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setMessageClientOpen(false);
              setMessageClient({ caseId: '', messageText: '' });
            }}>Cancel</Button>
            <Button onClick={handleSendClientMessage} disabled={sendingMessage || !messageClient.caseId || !messageClient.messageText.trim()}>
              {sendingMessage ? 'Sending...' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message RN Dialog */}
      <Dialog open={messageRNOpen} onOpenChange={setMessageRNOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message RN</DialogTitle>
            <DialogDescription>Send a message to the RN assigned to this case</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Case *</Label>
              <Select value={messageRN.caseId} onValueChange={(v) => setMessageRN({ ...messageRN, caseId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a case" />
                </SelectTrigger>
                <SelectContent>
                  {cases.map(caseItem => (
                    <SelectItem key={caseItem.id} value={caseItem.id}>
                      {caseItem.case_number || caseItem.id.slice(0, 8)} - {caseItem.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Message *</Label>
              <Textarea 
                value={messageRN.messageText}
                onChange={(e) => setMessageRN({ ...messageRN, messageText: e.target.value })}
                placeholder="Type your message..." 
                rows={6} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setMessageRNOpen(false);
              setMessageRN({ caseId: '', messageText: '' });
            }}>Cancel</Button>
            <Button onClick={handleSendRNMessage} disabled={sendingMessage || !messageRN.caseId || !messageRN.messageText.trim()}>
              {sendingMessage ? 'Sending...' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
