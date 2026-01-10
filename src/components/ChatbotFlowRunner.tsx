import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle, 
  GitBranch, 
  Home, 
  Wallet, 
  Phone, 
  HelpCircle,
  type LucideIcon 
} from "lucide-react";

// Icon mapping based on keywords in option labels
const getOptionIcon = (label: string): LucideIcon | null => {
  const lowerLabel = label.toLowerCase();
  
  if (lowerLabel.includes("projet") || lowerLabel.includes("subvention")) {
    return Home;
  }
  if (lowerLabel.includes("aide") || lowerLabel.includes("comprendre") || lowerLabel.includes("démarche")) {
    return Wallet;
  }
  if (lowerLabel.includes("contact") || lowerLabel.includes("prime")) {
    return Phone;
  }
  if (lowerLabel.includes("sais pas") || lowerLabel.includes("encore") || lowerLabel.includes("?")) {
    return HelpCircle;
  }
  
  return null;
};

type FlowNode = {
  type: "question" | "end" | "agent_handoff" | "flow_redirect";
  question?: string;
  answer_type?: "buttons" | "text";
  options?: Array<{ label: string; next_node: string; redirect_flow_id?: string }>;
  message?: string;
  is_qualified?: boolean;
  allow_text_input?: boolean;
  allow_agent_button?: boolean;
  redirect_flow_id?: string;
};

type FlowStructure = {
  start_node: string;
  nodes: { [key: string]: FlowNode };
};

type ChatbotFlowRunnerProps = {
  flowStructure: FlowStructure;
  onAnswer: (answer: string, nextNode?: string) => void;
  onRequestAgent?: () => void;
  onComplete?: (isQualified: boolean, conversationHistory: Array<{ question: string; answer: string }>) => void;
  onNodeChange?: (node: FlowNode | null) => void;
  onFlowRedirect?: (flowId: string, conversationHistory: Array<{ question: string; answer: string }>) => void;
};

export const ChatbotFlowRunner = ({
  flowStructure,
  onAnswer,
  onRequestAgent,
  onComplete,
  onNodeChange,
  onFlowRedirect,
}: ChatbotFlowRunnerProps) => {
  const [currentNodeId, setCurrentNodeId] = useState<string>(flowStructure.start_node);
  const [textAnswer, setTextAnswer] = useState("");
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ question: string; answer: string }>
  >([]);

  const currentNode = flowStructure.nodes[currentNodeId];

  useEffect(() => {
    // Reset when flow structure changes
    setCurrentNodeId(flowStructure.start_node);
    setConversationHistory([]);
  }, [flowStructure]);

  // Notify parent when current node changes
  useEffect(() => {
    if (onNodeChange) {
      onNodeChange(currentNode || null);
    }
  }, [currentNode, onNodeChange]);

  // Handle flow_redirect type automatically
  useEffect(() => {
    if (currentNode?.type === "flow_redirect" && currentNode.redirect_flow_id && onFlowRedirect) {
      onFlowRedirect(currentNode.redirect_flow_id, conversationHistory);
    }
  }, [currentNode, conversationHistory, onFlowRedirect]);

  const handleButtonClick = (option: { label: string; next_node: string; redirect_flow_id?: string }) => {
    // Save to conversation history
    const newHistory = [
      ...conversationHistory,
      {
        question: currentNode.question || "",
        answer: option.label,
      },
    ];
    setConversationHistory(newHistory);

    // Notify parent
    onAnswer(option.label, option.next_node);

    // Check if this option redirects to another flow
    if (option.redirect_flow_id && onFlowRedirect) {
      onFlowRedirect(option.redirect_flow_id, newHistory);
      return;
    }

    // Navigate to next node
    if (option.next_node && flowStructure.nodes[option.next_node]) {
      setCurrentNodeId(option.next_node);
    } else {
      console.error("Next node not found:", option.next_node);
    }
  };

  const handleTextSubmit = () => {
    if (!textAnswer.trim()) return;

    // Save to conversation history
    setConversationHistory((prev) => [
      ...prev,
      {
        question: currentNode.question || "",
        answer: textAnswer,
      },
    ]);

    // Notify parent
    onAnswer(textAnswer);

    // For text questions, we need a next_node in the node itself
    const nextNodeId = (currentNode as any).next_node;
    if (nextNodeId && flowStructure.nodes[nextNodeId]) {
      setCurrentNodeId(nextNodeId);
    }

    setTextAnswer("");
  };

  const handleAgentRequest = () => {
    if (onRequestAgent) {
      onRequestAgent();
    }
  };

  const handleEnd = () => {
    if (onComplete && currentNode.type === "end") {
      onComplete(currentNode.is_qualified ?? false, conversationHistory);
    }
  };

  if (!currentNode) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          Configuration du parcours incomplète. Veuillez vérifier les nœuds.
        </p>
      </div>
    );
  }

  // Flow redirect node (should be handled automatically, but show loading)
  if (currentNode.type === "flow_redirect") {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <GitBranch className="w-12 h-12 text-amber-500 mb-4 animate-pulse" />
        <p className="text-muted-foreground">
          Redirection vers un autre parcours...
        </p>
      </div>
    );
  }

  // End node
  if (currentNode.type === "end") {
    return (
      <div className="flex flex-col gap-4 p-4">
      <div className="bg-blue-900/10 dark:bg-blue-100/10 border border-blue-900/20 dark:border-blue-100/20 rounded-xl px-5 py-4">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 text-center">{currentNode.message}</p>
        </div>
        {onComplete && (
          <Button onClick={handleEnd} className="w-full">
            Terminer
          </Button>
        )}
      </div>
    );
  }

  // Agent handoff node
  if (currentNode.type === "agent_handoff") {
    return (
      <div className="flex flex-col gap-4 p-4">
      <div className="bg-blue-900/10 dark:bg-blue-100/10 border border-blue-900/20 dark:border-blue-100/20 rounded-xl px-5 py-4">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 text-center">{currentNode.message}</p>
        </div>
        {onRequestAgent && (
          <Button onClick={handleAgentRequest} className="w-full">
            Parler à un conseiller
          </Button>
        )}
      </div>
    );
  }

  // Question node
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-blue-900/10 dark:bg-blue-100/10 border border-blue-900/20 dark:border-blue-100/20 rounded-xl px-5 py-4">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 text-center leading-relaxed">{currentNode.question}</p>
      </div>

      {currentNode.answer_type === "buttons" && currentNode.options ? (
        <div className="flex flex-col gap-2 mt-2">
          {currentNode.options.map((option, index) => {
            const Icon = getOptionIcon(option.label);
            return (
              <Button
                key={index}
                onClick={() => handleButtonClick(option)}
                variant="outline"
                className="w-full justify-center text-center whitespace-normal h-auto py-3 px-4 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-foreground font-normal gap-2.5"
              >
                {Icon && (
                  <Icon className="h-4 w-4 text-blue-900 dark:text-blue-100 flex-shrink-0" />
                )}
                {option.label}
              </Button>
            );
          })}
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            placeholder="Votre réponse..."
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleTextSubmit();
              }
            }}
          />
          <Button onClick={handleTextSubmit}>Envoyer</Button>
        </div>
      )}
    </div>
  );
};
