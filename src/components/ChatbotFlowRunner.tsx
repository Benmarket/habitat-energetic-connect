import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  MessageCircle, 
  GitBranch, 
  Home, 
  Wallet, 
  Phone, 
  HelpCircle,
  RotateCcw,
  Flame,
  Sun,
  Layers,
  PhoneCall,
  Mail,
  Headphones,
  BookOpen,
  Wrench,
  type LucideIcon 
} from "lucide-react";
// Icon mapping based on keywords in option labels
const getOptionIcon = (label: string): LucideIcon | null => {
  const lowerLabel = label.toLowerCase();
  
  // Check "sais pas" / "encore" / uncertainty FIRST (before "projet" check)
  if (lowerLabel.includes("sais pas") || lowerLabel.includes("ne sait pas") || lowerLabel.includes("?")) {
    return HelpCircle;
  }
  
  // Contact options - specific ones first
  if (lowerLabel.includes("rappelé") || lowerLabel.includes("rappel")) {
    return PhoneCall;
  }
  if (lowerLabel.includes("coordonnées") || lowerLabel.includes("mail") || lowerLabel.includes("téléphone")) {
    return Mail;
  }
  if (lowerLabel.includes("agent") || lowerLabel.includes("parler")) {
    return Headphones;
  }
  
  // Specific project types
  if (lowerLabel.includes("isolation")) {
    return Layers;
  }
  if (lowerLabel.includes("chauffage") || lowerLabel.includes("pompe à chaleur")) {
    return Flame;
  }
  if (lowerLabel.includes("solaire") || lowerLabel.includes("panneaux")) {
    return Sun;
  }
  
  // General categories
  if (lowerLabel.includes("projet") || lowerLabel.includes("subvention")) {
    return Home;
  }
  if (lowerLabel.includes("aide") || lowerLabel.includes("comprendre") || lowerLabel.includes("démarche")) {
    return Wallet;
  }
  if (lowerLabel.includes("guide") || lowerLabel.includes("lire")) {
    return BookOpen;
  }
  if (lowerLabel.includes("installateur")) {
    return Wrench;
  }
  if (lowerLabel.includes("contact") || lowerLabel.includes("prime")) {
    return Phone;
  }
  
  return null;
};

type FormField = {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
};

type FlowNode = {
  type: "question" | "end" | "agent_handoff" | "flow_redirect";
  question?: string;
  answer_type?: "buttons" | "text" | "form";
  options?: Array<{ label: string; next_node: string; redirect_flow_id?: string }>;
  fields?: FormField[];
  message?: string;
  is_qualified?: boolean;
  allow_text_input?: boolean;
  allow_agent_button?: boolean;
  redirect_flow_id?: string;
  redirect_url?: string;
  save_as_lead?: boolean;
  next_node?: string;
};

type FlowStructure = {
  start_node: string;
  nodes: { [key: string]: FlowNode };
};

type EndSettings = {
  showAgentButton: boolean;
  showTextInput: boolean;
  showRestartButton: boolean;
};

type ChatbotFlowRunnerProps = {
  flowStructure: FlowStructure;
  onAnswer: (answer: string, nextNode?: string) => void;
  onRequestAgent?: () => void;
  onComplete?: (isQualified: boolean, conversationHistory: Array<{ question: string; answer: string }>, collectedData?: Record<string, string>) => void;
  onNodeChange?: (node: FlowNode | null) => void;
  onFlowRedirect?: (flowId: string, conversationHistory: Array<{ question: string; answer: string }>) => void;
  onRestart?: () => void;
  endSettings?: EndSettings;
};

export const ChatbotFlowRunner = ({
  flowStructure,
  onAnswer,
  onRequestAgent,
  onComplete,
  onNodeChange,
  onFlowRedirect,
  onRestart,
  endSettings = { showAgentButton: true, showTextInput: true, showRestartButton: true },
}: ChatbotFlowRunnerProps) => {
  const [currentNodeId, setCurrentNodeId] = useState<string>(flowStructure.start_node);
  const [textAnswer, setTextAnswer] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [collectedData, setCollectedData] = useState<Record<string, string>>({});
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ question: string; answer: string }>
  >([]);

  const currentNode = flowStructure.nodes[currentNodeId];

  useEffect(() => {
    // Reset when flow structure changes
    setCurrentNodeId(flowStructure.start_node);
    setConversationHistory([]);
    setCollectedData({});
    setFormData({});
  }, [flowStructure]);

  // Reset form data when node changes
  useEffect(() => {
    setFormData({});
    setTextAnswer("");
  }, [currentNodeId]);

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

  // Auto-trigger completion when reaching an end node
  useEffect(() => {
    if (currentNode?.type === "end" && onComplete) {
      onComplete(currentNode.is_qualified ?? false, conversationHistory, collectedData);
    }
  }, [currentNodeId]);

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

    // Save button answer to collectedData (useful for project type, etc.)
    if (currentNode.question) {
      const questionKey = currentNode.question.toLowerCase();
      if (questionKey.includes("type de projet")) {
        setCollectedData(prev => ({ ...prev, project_type: option.label }));
      }
    }

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

    // Collect text data (e.g. postal_code from node_3)
    const updatedCollected = { ...collectedData, postal_code: textAnswer.trim() };
    setCollectedData(updatedCollected);

    // Save to conversation history
    setConversationHistory((prev) => [
      ...prev,
      {
        question: currentNode.question || "",
        answer: textAnswer,
      },
    ]);

    onAnswer(textAnswer);

    const nextNodeId = currentNode.next_node;
    if (nextNodeId && flowStructure.nodes[nextNodeId]) {
      setCurrentNodeId(nextNodeId);
    }

    setTextAnswer("");
  };

  const handleFormSubmit = () => {
    if (!currentNode.fields) return;
    
    // Validate required fields
    for (const field of currentNode.fields) {
      if (field.required && !formData[field.name]?.trim()) {
        return;
      }
      // Validate email format
      if (field.name === "email" && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.name])) {
          return;
        }
      }
      // Validate postal code: numeric only, 2-5 digits
      if (field.name === "postal_code" && formData[field.name]) {
        const val = formData[field.name].trim();
        if (!/^\d{2,5}$/.test(val)) {
          return;
        }
      }
    }

    // Merge form data into collected data
    const updatedCollected = { ...collectedData, ...formData };
    setCollectedData(updatedCollected);

    // Build answer summary for history
    const answerParts = currentNode.fields.map(f => `${f.label}: ${formData[f.name] || ""}`);
    const answerSummary = answerParts.join(", ");

    setConversationHistory((prev) => [
      ...prev,
      {
        question: currentNode.question || "",
        answer: answerSummary,
      },
    ]);

    onAnswer(answerSummary);

    const nextNodeId = currentNode.next_node;
    if (nextNodeId && flowStructure.nodes[nextNodeId]) {
      setCurrentNodeId(nextNodeId);
    }
  };

  const handleAgentRequest = () => {
    if (onRequestAgent) {
      onRequestAgent();
    }
  };

  const handleEnd = () => {
    if (onComplete && currentNode.type === "end") {
      onComplete(currentNode.is_qualified ?? false, conversationHistory, collectedData);
    }
  };

  if (!currentNode) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
        <MessageCircle className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">
          Configuration du parcours incomplète. Veuillez vérifier les nœuds.
        </p>
        {onRestart && endSettings.showRestartButton && (
          <Button 
            onClick={onRestart} 
            variant="outline" 
            className="gap-2 border-blue-900/30 text-blue-900 hover:bg-blue-900/5 dark:border-blue-100/30 dark:text-blue-100 dark:hover:bg-blue-100/5"
          >
            <RotateCcw className="h-4 w-4" />
            Nouveau chat
          </Button>
        )}
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
    <div className="flex flex-col gap-4 px-1">
      <div className="bg-blue-900/10 dark:bg-blue-100/10 border border-blue-900/20 dark:border-blue-100/20 rounded-xl px-4 py-3 flex items-center gap-2">
        <MessageCircle className="h-3.5 w-3.5 text-blue-900/40 dark:text-blue-100/40 flex-shrink-0" />
        <p className="text-[13px] font-semibold text-blue-900 dark:text-blue-100 leading-snug">{currentNode.question}</p>
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
      ) : currentNode.answer_type === "form" && currentNode.fields ? (
        <div className="flex flex-col gap-3 mt-2">
          {currentNode.fields.map((field) => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <Label htmlFor={field.name} className="text-xs font-medium text-muted-foreground">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id={field.name}
                type={field.name === "email" ? "email" : field.name === "phone" ? "tel" : field.type || "text"}
                inputMode={field.name === "postal_code" ? "numeric" : undefined}
                maxLength={field.name === "postal_code" ? 5 : undefined}
                value={formData[field.name] || ""}
                onChange={(e) => {
                  let val = e.target.value;
                  if (field.name === "phone") {
                    val = val.replace(/[^\d+\s()-]/g, "").slice(0, 15);
                  }
                  if (field.name === "postal_code") {
                    val = val.replace(/\D/g, "").slice(0, 5);
                  }
                  setFormData(prev => ({ ...prev, [field.name]: val }));
                }}
                placeholder={field.placeholder || ""}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleFormSubmit();
                  }
                }}
              />
            </div>
          ))}
          <Button 
            onClick={handleFormSubmit} 
            className="w-full mt-1"
            disabled={currentNode.fields.some(f => {
              if (f.required && !formData[f.name]?.trim()) return true;
              if (f.name === "email" && formData[f.name] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[f.name])) return true;
              if (f.name === "postal_code" && formData[f.name] && !/^\d{2,5}$/.test(formData[f.name].trim())) return true;
              if (f.name === "postal_code" && f.required && (!formData[f.name] || formData[f.name].trim().length < 2)) return true;
              return false;
            })}
          >
            Valider
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={textAnswer}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 5);
              setTextAnswer(val);
            }}
            placeholder="Ex: 75016"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={5}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleTextSubmit();
              }
            }}
          />
          <Button onClick={handleTextSubmit} disabled={textAnswer.length < 2}>Envoyer</Button>
        </div>
      )}
    </div>
  );
};
