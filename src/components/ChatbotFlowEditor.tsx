import { useCallback, useState, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Plus, MessageCircle, StopCircle, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

type NodeType = "question" | "end" | "agent_handoff";

type FlowNodeData = {
  label: string;
  type: NodeType;
  question?: string;
  answer_type?: "buttons" | "text";
  options?: Array<{ label: string; next_node: string }>;
  message?: string;
  is_qualified?: boolean;
  allow_text_input?: boolean;
  allow_agent_button?: boolean;
};

type ChatbotFlowEditorProps = {
  initialStructure?: any;
  onSave: (structure: any) => void;
};

const nodeTypes = {
  question: { color: "#8b5cf6", icon: MessageCircle },
  end: { color: "#ef4444", icon: StopCircle },
  agent_handoff: { color: "#10b981", icon: UserPlus },
};

export const ChatbotFlowEditor = ({ initialStructure, onSave }: ChatbotFlowEditorProps) => {
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [editForm, setEditForm] = useState<FlowNodeData>({
    label: "",
    type: "question",
    question: "",
    answer_type: "buttons",
    options: [{ label: "", next_node: "" }],
    message: "",
    is_qualified: true,
    allow_text_input: false,
    allow_agent_button: false,
  });

  // Load from initial structure on mount or when it changes
  useEffect(() => {
    if (initialStructure && initialStructure.nodes) {
      loadFromStructure(initialStructure);
    }
  }, [initialStructure]);

  // Initialize from structure
  const loadFromStructure = useCallback((structure: any) => {
    if (!structure || !structure.nodes) return;

    const loadedNodes: Node[] = [];
    const loadedEdges: Edge[] = [];
    const nodeEntries = Object.entries(structure.nodes);

    nodeEntries.forEach(([nodeId, nodeData]: [string, any], index) => {
      const nodeType = nodeData.type || "question";
      const config = nodeTypes[nodeType as NodeType];

      loadedNodes.push({
        id: nodeId,
        type: "default",
        position: { x: 100 + (index % 3) * 300, y: 100 + Math.floor(index / 3) * 200 },
        data: {
          label: (
            <div className="flex items-center gap-2">
              {config?.icon && <config.icon className="w-4 h-4" />}
              <span className="font-medium text-sm">
                {nodeData.question || nodeData.message || nodeId}
              </span>
            </div>
          ),
          ...nodeData,
        },
        style: {
          background: config?.color || "#8b5cf6",
          color: "white",
          border: "2px solid white",
          borderRadius: "8px",
          padding: "10px",
          minWidth: "200px",
        },
      });

      // Create edges from options
      if (nodeData.options) {
        nodeData.options.forEach((option: any, optionIndex: number) => {
          if (option.next_node) {
            loadedEdges.push({
              id: `${nodeId}-${option.next_node}-${optionIndex}`,
              source: nodeId,
              target: option.next_node,
              label: option.label,
              type: "default",
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#8b5cf6",
              },
              style: { stroke: "#8b5cf6", strokeWidth: 2 },
            });
          }
        });
      } else if (nodeData.next_node) {
        loadedEdges.push({
          id: `${nodeId}-${nodeData.next_node}`,
          source: nodeId,
          target: nodeData.next_node,
          type: "default",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#8b5cf6",
          },
          style: { stroke: "#8b5cf6", strokeWidth: 2 },
        });
      }
    });

    setNodes(loadedNodes);
    setEdges(loadedEdges);
  }, [setNodes, setEdges]);

  // Convert flow to structure format
  const convertToStructure = useCallback(() => {
    const structure: any = {
      start_node: nodes.length > 0 ? nodes[0].id : "node_1",
      nodes: {},
    };

    nodes.forEach((node) => {
      const nodeData = node.data as FlowNodeData;
      structure.nodes[node.id] = {
        type: nodeData.type,
        ...(nodeData.question && { question: nodeData.question }),
        ...(nodeData.answer_type && { answer_type: nodeData.answer_type }),
        ...(nodeData.options && { options: nodeData.options }),
        ...(nodeData.message && { message: nodeData.message }),
        ...(nodeData.is_qualified !== undefined && { is_qualified: nodeData.is_qualified }),
        allow_text_input: nodeData.allow_text_input ?? false,
        allow_agent_button: nodeData.allow_agent_button ?? false,
      };
    });

    return structure;
  }, [nodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    const nodeData = node.data as FlowNodeData;
    setEditForm({
      label: typeof node.data.label === "string" ? node.data.label : "",
      type: nodeData.type || "question",
      question: nodeData.question || "",
      answer_type: nodeData.answer_type || "buttons",
      options: nodeData.options || [{ label: "", next_node: "" }],
      message: nodeData.message || "",
      is_qualified: nodeData.is_qualified ?? true,
      allow_text_input: nodeData.allow_text_input ?? false,
      allow_agent_button: nodeData.allow_agent_button ?? false,
    });
    setIsEditModalOpen(true);
  }, []);

  const addNewNode = (type: NodeType) => {
    const newNodeId = `node_${Date.now()}`;
    const config = nodeTypes[type];

    const newNode: Node = {
      id: newNodeId,
      type: "default",
      position: { x: 250, y: 100 + nodes.length * 100 },
      data: {
        label: (
          <div className="flex items-center gap-2">
            <config.icon className="w-4 h-4" />
            <span className="font-medium text-sm">Nouveau nœud</span>
          </div>
        ),
        type,
        question: type === "question" ? "Votre question ici" : undefined,
        answer_type: type === "question" ? "buttons" : undefined,
        options: type === "question" ? [{ label: "Option 1", next_node: "" }] : undefined,
        message: type !== "question" ? "Message ici" : undefined,
        is_qualified: true,
      },
      style: {
        background: config.color,
        color: "white",
        border: "2px solid white",
        borderRadius: "8px",
        padding: "10px",
        minWidth: "200px",
      },
    };

    setNodes((nds) => [...nds, newNode]);
    toast({ title: "Nœud ajouté avec succès" });
  };

  const handleUpdateNode = () => {
    if (!selectedNode) return;

    const config = nodeTypes[editForm.type];
    const updatedNode: Node = {
      ...selectedNode,
      data: {
        label: (
          <div className="flex items-center gap-2">
            <config.icon className="w-4 h-4" />
            <span className="font-medium text-sm">
              {editForm.question || editForm.message || editForm.label}
            </span>
          </div>
        ),
        type: editForm.type,
        question: editForm.question,
        answer_type: editForm.answer_type,
        options: editForm.options,
        message: editForm.message,
        is_qualified: editForm.is_qualified,
        allow_text_input: editForm.allow_text_input,
        allow_agent_button: editForm.allow_agent_button,
      },
      style: {
        ...selectedNode.style,
        background: config.color,
      },
    };

    setNodes((nds) => nds.map((node) => (node.id === selectedNode.id ? updatedNode : node)));

    // Update edges based on options
    if (editForm.type === "question" && editForm.options) {
      const newEdges: Edge[] = [];
      editForm.options.forEach((option, index) => {
        if (option.next_node) {
          newEdges.push({
            id: `${selectedNode.id}-${option.next_node}-${index}`,
            source: selectedNode.id,
            target: option.next_node,
            label: option.label,
            type: "default",
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: config.color,
            },
            style: { stroke: config.color, strokeWidth: 2 },
          });
        }
      });

      // Remove old edges from this node
      setEdges((eds) => [
        ...eds.filter((edge) => edge.source !== selectedNode.id),
        ...newEdges,
      ]);
    }

    setIsEditModalOpen(false);
    setSelectedNode(null);
    toast({ title: "Nœud mis à jour avec succès" });
  };

  const handleSave = () => {
    const structure = convertToStructure();
    onSave(structure);
    toast({ title: "Parcours enregistré" });
  };

  const addOption = () => {
    setEditForm({
      ...editForm,
      options: [...(editForm.options || []), { label: "", next_node: "" }],
    });
  };

  const removeOption = (index: number) => {
    setEditForm({
      ...editForm,
      options: editForm.options?.filter((_, i) => i !== index),
    });
  };

  const updateOption = (index: number, field: "label" | "next_node", value: string) => {
    setEditForm({
      ...editForm,
      options: editForm.options?.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt
      ),
    });
  };

  return (
    <div className="h-[600px] border rounded-lg bg-background">
      <div className="bg-muted/30 border-b p-4 flex gap-2 flex-wrap">
        <Button onClick={() => addNewNode("question")} size="sm" variant="outline">
          <MessageCircle className="w-4 h-4 mr-2" />
          Question
        </Button>
        <Button onClick={() => addNewNode("end")} size="sm" variant="outline">
          <StopCircle className="w-4 h-4 mr-2" />
          Fin
        </Button>
        <Button onClick={() => addNewNode("agent_handoff")} size="sm" variant="outline">
          <UserPlus className="w-4 h-4 mr-2" />
          Agent humain
        </Button>
        <div className="flex-1" />
        <Button onClick={handleSave} variant="default">
          Enregistrer
        </Button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>

      {/* Edit Node Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le nœud</DialogTitle>
            <DialogDescription>
              Configurez les paramètres de ce nœud du parcours
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type de nœud</Label>
              <RadioGroup
                value={editForm.type}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, type: value as NodeType })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="question" id="type-question" />
                  <Label htmlFor="type-question">Question</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="end" id="type-end" />
                  <Label htmlFor="type-end">Fin du parcours</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="agent_handoff" id="type-agent" />
                  <Label htmlFor="type-agent">Transfert agent humain</Label>
                </div>
              </RadioGroup>
            </div>

            {editForm.type === "question" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Textarea
                    id="question"
                    value={editForm.question}
                    onChange={(e) =>
                      setEditForm({ ...editForm, question: e.target.value })
                    }
                    placeholder="Quelle est votre question ?"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Type de réponse</Label>
                  <RadioGroup
                    value={editForm.answer_type}
                    onValueChange={(value) =>
                      setEditForm({ ...editForm, answer_type: value as "buttons" | "text" })
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="buttons" id="answer-buttons" />
                      <Label htmlFor="answer-buttons">Boutons (choix multiples)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="text" id="answer-text" />
                      <Label htmlFor="answer-text">Texte libre</Label>
                    </div>
                  </RadioGroup>
                </div>

                {editForm.answer_type === "buttons" && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Options de réponse</Label>
                      <Button onClick={addOption} size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                    {editForm.options?.map((option, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          placeholder="Texte du bouton"
                          value={option.label}
                          onChange={(e) => updateOption(index, "label", e.target.value)}
                        />
                        <Input
                          placeholder="ID nœud suivant"
                          value={option.next_node}
                          onChange={(e) => updateOption(index, "next_node", e.target.value)}
                        />
                        <Button
                          onClick={() => removeOption(index)}
                          size="sm"
                          variant="destructive"
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {(editForm.type === "end" || editForm.type === "agent_handoff") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={editForm.message}
                    onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                    placeholder="Message à afficher"
                  />
                </div>

                {editForm.type === "end" && (
                  <div className="space-y-2">
                    <Label>Prospect qualifié ?</Label>
                    <RadioGroup
                      value={editForm.is_qualified ? "true" : "false"}
                      onValueChange={(value) =>
                        setEditForm({ ...editForm, is_qualified: value === "true" })
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="qualified-yes" />
                        <Label htmlFor="qualified-yes">Oui (prospect qualifié)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="qualified-no" />
                        <Label htmlFor="qualified-no">Non (non-prospect)</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </>
            )}

            {/* Options d'affichage pour tous les types de nœuds */}
            <div className="space-y-4 pt-4 border-t">
              <Label className="text-sm font-semibold">Options d'affichage</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow_text_input"
                  checked={editForm.allow_text_input ?? false}
                  onCheckedChange={(checked) =>
                    setEditForm({ ...editForm, allow_text_input: !!checked })
                  }
                />
                <Label htmlFor="allow_text_input" className="text-sm font-normal">
                  Afficher la barre de saisie texte libre
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow_agent_button"
                  checked={editForm.allow_agent_button ?? false}
                  onCheckedChange={(checked) =>
                    setEditForm({ ...editForm, allow_agent_button: !!checked })
                  }
                />
                <Label htmlFor="allow_agent_button" className="text-sm font-normal">
                  Afficher le bouton "Parler à un conseiller"
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedNode(null);
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleUpdateNode}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
