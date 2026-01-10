import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle } from "lucide-react";

type FlowNode = {
  type: "question" | "end" | "agent_handoff";
  question?: string;
  answer_type?: "buttons" | "text";
  options?: Array<{ label: string; next_node: string }>;
  message?: string;
  is_qualified?: boolean;
  allow_text_input?: boolean;
  allow_agent_button?: boolean;
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
};

export const ChatbotFlowRunner = ({
  flowStructure,
  onAnswer,
  onRequestAgent,
  onComplete,
  onNodeChange,
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

  const handleButtonClick = (option: { label: string; next_node: string }) => {
    // Save to conversation history
    setConversationHistory((prev) => [
      ...prev,
      {
        question: currentNode.question || "",
        answer: option.label,
      },
    ]);

    // Notify parent
    onAnswer(option.label, option.next_node);

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

  // End node
  if (currentNode.type === "end") {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="bg-muted/30 rounded-lg p-4">
          <p className="text-sm">{currentNode.message}</p>
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
        <div className="bg-muted/30 rounded-lg p-4">
          <p className="text-sm">{currentNode.message}</p>
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
    <div className="flex flex-col gap-4 p-4">
      <div className="bg-muted/30 rounded-lg p-4">
        <p className="text-sm font-medium">{currentNode.question}</p>
      </div>

      {currentNode.answer_type === "buttons" && currentNode.options ? (
        <div className="flex flex-col gap-2">
          {currentNode.options.map((option, index) => (
            <Button
              key={index}
              onClick={() => handleButtonClick(option)}
              variant="outline"
              className="w-full justify-center text-center"
            >
              {option.label}
            </Button>
          ))}
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
