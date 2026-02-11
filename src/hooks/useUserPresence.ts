import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";

interface UserPresence {
  user_id: string;
  online_at: string;
  status: "online" | "offline";
}

export function useUserPresence(targetUserId?: string) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Map<string, UserPresence>>(new Map());
  const [isTargetOnline, setIsTargetOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel("user-presence");

    // Track current user's presence
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const presenceMap = new Map<string, UserPresence>();

        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          if (presences.length > 0) {
            const presence = presences[0] as UserPresence;
            presenceMap.set(key, presence);
          }
        });

        setOnlineUsers(presenceMap);

        // Check if target user is online
        if (targetUserId) {
          const targetPresence = presenceMap.get(targetUserId);
          setIsTargetOnline(!!targetPresence);
          if (targetPresence) {
            setLastSeen(targetPresence.online_at);
          }
        }
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("User joined:", key, newPresences);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("User left:", key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Track this user's presence
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
            status: "online",
          });
        }
      });

    // Cleanup on unmount
    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [user?.id, targetUserId]);

  return {
    onlineUsers,
    isTargetOnline,
    lastSeen,
  };
}
