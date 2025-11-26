import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bell, Send, CheckCircle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type AgentRequest = {
  id: string;
  conversation_id: string;
  status: string;
  created_at: string;
  visitor_id?: string;
  user_email?: string;
};

type Message = {
  id: string;
  content: string;
  sender_type: string;
  created_at: string;
  sender_name?: string;
};

export default function ChatSupport() {
  const [pendingRequests, setPendingRequests] = useState<AgentRequest[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!user) {
      navigate("/connexion");
      return;
    }

    // Check user role
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data && ['super_admin', 'admin', 'moderator'].includes(data.role)) {
          setUserRole(data.role);
        } else {
          navigate("/");
          toast({
            title: "Accès refusé",
            description: "Vous n'avez pas les permissions nécessaires.",
            variant: "destructive",
          });
        }
      });

    // Get profile
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [user, navigate]);

  useEffect(() => {
    if (!userRole) return;

    loadPendingRequests();

    // Check if there's a conversation parameter in URL
    const conversationParam = searchParams.get('conversation');
    if (conversationParam) {
      setSelectedConversation(conversationParam);
    }

    // Subscribe to new agent requests
    const channel = supabase
      .channel('agent-requests')
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
  }, [userRole, searchParams]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();

      // Subscribe to new messages
      const channel = supabase
        .channel(`conversation:${selectedConversation}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `conversation_id=eq.${selectedConversation}`,
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadPendingRequests = async () => {
    const { data, error } = await supabase
      .from('chat_agent_requests')
      .select(`
        *,
        chat_conversations!inner(visitor_id, user_id)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const requestsWithEmails = await Promise.all(
        data.map(async (req: any) => {
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

  const loadMessages = async () => {
    if (!selectedConversation) return;

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', selectedConversation)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const acceptRequest = async (requestId: string, conversationId: string) => {
    if (!user) return;

    // Update request status
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
        description: "Impossible d'accepter la demande.",
        variant: "destructive",
      });
      return;
    }

    // Update conversation status
    await supabase
      .from('chat_conversations')
      .update({ status: 'active' })
      .eq('id', conversationId);

    setSelectedConversation(conversationId);
    loadPendingRequests();

    toast({
      title: "Conversation acceptée",
      description: "Vous pouvez maintenant discuter avec l'utilisateur.",
    });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedConversation || !user || !profile) return;

    const senderName = profile.first_name && profile.last_name 
      ? `${profile.first_name} ${profile.last_name}`
      : profile.email?.split('@')[0] || 'Agent';

    await supabase
      .from('chat_messages')
      .insert({
        conversation_id: selectedConversation,
        sender_type: 'agent',
        sender_id: user.id,
        content: inputMessage,
        sender_name: senderName,
      });

    setInputMessage("");
  };

  if (!userRole) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Support Chat en Direct</h1>
          <p className="text-muted-foreground">Gérez les demandes d'assistance des utilisateurs</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending requests */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Demandes en attente
                {pendingRequests.length > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {pendingRequests.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {pendingRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Aucune demande en attente
                    </p>
                  ) : (
                    pendingRequests.map((request) => (
                      <Card key={request.id} className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {request.user_email || request.visitor_id}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          {new Date(request.created_at).toLocaleString('fr-FR')}
                        </p>
                        <Button
                          size="sm"
                          onClick={() => acceptRequest(request.id, request.conversation_id)}
                          className="w-full"
                        >
                          Accepter la conversation
                        </Button>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat area */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedConversation ? 'Conversation en cours' : 'Sélectionnez une demande'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedConversation ? (
                <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                  <p>Acceptez une demande pour commencer la conversation</p>
                </div>
              ) : (
                <div className="flex flex-col h-[600px]">
                  <ScrollArea className="flex-1 mb-4" ref={scrollRef}>
                    <div className="space-y-4 p-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              msg.sender_type === 'agent'
                                ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100'
                                : msg.sender_type === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            {msg.sender_type === 'agent' && msg.sender_name && (
                              <div className="flex items-center gap-1 mb-1 text-xs font-semibold">
                                <span>{msg.sender_name}</span>
                                <CheckCircle className="h-3 w-3 text-emerald-600 fill-emerald-600" />
                                <Badge variant="secondary" className="ml-1 text-[10px] h-4">Agent</Badge>
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(msg.created_at).toLocaleTimeString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Separator className="my-2" />
                  <div className="flex gap-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Écrivez votre message..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <Button onClick={sendMessage} disabled={!inputMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}