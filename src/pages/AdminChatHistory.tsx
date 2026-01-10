import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  MessageCircle,
  User,
  Bot,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

type Conversation = {
  id: string;
  user_id: string | null;
  visitor_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  flow_id: string | null;
  flow_responses: any[];
  page_url: string | null;
  user_agent: string | null;
  closed_reason: string | null;
  chatbot_flows?: { name: string } | null;
  user_email?: string | null;
  user_name?: string | null;
};

type Message = {
  id: string;
  content: string;
  sender_type: string;
  sender_name: string | null;
  created_at: string;
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: "Active", color: "bg-green-500", icon: CheckCircle },
  awaiting_agent: { label: "En attente", color: "bg-yellow-500", icon: Clock },
  completed: { label: "Terminée", color: "bg-blue-500", icon: CheckCircle },
  qualified: { label: "Qualifié", color: "bg-emerald-500", icon: CheckCircle },
  expired: { label: "Expirée", color: "bg-orange-500", icon: AlertCircle },
  abandoned: { label: "Abandonnée", color: "bg-gray-500", icon: XCircle },
  closed: { label: "Fermée", color: "bg-gray-400", icon: XCircle },
};

export default function AdminChatHistory() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch conversations
  const { data: conversations, isLoading } = useQuery({
    queryKey: ["chat-history", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("chat_conversations")
        .select(`
          *,
          chatbot_flows(name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch user profiles for conversations with user_id
      const conversationsWithProfiles = await Promise.all(
        (data || []).map(async (conv: any) => {
          if (conv.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email, first_name, last_name")
              .eq("id", conv.user_id)
              .single();

            return {
              ...conv,
              user_email: profile?.email,
              user_name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || null,
            };
          }
          return conv;
        })
      );

      return conversationsWithProfiles as Conversation[];
    },
  });

  // Fetch messages for selected conversation
  const { data: messages } = useQuery({
    queryKey: ["chat-messages", selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", selectedConversation.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!selectedConversation,
  });

  // Fetch flows for filter
  const { data: flows } = useQuery({
    queryKey: ["chatbot-flows-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chatbot_flows")
        .select("id, name")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const filteredConversations = conversations?.filter((conv) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      conv.user_email?.toLowerCase().includes(searchLower) ||
      conv.user_name?.toLowerCase().includes(searchLower) ||
      conv.visitor_id?.toLowerCase().includes(searchLower) ||
      conv.page_url?.toLowerCase().includes(searchLower)
    );
  });

  const openDetails = (conv: Conversation) => {
    setSelectedConversation(conv);
    setIsDetailsOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.active;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getUserDisplay = (conv: Conversation) => {
    if (conv.user_name) {
      return conv.user_name;
    }
    if (conv.user_email) {
      return conv.user_email;
    }
    return `Visiteur ${conv.visitor_id?.slice(0, 8) || "anonyme"}`;
  };

  return (
    <>
      <Helmet>
        <title>Historique des Conversations | Prime Énergies</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20">
          <div className="container mx-auto py-8 px-4">
            <Link
              to="/admin/chatbot"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la gestion du chatbot
            </Link>

            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold">Historique des Conversations</h1>
                <p className="text-muted-foreground mt-1">
                  Consultez toutes les conversations du chatbot
                </p>
              </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par email, visiteur ou page..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="awaiting_agent">En attente</SelectItem>
                      <SelectItem value="completed">Terminée</SelectItem>
                      <SelectItem value="qualified">Qualifié</SelectItem>
                      <SelectItem value="expired">Expirée</SelectItem>
                      <SelectItem value="abandoned">Abandonnée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Conversations list */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Conversations ({filteredConversations?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Chargement...
                  </div>
                ) : filteredConversations?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Aucune conversation trouvée
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredConversations?.map((conv) => (
                      <div
                        key={conv.id}
                        className="border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => openDetails(conv)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium truncate">
                                {getUserDisplay(conv)}
                              </span>
                              {getStatusBadge(conv.status || "active")}
                            </div>
                            {conv.chatbot_flows?.name && (
                              <p className="text-sm text-muted-foreground">
                                Parcours: {conv.chatbot_flows.name}
                              </p>
                            )}
                            {conv.page_url && (
                              <p className="text-xs text-muted-foreground truncate">
                                {conv.page_url}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <p>{format(new Date(conv.created_at), "dd MMM yyyy", { locale: fr })}</p>
                            <p>{format(new Date(conv.created_at), "HH:mm", { locale: fr })}</p>
                          </div>
                        </div>
                        {conv.flow_responses && conv.flow_responses.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-muted-foreground">
                              {conv.flow_responses.length} réponses au parcours
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>

      {/* Conversation Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Détails de la conversation
            </DialogTitle>
          </DialogHeader>

          {selectedConversation && (
            <div className="flex-1 overflow-hidden flex flex-col gap-4">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Utilisateur</p>
                  <p className="font-medium">{getUserDisplay(selectedConversation)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Statut</p>
                  <div className="mt-1">{getStatusBadge(selectedConversation.status || "active")}</div>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedConversation.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
                  </p>
                </div>
                {selectedConversation.chatbot_flows?.name && (
                  <div>
                    <p className="text-muted-foreground">Parcours</p>
                    <p className="font-medium">{selectedConversation.chatbot_flows.name}</p>
                  </div>
                )}
                {selectedConversation.page_url && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Page d'origine</p>
                    <p className="font-medium text-xs break-all">{selectedConversation.page_url}</p>
                  </div>
                )}
                {selectedConversation.closed_reason && (
                  <div>
                    <p className="text-muted-foreground">Raison de fermeture</p>
                    <p className="font-medium">{selectedConversation.closed_reason}</p>
                  </div>
                )}
              </div>

              {/* Flow responses */}
              {selectedConversation.flow_responses && selectedConversation.flow_responses.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Réponses du parcours</p>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto">
                    {selectedConversation.flow_responses.map((resp: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        <p className="text-muted-foreground">{resp.question}</p>
                        <p className="font-medium">{resp.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 min-h-0">
                <p className="text-sm font-medium mb-2">Messages ({messages?.length || 0})</p>
                <ScrollArea className="h-[300px] border rounded-lg">
                  <div className="p-4 space-y-3">
                    {messages?.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.sender_type !== "user" && (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            {msg.sender_type === "agent" ? (
                              <User className="w-4 h-4" />
                            ) : (
                              <Bot className="w-4 h-4" />
                            )}
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            msg.sender_type === "user"
                              ? "bg-blue-900 text-white"
                              : msg.sender_type === "agent"
                              ? "bg-emerald-100 dark:bg-emerald-900"
                              : "bg-muted"
                          }`}
                        >
                          {msg.sender_name && msg.sender_type === "agent" && (
                            <p className="text-xs font-semibold mb-1">{msg.sender_name}</p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs opacity-60 mt-1">
                            {format(new Date(msg.created_at), "HH:mm", { locale: fr })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {(!messages || messages.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">
                        Aucun message dans cette conversation
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
