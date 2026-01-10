import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type AgentRequest = {
  id: string;
  conversation_id: string;
  created_at: string;
  visitor_id?: string;
  user_email?: string;
};

export function LiveChatNotifications() {
  const [pendingRequests, setPendingRequests] = useState<AgentRequest[]>([]);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    loadPendingRequests();

    // Subscribe to new agent requests
    const channel = supabase
      .channel('agent-requests-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_agent_requests',
          filter: 'status=eq.pending',
        },
        () => {
          loadPendingRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadPendingRequests = async () => {
    // First, call the function to expire stale requests
    await supabase.rpc('expire_stale_agent_requests');
    await supabase.rpc('mark_abandoned_conversations');

    const { data, error } = await supabase
      .from('chat_agent_requests')
      .select(`
        *,
        chat_conversations!inner(visitor_id, user_id, last_seen_at)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (!error && data) {
      // Filter out requests where conversation has no recent heartbeat (> 2 min)
      const now = new Date();
      const validRequests = data.filter((req: any) => {
        if (!req.chat_conversations.last_seen_at) return true; // No heartbeat yet, keep it
        const lastSeen = new Date(req.chat_conversations.last_seen_at);
        const diffMinutes = (now.getTime() - lastSeen.getTime()) / 60000;
        return diffMinutes < 2; // Only show if user was seen in last 2 minutes
      });

      const requestsWithEmails = await Promise.all(
        validRequests.map(async (req: any) => {
          if (req.chat_conversations.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', req.chat_conversations.user_id)
              .single();
            
            return {
              ...req,
              user_email: profile?.email,
            };
          }
          return {
            ...req,
            visitor_id: req.chat_conversations.visitor_id,
          };
        })
      );
      setPendingRequests(requestsWithEmails);
    }
  };

  const getElapsedTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m`;
    } else if (diffMins > 0) {
      return `${diffMins}m ${diffSecs % 60}s`;
    } else {
      return `${diffSecs}s`;
    }
  };

  // Update elapsed times every second
  useEffect(() => {
    if (pendingRequests.length === 0) return;

    const interval = setInterval(() => {
      // Force re-render to update elapsed times
      setPendingRequests(prev => [...prev]);
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingRequests.length]);

  const joinConversation = async (requestId: string, conversationId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('chat_agent_requests')
      .update({
        status: 'accepted',
        assigned_agent_id: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rejoindre la conversation.",
        variant: "destructive",
      });
      return;
    }

    await supabase
      .from('chat_conversations')
      .update({ status: 'active' })
      .eq('id', conversationId);

    setOpen(false);
    navigate(`/chat-support?conversation=${conversationId}`);
  };

  if (!user || pendingRequests.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5 text-foreground" />
          {pendingRequests.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {pendingRequests.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b bg-destructive/10">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
            </span>
            Demandes de chat en direct
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {pendingRequests.length} {pendingRequests.length === 1 ? 'personne attend' : 'personnes attendent'} un agent
          </p>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {pendingRequests.map((request) => (
            <div 
              key={request.id} 
              className="p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-medium text-sm">
                    {request.user_email || `Visiteur ${request.visitor_id?.slice(0, 8)}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    En attente depuis <span className="font-semibold text-orange-600">{getElapsedTime(request.created_at)}</span>
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => joinConversation(request.id, request.conversation_id)}
                className="w-full"
              >
                Rejoindre la conversation
              </Button>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
