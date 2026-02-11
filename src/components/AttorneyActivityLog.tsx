import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { format } from "date-fns";
import { Activity, FileText, UserCheck, Clock } from "lucide-react";

interface ActivityLogEntry {
  id: string;
  action: string;
  timestamp: string;
  details?: string;
  type: 'assignment' | 'case' | 'document' | 'profile';
}

export function AttorneyActivityLog() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivityLog();
  }, [user?.id]);

  const loadActivityLog = async () => {
    try {
      const logs: ActivityLogEntry[] = [];

      // Load assignment activities
      const { data: offers } = await supabase
        .from('assignment_offers')
        .select('*')
        .eq('attorney_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (offers) {
        offers.forEach(offer => {
          logs.push({
            id: offer.id,
            action: offer.status === 'accepted' ? 'Accepted Assignment' : 
                   offer.status === 'declined' ? 'Declined Assignment' : 
                   'Received Assignment Offer',
            timestamp: offer.responded_at || offer.offered_at,
            details: offer.decline_reason || undefined,
            type: 'assignment',
          });
        });
      }

      // Load audit log activities
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('actor_id', user?.id)
        .order('ts', { ascending: false })
        .limit(30);

      if (auditLogs) {
        auditLogs.forEach(log => {
          logs.push({
            id: log.id.toString(),
            action: formatAction(log.action),
            timestamp: log.ts,
            details: log.meta ? JSON.stringify(log.meta) : undefined,
            type: determineType(log.action),
          });
        });
      }

      // Sort by timestamp descending
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(logs.slice(0, 50));
    } catch (error) {
      console.error('Error loading activity log:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const determineType = (action: string): ActivityLogEntry['type'] => {
    if (action.includes('document')) return 'document';
    if (action.includes('case')) return 'case';
    if (action.includes('profile')) return 'profile';
    return 'assignment';
  };

  const getIcon = (type: ActivityLogEntry['type']) => {
    switch (type) {
      case 'assignment':
        return <UserCheck className="w-4 h-4" />;
      case 'case':
        return <FileText className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'profile':
        return <Activity className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: ActivityLogEntry['type']) => {
    switch (type) {
      case 'assignment':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'case':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'document':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
      case 'profile':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Activity Log
        </CardTitle>
        <CardDescription>
          Your recent actions and system events (last 50 activities)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Clock className="w-5 h-5 animate-spin mr-2" />
            Loading activity log...
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent activity found
          </div>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className={`p-2 rounded-full h-fit ${getTypeColor(activity.type)}`}>
                    {getIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-sm">{activity.action}</p>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {activity.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(activity.timestamp), 'PPp')}
                    </p>
                    {activity.details && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {activity.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}