"use client"

import * as React from "react"
import { Bot } from "@/lib/api-session"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, FileText, Globe, Link as LinkIcon, Loader2, MessageSquareText, Plus, Upload, X, Bot as BotIcon, Settings2, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CreateAgentDialog } from "@/components/dashboard/create-agent-dialog"

type FaqDraft = { question: string; answer: string }

interface DataSourceManagerProps {
  bots: Bot[]
  selectedBotId: string
  onSelectedBotIdChange: (value: string) => void
  loading: boolean
  actionLoading: boolean
  file: File | null
  onFileChange: (file: File | null) => void
  onFileUpload: () => void
  url: string
  onUrlChange: (value: string) => void
  onUrlSubmit: (e: React.FormEvent) => void
  faqName: string
  onFaqNameChange: (value: string) => void
  faqs: FaqDraft[]
  onFaqSubmit: (e: React.FormEvent) => void
  onAddFaqField: () => void
  onRemoveFaqField: (index: number) => void
  onUpdateFaqField: (index: number, field: "question" | "answer", value: string) => void
  onAgentCreated?: () => void
}

export function DataSourceManager({
  bots,
  selectedBotId,
  onSelectedBotIdChange,
  loading,
  actionLoading,
  file,
  onFileChange,
  onFileUpload,
  url,
  onUrlChange,
  onUrlSubmit,
  faqName,
  onFaqNameChange,
  faqs,
  onFaqSubmit,
  onAddFaqField,
  onRemoveFaqField,
  onUpdateFaqField,
  onAgentCreated,
}: DataSourceManagerProps) {
  const router = useRouter()
  const selectedBot = bots.find(b => b.id === selectedBotId)
  const [isDataModalOpen, setIsDataModalOpen] = React.useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Choose Chatbot Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="rounded-none gap-2 h-10 px-4 border-border/50 bg-background hover:bg-muted/50 transition-all shadow-sm"
          >
            <BotIcon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {selectedBot ? selectedBot.name : "Select Chatbot"}
            </span>
            <ChevronDown className="h-3 w-3 ml-1 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px] rounded-none">
          {bots.length === 0 ? (
            <div className="p-2 text-xs text-muted-foreground">No agents found</div>
          ) : (
            bots.map((bot) => (
              <DropdownMenuItem
                key={bot.id}
                className="rounded-none cursor-pointer"
                onClick={() => onSelectedBotIdChange(bot.id)}
              >
                {bot.name}
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator className="bg-border/50" />
          <DropdownMenuItem
            className="rounded-none cursor-pointer font-bold text-primary hover:text-primary-foreground hover:bg-primary transition-colors flex items-center gap-2"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Create Chatbot Agent
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateAgentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        showTrigger={false}
        onSuccess={() => {
          if (onAgentCreated) onAgentCreated();
        }}
      />

      {/* Add New Data Button & Modal */}
      <Dialog open={isDataModalOpen} onOpenChange={setIsDataModalOpen}>
        <DialogTrigger asChild>
          <Button
            className="rounded-none gap-2 h-10 px-4 font-semibold shadow-sm"
            disabled={!selectedBotId}
          >
            <Plus className="h-4 w-4" />
            Add New Data
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] rounded-none border-border/50 overflow-hidden p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold">Add Data Source</DialogTitle>
            <DialogDescription>
              Upload documents or sync external resources to train {selectedBot?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 pt-4">
            <Tabs defaultValue="pdf" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-none bg-muted/50 p-1">
                <TabsTrigger value="pdf" className="rounded-none gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <FileText className="h-4 w-4" />
                  PDF
                </TabsTrigger>
                <TabsTrigger value="url" className="rounded-none gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Globe className="h-4 w-4" />
                  URL
                </TabsTrigger>
                <TabsTrigger value="faq" className="rounded-none gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <MessageSquareText className="h-4 w-4" />
                  Text/FAQ
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pdf" className="mt-6 space-y-4">
                <div className="grid gap-3">
                  <Label htmlFor="pdf-upload" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Upload PDF Document</Label>
                  <div className="border-2 border-dashed border-border/60 p-10 text-center bg-muted/10 hover:bg-muted/20 transition-all cursor-pointer relative group">
                    <input
                      id="pdf-upload"
                      type="file"
                      accept=".pdf"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-primary/5 text-primary rounded-full group-hover:scale-110 transition-transform">
                        <Upload className="h-10 w-10" />
                      </div>
                      {file ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-primary">{file.name}</span>
                          <span className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm font-semibold">Click to upload or drag & drop</span>
                          <span className="text-xs text-muted-foreground">Processed PDF files up to 10MB</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full h-12 rounded-none font-bold uppercase tracking-widest text-xs"
                  disabled={!file || actionLoading}
                  onClick={async () => {
                    await onFileUpload();
                    if (!actionLoading) setIsDataModalOpen(false);
                  }}
                >
                  {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Process Document
                </Button>
              </TabsContent>

              <TabsContent value="url" className="mt-6 space-y-4">
                <form onSubmit={async (e) => {
                  await onUrlSubmit(e);
                  if (!actionLoading) setIsDataModalOpen(false);
                }} className="space-y-4">
                  <div className="grid gap-3">
                    <Label htmlFor="website-url" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Website URL</Label>
                    <Input
                      id="website-url"
                      placeholder="https://example.com/docs"
                      className="rounded-none h-12 bg-muted/10"
                      value={url}
                      onChange={(e) => onUrlChange(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-none font-bold uppercase tracking-widest text-xs" disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                    Sync Website
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="faq" className="mt-6 space-y-6">
                <div className="grid gap-3">
                  <Label htmlFor="faq-name" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Source Identity</Label>
                  <Input
                    id="faq-name"
                    placeholder="e.g. FAQ v1"
                    className="rounded-none h-12 bg-muted/10"
                    value={faqName}
                    onChange={(e) => onFaqNameChange(e.target.value)}
                  />
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Questions & Answers</Label>
                  </div>
                  {faqs.map((faq, index) => (
                    <div key={index} className="p-4 border border-border/50 bg-muted/10 space-y-3 relative group transition-colors hover:bg-muted/20">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onRemoveFaqField(index)}
                        disabled={faqs.length === 1}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <Input
                        placeholder="Question"
                        className="rounded-none bg-background focus:ring-1 focus:ring-primary/30"
                        value={faq.question}
                        onChange={(e) => onUpdateFaqField(index, "question", e.target.value)}
                      />
                      <Input
                        placeholder="Answer"
                        className="rounded-none bg-background focus:ring-1 focus:ring-primary/30"
                        value={faq.answer}
                        onChange={(e) => onUpdateFaqField(index, "answer", e.target.value)}
                      />
                    </div>
                  ))}
                  <Button variant="outline" type="button" className="w-full rounded-none border-dashed h-10 text-xs font-semibold hover:bg-muted/50" onClick={onAddFaqField}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Question
                  </Button>
                </div>
                <Button
                  className="w-full h-12 rounded-none font-bold uppercase tracking-widest text-xs"
                  disabled={actionLoading}
                  onClick={async (e) => {
                    await onFaqSubmit(e);
                    if (!actionLoading) setIsDataModalOpen(false);
                  }}
                >
                  {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Save All FAQs
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}