import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, X, Send, UserCog, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChatbotFlowRunner } from "./ChatbotFlowRunner";

// Routes where chatbot should be hidden
const HIDDEN_ROUTES = [
  '/administration',
  '/admin/',
  '/creer-contenu',
  '/gerer-actualites',
  '/gerer-guides',
  '/gerer-aides',
  '/gerer-annonces',
  '/chat-support',
  '/guide/',     // Guides detail pages
  '/guides',     // Guides list page (for consistency)
  '/actualites/', // Articles detail pages
  '/aide/',      // Aides detail pages
];

type Message = {
  role: "user" | "assistant" | "agent";
  content: string;
  senderName?: string;
  isVerified?: boolean;
};

export const ChatBot = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasRequestedAgent, setHasRequestedAgent] = useState(false);
  const [agentConnected, setAgentConnected] = useState(false);
  const [isButtonVisible, setIsButtonVisible] = useState(true);
  const [activeFlow, setActiveFlow] = useState<any>(null);
  const [showFlowRunner, setShowFlowRunner] = useState(true);
  const [flowCompleted, setFlowCompleted] = useState(false);
  const [chatbotEnabled, setChatbotEnabled] = useState<boolean | null>(null);
  const [currentFlowNode, setCurrentFlowNode] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if current route should hide chatbot
  const shouldHideChatbot = HIDDEN_ROUTES.some(route => location.pathname.startsWith(route));

  // Check if chatbot is globally enabled
  useEffect(() => {
    const checkChatbotEnabled = async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "chatbot_enabled")
        .maybeSingle();

      if (error) {
        // Error fetching, default to enabled
        setChatbotEnabled(true);
        return;
      }

      // If no setting exists (data is null), default to enabled
      // If setting exists, use its value (true or false)
      if (data === null) {
        setChatbotEnabled(true);
      } else {
        setChatbotEnabled(data.value === true);
      }
    };

    checkChatbotEnabled();
  }, []);

  // Load active flow on mount (prioritize main flow)
  useEffect(() => {
    const loadActiveFlow = async () => {
      // First try to get main flow
      const { data: mainFlow } = await supabase
        .from("chatbot_flows")
        .select("*")
        .eq("is_main", true)
        .limit(1)
        .maybeSingle();

      if (mainFlow) {
        console.log("Main chatbot flow loaded:", mainFlow);
        setActiveFlow(mainFlow);
        return;
      }

      // Fallback to any active flow
      const { data, error } = await supabase
        .from("chatbot_flows")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      console.log("Chatbot flow loaded:", { data, error });

      if (data && !error) {
        setActiveFlow(data);
      }
    };

    loadActiveFlow();
  }, []);

  // Handle flow redirect (switch to another flow)
  const handleFlowRedirect = async (flowId: string, conversationHistory: Array<{ question: string; answer: string }>) => {
    const { data: newFlow, error } = await supabase
      .from("chatbot_flows")
      .select("*")
      .eq("id", flowId)
      .single();

    if (newFlow && !error) {
      console.log("Redirecting to flow:", newFlow.name);
      setActiveFlow(newFlow);
      // The flow runner will reset automatically with the new structure
    } else {
      console.error("Failed to load redirect flow:", flowId, error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le parcours demandé.",
        variant: "destructive",
      });
    }
  };

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
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as any;
          if (newMessage.sender_type === "agent") {
            setMessages((prev) => [
              ...prev,
              {
                role: "agent",
                content: newMessage.content,
                senderName: newMessage.sender_name,
                isVerified: true,
              },
            ]);
            setAgentConnected(true);
            setIsLoading(false);
          }
        },
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

  // Detect footer visibility to hide/show button (only when chat is closed)
  useEffect(() => {
    if (isOpen) {
      return;
    }

    const footer = document.querySelector("footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsButtonVisible(false);
          } else {
            setIsButtonVisible(true);
          }
        });
      },
      {
        threshold: 0,
        rootMargin: "0px 0px 0px 0px",
      },
    );

    observer.observe(footer);

    return () => {
      observer.disconnect();
    };
  }, [isOpen]);

  const initConversation = async () => {
    try {
      // Use crypto.randomUUID for secure visitor ID generation
      const visitorId = localStorage.getItem("visitor_id") || crypto.randomUUID();
      localStorage.setItem("visitor_id", visitorId);

      // Collect metadata
      const pageUrl = window.location.href;
      const referrer = document.referrer || null;
      const userAgentStr = navigator.userAgent;

      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({
          user_id: user?.id || null,
          visitor_id: user ? null : visitorId,
          status: "active",
          flow_id: activeFlow?.id || null,
          page_url: pageUrl,
          referrer: referrer,
          user_agent: userAgentStr,
          last_seen_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      setConversationId(data.id);
    } catch (error) {
      // Silent fail - conversation will be retried on next message
    }
  };

  // Heartbeat to track user presence (every 30 seconds)
  useEffect(() => {
    if (!conversationId || !isOpen) return;

    const updateHeartbeat = async () => {
      await supabase
        .from("chat_conversations")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", conversationId);
    };

    // Initial heartbeat
    updateHeartbeat();

    // Set up interval
    const heartbeatInterval = setInterval(updateHeartbeat, 30000);

    return () => clearInterval(heartbeatInterval);
  }, [conversationId, isOpen]);

  // Check for expired agent requests and notify user
  useEffect(() => {
    if (!conversationId || !hasRequestedAgent) return;

    const checkExpiredRequest = async () => {
      const { data } = await supabase
        .from("chat_agent_requests")
        .select("status, expired_at, notified_user")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.status === "expired" && !data?.notified_user) {
        // Notify user that no agent was available
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Désolé, aucun conseiller n'est disponible pour le moment. Vous pouvez nous contacter via notre formulaire de contact pour être rappelé.",
          },
        ]);

        // Mark as notified
        await supabase
          .from("chat_agent_requests")
          .update({ notified_user: true })
          .eq("conversation_id", conversationId)
          .eq("status", "expired");

        setHasRequestedAgent(false);
      }
    };

    const checkInterval = setInterval(checkExpiredRequest, 10000);
    return () => clearInterval(checkInterval);
  }, [conversationId, hasRequestedAgent]);

  const handleFlowAnswer = async (answer: string, nextNode?: string) => {
    // Don't add to messages yet - let the flow runner handle the navigation
    // We'll save all the conversation when the flow completes
  };

  const handleFlowComplete = async (isQualified: boolean, flowHistory: Array<{ question: string; answer: string }>) => {
    setFlowCompleted(true);
    setShowFlowRunner(false);
    setCurrentFlowNode(null);

    // Save flow responses to conversation
    if (conversationId) {
      await supabase
        .from("chat_conversations")
        .update({ 
          flow_responses: flowHistory,
          status: isQualified ? "qualified" : "completed"
        })
        .eq("id", conversationId);
    }

    // Save flow history as messages
    const flowMessages: Message[] = [];
    flowHistory.forEach(({ question, answer }) => {
      flowMessages.push({ role: "assistant", content: question });
      flowMessages.push({ role: "user", content: answer });
    });

    const completionMessage = isQualified
      ? "Merci pour vos réponses ! Un conseiller va prendre contact avec vous prochainement."
      : "Merci de votre intérêt. N'hésitez pas à consulter nos guides pour plus d'informations.";

    flowMessages.push({ role: "assistant", content: completionMessage });

    setMessages(flowMessages);

    // Save to database
    for (const msg of flowMessages) {
      await saveMessage(msg.content, msg.role === "user" ? "user" : "bot");
    }
  };

  const handleFlowRequestAgent = () => {
    setShowFlowRunner(false);
    setCurrentFlowNode(null);
    requestHumanAgent();
  };

  const handleFlowNodeChange = (node: any) => {
    setCurrentFlowNode(node);
  };

  // Wrapper for flow redirect that includes conversation history handling
  const handleFlowRedirectFromRunner = (flowId: string, conversationHistory: Array<{ question: string; answer: string }>) => {
    handleFlowRedirect(flowId, conversationHistory);
  };

  // Determine visibility based on flow node or flow completion state
  const showTextInput = flowCompleted || (!activeFlow && messages.length > 0) || (currentFlowNode?.allow_text_input === true);
  const showAgentButton = flowCompleted || (!activeFlow && messages.length > 0) || (currentFlowNode?.allow_agent_button === true);

  const saveMessage = async (content: string, senderType: "user" | "bot" | "agent") => {
    if (!conversationId) return;

    try {
      await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        sender_type: senderType,
        content: content,
      });
    } catch {
      // Silent fail - message save is not critical for UX
    }
  };

  const requestHumanAgent = async () => {
    if (!conversationId || hasRequestedAgent) return;

    try {
      const { data: existing } = await supabase
        .from("chat_agent_requests")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("status", "pending")
        .single();

      if (existing) {
        toast({
          title: "Demande déjà envoyée",
          description: "Un agent va vous répondre dans quelques instants.",
        });
        return;
      }

      await supabase.from("chat_conversations").update({ status: "awaiting_agent" }).eq("id", conversationId);

      await supabase.from("chat_agent_requests").insert({
        conversation_id: conversationId,
        status: "pending",
      });

      setHasRequestedAgent(true);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Votre demande a été transmise à un agent humain. Vous serez contacté dans quelques instants.",
        },
      ]);

      toast({
        title: "Demande envoyée",
        description: "Un agent va bientôt rejoindre la conversation.",
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de contacter un agent pour le moment.",
        variant: "destructive",
      });
    }
  };

  const streamChat = async (userMessage: string) => {
    if (agentConnected) {
      await saveMessage(userMessage, "user");
      return;
    }

    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    await saveMessage(userMessage, "user");

    let assistantContent = "";

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-bot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

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
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) assistantContent += content;
          } catch {
            /* ignore */
          }
        }
      }

      await saveMessage(assistantContent, "bot");
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    streamChat(input);
    setInput("");
  };

  // Don't render anything if chatbot is disabled globally
  if (chatbotEnabled === false) {
    return null;
  }

  return (
    <>
      {/* Chatbot button - hidden on certain routes or when globally disabled */}
      {!isOpen && isButtonVisible && !shouldHideChatbot && chatbotEnabled && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-0 group hover:scale-105 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4"
          aria-label="Ouvrir le chatbot"
        >
          <div className="h-12 w-12 rounded-full bg-blue-900 flex items-center justify-center shadow-[0_8px_30px_rgb(30,64,175,0.3)] z-10 group-hover:bg-blue-800 group-hover:shadow-[0_12px_40px_rgb(30,64,175,0.4)] transition-all duration-300">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div className="bg-white border-2 border-blue-900 rounded-full pl-7 pr-4 py-2.5 -ml-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] group-hover:shadow-[0_6px_25px_rgba(0,0,0,0.12)] transition-all duration-300">
            <span className="text-blue-900 font-semibold text-sm whitespace-nowrap tracking-wide">
              Assistance en ligne
            </span>
          </div>
        </button>
      )}

      {/* Chatbot window */}
      {isOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 w-[calc(100vw-3rem)] max-w-96 h-[500px] bg-background border border-border rounded-lg shadow-2xl flex flex-col z-50 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-blue-900 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Assistant Prime Énergies</h3>
                <p className="text-xs opacity-90">{agentConnected ? "Agent connecté" : "En ligne"}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="hover:bg-white/20 text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {/* Show flow runner if active and not completed */}
            {activeFlow && showFlowRunner && !flowCompleted && (
              <div>
                <div className="text-center text-muted-foreground py-2 mb-2">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                </div>
                <ChatbotFlowRunner
                  flowStructure={activeFlow.tree_structure}
                  onAnswer={handleFlowAnswer}
                  onRequestAgent={handleFlowRequestAgent}
                  onComplete={handleFlowComplete}
                  onNodeChange={handleFlowNodeChange}
                  onFlowRedirect={handleFlowRedirectFromRunner}
                />
              </div>
            )}

            {/* Show messages only when flow is completed or not available */}
            {(!showFlowRunner || flowCompleted || !activeFlow) && (
              <>
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-2">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Bonjour ! Comment puis-je vous aider aujourd'hui ?</p>
                  </div>
                )}
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role !== "user" && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-blue-100 dark:bg-blue-900">
                            {msg.role === "agent" ? (
                              <User className="h-4 w-4 text-blue-900 dark:text-blue-100" />
                            ) : (
                              <Bot className="h-4 w-4 text-blue-900 dark:text-blue-100" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.role === "user" ? "bg-blue-900 text-white ml-auto" : "bg-muted text-foreground"
                        }`}
                      >
                        {msg.role === "agent" && msg.senderName && (
                          <div className="text-xs font-semibold mb-1 flex items-center gap-1">{msg.senderName}</div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {isLoading && (
              <div className="flex gap-2 justify-start mt-4">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900">
                    <Bot className="h-4 w-4 text-blue-900 dark:text-blue-100" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-blue-900 dark:bg-blue-100 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-blue-900 dark:bg-blue-100 rounded-full animate-bounce delay-100" />
                    <span className="w-2 h-2 bg-blue-900 dark:bg-blue-100 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}

            {showAgentButton && !agentConnected && !hasRequestedAgent && (
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={requestHumanAgent} className="w-full gap-2 text-xs">
                  <UserCog className="h-3 w-3" />
                  Parler à un agent humain
                </Button>
              </div>
            )}
          </ScrollArea>

          {/* Input - only show when allowed */}
          {showTextInput && (
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
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="bg-blue-900 hover:bg-blue-800"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
};
