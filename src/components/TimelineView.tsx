import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Circle, CheckCircle2, Clock, FileText, Archive, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge } from "./StatusBadge";

interface TimelineEntry {
  id: string;
  event_type: string;
  status: string;
  performed_by?: string;
  performed_by_role?: string;
  notes?: string;
  created_at: string;
  performer_name?: string;
}

interface TimelineViewProps {
  itemId: string;
  itemType: 'concern' | 'complaint';
}

export function TimelineView({ itemId, itemType }: TimelineViewProps) {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
    
    // Subscribe to realtime updates
    const tableName = itemType === 'concern' ? 'concern_timeline' : 'complaint_timeline';
    const channel = supabase
      .channel(`${tableName}-${itemId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName,
          filter: `${itemType}_id=eq.${itemId}`,
        },
        () => {
          fetchTimeline();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [itemId, itemType]);

  const fetchTimeline = async () => {
    try {
      const tableName = itemType === 'concern' ? 'concern_timeline' : 'complaint_timeline';
      const columnName = itemType === 'concern' ? 'concern_id' : 'complaint_id';

      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .eq(columnName, itemId)
        .order('created_at', { ascending: true }) as any;

      if (error) throw error;

      // Fetch performer names
      const entriesWithNames: TimelineEntry[] = [];
      for (const entry of (data || []) as any[]) {
        let performerName = 'System';
        if (entry.performed_by) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', entry.performed_by)
            .maybeSingle();
          
          performerName = profile?.display_name || 'Unknown';
        }
        entriesWithNames.push({ 
          id: entry.id,
          event_type: entry.event_type,
          status: entry.status,
          performed_by: entry.performed_by,
          performed_by_role: entry.performed_by_role,
          notes: entry.notes,
          created_at: entry.created_at,
          performer_name: performerName 
        });
      }

      setTimeline(entriesWithNames);
    } catch (error) {
      console.error('Error fetching timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'Submitted':
        return <FileText className="w-4 h-4" />;
      case 'Acknowledged':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'Assigned':
        return <User className="w-4 h-4" />;
      case 'Follow-Up Logged':
        return <FileText className="w-4 h-4" />;
      case 'Resolved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'Archived':
        return <Archive className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading timeline...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />

          {/* Timeline entries */}
          <div className="space-y-6">
            {timeline.map((entry, index) => (
              <div key={entry.id} className="relative flex gap-4">
                {/* Icon node */}
                <div
                  className={cn(
                    "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 border-background",
                    entry.status === 'New' && "bg-[hsl(var(--chart-1))] text-white",
                    entry.status === 'Acknowledged' && "bg-blue-500 text-white",
                    entry.status === 'Assigned' && "bg-orange-500 text-white",
                    entry.status === 'Follow-Up Logged' && "bg-teal-500 text-white",
                    entry.status === 'Resolved' && "bg-success text-white",
                    entry.status === 'Overdue' && "bg-destructive text-white",
                    entry.status === 'Archived' && "bg-muted text-muted-foreground",
                    !['New', 'Acknowledged', 'Assigned', 'Follow-Up Logged', 'Resolved', 'Overdue', 'Archived'].includes(entry.status) && "bg-primary text-primary-foreground"
                  )}
                >
                  {getEventIcon(entry.event_type)}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">{entry.event_type}</h4>
                        <StatusBadge status={entry.status} showIcon={false} />
                      </div>

                      {entry.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                      )}

                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold">
                            {getInitials(entry.performer_name || 'NA')}
                          </div>
                          <span>{entry.performer_name}</span>
                          {entry.performed_by_role && (
                            <span className="text-muted-foreground/60">({entry.performed_by_role})</span>
                          )}
                        </div>
                        <span>•</span>
                        <time>{formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}</time>
                      </div>
                    </div>

                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleString()}
                    </time>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
