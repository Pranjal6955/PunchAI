"use client";

import { useState } from "react";
import { useRouter as _useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBot } from "@/lib/api-session";

const PERSONA_TEMPLATES = [
  {
    label: "Custom Agent",
    value: "Describe your agent&apos;s personality and purpose.",
  },
  {
    label: "Helpful Assistant",
    value:
      "You are a helpful, friendly, and concise AI assistant. Your goal is to provide accurate information and assist the user with their queries in a professional manner.",
  },
  {
    label: "Technical Expert",
    value:
      "You are an expert software engineer and technical consultant. Provide deep technical insights, code examples, and architectural advice. Be precise and thorough.",
  },
  {
    label: "Customer Support",
    value:
      "You are a highly empathetic customer support representative. Aim to resolve issues with patience and clarity. Always be polite and offer to help further.",
  },
  {
    label: "Creative Writer",
    value:
      "You are a versatile creative writer. Help the user brainstorm ideas, write stories, poems, or marketing copy. Use vivid language and be highly imaginative.",
  },
  {
    label: "Data Analyst",
    value:
      "You are a data science expert. Help users interpret data, write SQL queries, and explain statistical concepts in simple terms.",
  },
];

interface CreateAgentDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  showTrigger?: boolean;
}

export function CreateAgentDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
  showTrigger = true,
}: CreateAgentDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    botPersona: "",
  });

  const handlePersonaSelect = (value: string) => {
    setFormData({ ...formData, botPersona: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Agent name is required");
      return;
    }

    setLoading(true);
    try {
      const bot = await createBot(formData);
      if (bot) {
        toast.success("Agent created successfully");
        setOpen(false);
        setFormData({
          name: "",
          description: "",
          botPersona: "",
        });
        if (onSuccess) onSuccess();
      } else {
        toast.error("Failed to create agent");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button className="rounded-none">
            <Plus className="mr-2 h-4 w-4" />
            Create Chatbot
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="border-border/60 rounded-none sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold tracking-tight">
              Create New Agent
            </DialogTitle>
            <DialogDescription>
              Configure your AI agent&apos;s personality and purpose.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Agent Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Support Bot"
                  className="border-border/60 rounded-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="persona-template" className="text-sm font-medium">
                  Persona Template
                </Label>
                <Select onValueChange={handlePersonaSelect}>
                  <SelectTrigger id="persona-template" className="border-border/60 rounded-none">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {PERSONA_TEMPLATES.map((t) => (
                      <SelectItem key={t.label} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description (Optional)
              </Label>
              <Input
                id="description"
                placeholder="What does this agent do?"
                className="border-border/60 rounded-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="persona" className="text-sm font-medium">
                System Prompt / Persona
              </Label>
              <Textarea
                id="persona"
                placeholder="Define how the agent should behave..."
                className="border-border/60 min-h-[150px] resize-none rounded-none"
                value={formData.botPersona}
                onChange={(e) => setFormData({ ...formData, botPersona: e.target.value })}
              />
              <p className="text-muted-foreground text-xs">
                Select a template above or write your own custom prompt.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-none"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="min-w-[100px] rounded-none" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Agent"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
