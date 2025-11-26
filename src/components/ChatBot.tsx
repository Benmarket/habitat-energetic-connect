import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, UserCog, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Message = { 
  role: "user" | "assistant" | "agent"; 
  content: string;
  senderName?: string;
  isVerified?: boolean;
};

export const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasRequestedAgent, setHasRequestedAgent] = useState(false);
  const [agentConnected, setAgentConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Initialize conversation on open
  useEffect(() => {
    if (isOpen && !conversationId) {
      initConversation();
    }
  }, [isOpen]);

  // Listen for new messages from agents
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as any;
          if (newMessage.sender_type === 'agent') {
            setMessages(prev => [...prev, { 
              role: 'agent', 
              content: newMessage.content,
              senderName: newMessage.sender_name,
              isVerified: true
            }]);
            setAgentConnected(true);
            setIsLoading(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const initConversation = async () => {
    try {
      const visitorId = localStorage.getItem('visitor_id') || `visitor_${Date.now()}`;
      localStorage.setItem('visitor_id', visitorId);

      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user?.id || null,
          visitor_id: user ? null : visitorId,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      setConversationId(data.id);
    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
  };

  const saveMessage = async (content: string, senderType: 'user' | 'bot' | 'agent') => {
    if (!conversationId) return;

    try {
      await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_type: senderType,
          content: content,
        });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const requestHumanAgent = async () => {
    if (!conversationId || hasRequestedAgent) return;

    try {
      // Check if there's already a pending request
      const { data: existing } = await supabase
        .from('chat_agent_requests')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('status', 'pending')
        .single();

      if (existing) {
        toast({
          title: "Demande déjà envoyée",
          description: "Un agent va vous répondre dans quelques instants.",
        });
        return;
      }

      // Update conversation status
      await supabase
        .from('chat_conversations')
        .update({ status: 'awaiting_agent' })
        .eq('id', conversationId);

      // Create agent request
      await supabase
        .from('chat_agent_requests')
        .insert({
          conversation_id: conversationId,
          status: 'pending'
        });

      setHasRequestedAgent(true);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Votre demande a été transmise à un agent humain. Vous serez contacté dans quelques instants.'
      }]);

      toast({
        title: "Demande envoyée",
        description: "Un agent va bientôt rejoindre la conversation.",
      });
    } catch (error) {
      console.error('Error requesting agent:', error);
      toast({
        title: "Erreur",
        description: "Impossible de contacter un agent pour le moment.",
        variant: "destructive",
      });
    }
  };

  const streamChat = async (userMessage: string) => {
    if (agentConnected) {
      // If agent is connected, just save the user message
      await saveMessage(userMessage, 'user');
      return;
    }

    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    // Save user message
    await saveMessage(userMessage, 'user');

    let assistantContent = "";
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-bot`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: newMessages }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error("Erreur lors de la communication avec le chatbot");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages([...newMessages, { role: "assistant", content: assistantContent }]);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save bot response
      if (assistantContent) {
        await saveMessage(assistantContent, 'bot');
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de communiquer avec le chatbot. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    streamChat(input);
    setInput("");
  };

  return (
    <>
      {/* Chatbot button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-0 group hover:scale-105 transition-transform"
          aria-label="Ouvrir le chatbot"
        >
          {/* Circle with icon */}
          <div className="h-14 w-14 rounded-full bg-blue-900 flex items-center justify-center shadow-lg z-10 group-hover:bg-blue-800 transition-colors">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          {/* Text rectangle */}
          <div className="bg-white border-2 border-blue-900 rounded-full pl-8 pr-5 py-3 -ml-6 shadow-lg">
            <span className="text-blue-900 font-semibold text-sm whitespace-nowrap">
              Assistance en ligne
            </span>
          </div>
        </button>
      )}

      {/* Chatbot window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-background border border-border rounded-lg shadow-2xl flex flex-col z-50 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-blue-900 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Assistant Prime Énergies</h3>
                <p className="text-xs opacity-90">
                  {agentConnected ? 'Agent connecté' : 'En ligne'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm mb-4">Bonjour ! Comment puis-je vous aider aujourd'hui ?</p>
                
                {/* Quick replies */}
                <div className="flex flex-col gap-2 mt-6">
                  <button
                    onClick={() => streamChat("Quelles aides pour l'isolation ?")}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-900 dark:text-blue-100 rounded-lg text-sm transition-colors border border-blue-200 dark:border-blue-800"
                  >
                    Quelles aides pour l'isolation ?
                  </button>
                  <button
                    onClick={() => streamChat("Comment fonctionne la prime énergie ?")}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-900 dark:text-blue-100 rounded-lg text-sm transition-colors border border-blue-200 dark:border-blue-800"
                  >
                    Comment fonctionne la prime énergie ?
                  </button>
                  <button
                    onClick={() => streamChat("Simuler mes économies d'énergie")}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-900 dark:text-blue-100 rounded-lg text-sm transition-colors border border-blue-200 dark:border-blue-800"
                  >
                    Simuler mes économies d'énergie
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-blue-900 text-white"
                        : msg.role === "agent"
                        ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.role === "agent" && msg.senderName && (
                      <div className="flex items-center gap-1 mb-1 text-xs font-semibold">
                        <span>{msg.senderName}</span>
                        {msg.isVerified && (
                          <CheckCircle className="h-3 w-3 text-blue-600 fill-blue-600" />
                        )}
                        <Badge variant="secondary" className="ml-1 text-[10px] h-4">Agent</Badge>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground rounded-lg px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-foreground/60 animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 rounded-full bg-foreground/60 animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 rounded-full bg-foreground/60 animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Agent request button */}
          {!agentConnected && !hasRequestedAgent && messages.length > 0 && (
            <div className="px-4 pb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={requestHumanAgent}
                className="w-full gap-2 text-xs"
              >
                <UserCog className="h-3 w-3" />
                Parler à un agent humain
              </Button>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="bg-blue-900 hover:bg-blue-800">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};