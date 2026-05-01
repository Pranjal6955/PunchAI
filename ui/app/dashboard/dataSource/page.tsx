"use client";

import * as React from "react";
import {
  uploadDataSource,
  addUrlDataSource,
  addFaqDataSource,
  deleteDataSource,
  DataSource,
  getSourceChunks,
  updateChunk,
  listFaqs,
  updateFaq,
  deleteFaq,
  deleteChunk,
  FAQ,
  DocumentChunk,
  Bot,
} from "@/lib/api-session";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { DataSourceManager } from "@/components/dashboard/data-source-manager";
import { ActiveSourcesList } from "@/components/dashboard/active-sources-list";
import { SourceDetailsDialog } from "@/components/dashboard/source-details-dialog";
import { useSearchParams } from "next/navigation";
import { Bot as BotIcon } from "lucide-react";
import { useBots } from "@/hooks/use-bots";
import { useDataSources } from "@/hooks/use-data-sources";
import { CreateAgentDialog } from "@/components/dashboard/create-agent-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function DataSourcesPage() {
  const searchParams = useSearchParams();
  const botIdParam = searchParams.get("botId");
  const queryClient = useQueryClient();

  const { bots, isLoading: botsLoading, mutate: mutateBots } = useBots();
  const [selectedBotId, setSelectedBotId] = React.useState<string>("");
  const { dataSources, isLoading: sourcesLoading, removeDataSource } = useDataSources(selectedBotId);

  const [viewingSource, setViewingSource] = React.useState<DataSource | null>(null);
  const [selectedSourceIds, setSelectedSourceIds] = React.useState<string[]>([]);
  const [isDataModalOpen, setIsDataModalOpen] = React.useState(false);

  // Form states
  const [url, setUrl] = React.useState("");
  const [faqName, setFaqName] = React.useState("");
  const [faqs, setFaqs] = React.useState([{ question: "", answer: "" }]);
  const [file, setFile] = React.useState<File | null>(null);

  // Set default selectedBotId
  React.useEffect(() => {
    const botsArray = bots as Bot[];
    if (botsArray.length > 0) {
      if (botIdParam && botsArray.some((b) => b.id === botIdParam)) {
        setSelectedBotId(botIdParam);
      } else if (!selectedBotId) {
        setSelectedBotId(botsArray[0].id);
      }
    }
  }, [bots, botIdParam, selectedBotId]);

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: () => uploadDataSource(selectedBotId, file!),
    onSuccess: (success) => {
      if (success) {
        toast.success("File uploaded and processed successfully");
        setFile(null);
        queryClient.invalidateQueries({ queryKey: ["data-sources", selectedBotId] });
      }
    },
    onError: () => toast.error("Failed to upload file"),
  });

  const urlMutation = useMutation({
    mutationFn: () => addUrlDataSource(selectedBotId, url),
    onSuccess: (success) => {
      if (success) {
        toast.success("Website synchronized successfully");
        setUrl("");
        queryClient.invalidateQueries({ queryKey: ["data-sources", selectedBotId] });
      }
    },
    onError: () => toast.error("Failed to sync website"),
  });

  const faqMutation = useMutation({
    mutationFn: () => addFaqDataSource(selectedBotId, faqName, faqs),
    onSuccess: (success) => {
      if (success) {
        toast.success("FAQs added successfully");
        setFaqName("");
        setFaqs([{ question: "", answer: "" }]);
        queryClient.invalidateQueries({ queryKey: ["data-sources", selectedBotId] });
      }
    },
    onError: () => toast.error("Failed to add FAQs"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      let successCount = 0;
      for (const id of ids) {
        const success = await deleteDataSource(id);
        if (success) successCount++;
      }
      return successCount;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["data-sources", selectedBotId] });
      setSelectedSourceIds([]);
      toast.success(`Successfully deleted ${count} sources`);
    },
    onError: () => toast.error("An error occurred during bulk deletion"),
  });

  // Source details fetching
  const { data: sourceContent = { chunks: [], faqs: [] }, isLoading: contentLoading } = useQuery({
    queryKey: ["source-content", viewingSource?.id],
    queryFn: async () => {
      if (!viewingSource) return { chunks: [], faqs: [] };
      if (viewingSource.type === "TEXT") {
        const allFaqs = await listFaqs(selectedBotId);
        return { chunks: [], faqs: allFaqs.filter((f) => f.sourceId === viewingSource.id) };
      } else {
        const chunks = await getSourceChunks(viewingSource.id);
        return { chunks, faqs: [] };
      }
    },
    enabled: !!viewingSource,
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ type, id, content }: { type: 'chunk' | 'faq', id: string, content: any }) => {
      if (type === 'chunk') return updateChunk(id, content);
      return updateFaq(id, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["source-content", viewingSource?.id] });
      toast.success("Content updated");
    },
    onError: () => toast.error("Failed to update content"),
  });

  const deleteItemMutation = useMutation({
    mutationFn: async ({ type, id }: { type: 'chunk' | 'faq', id: string }) => {
      if (type === 'chunk') return deleteChunk(id);
      return deleteFaq(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["source-content", viewingSource?.id] });
      toast.success("Segment removed");
    },
    onError: () => toast.error("Failed to delete segment"),
  });

  // Handlers
  const handleFileUpload = async () => {
    if (!selectedBotId || !file) return false;
    await uploadMutation.mutateAsync();
    return true;
  };

  const handleUrlAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBotId || !url) return false;
    await urlMutation.mutateAsync();
    return true;
  };

  const handleFaqAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBotId || !faqName || faqs.some((f) => !f.question || !f.answer)) {
      toast.error("Please fill in all FAQ fields");
      return false;
    }
    await faqMutation.mutateAsync();
    return true;
  };

  const handleDelete = async (dsId: string) => {
    if (!confirm("Are you sure you want to delete this data source?")) return;
    await removeDataSource(dsId);
    setSelectedSourceIds((prev) => prev.filter((id) => id !== dsId));
    if (viewingSource?.id === dsId) setViewingSource(null);
  };

  const handleBulkDelete = async () => {
    if (!selectedSourceIds.length) return;
    if (!confirm(`Are you sure you want to delete ${selectedSourceIds.length} data sources?`)) return;
    await bulkDeleteMutation.mutateAsync(selectedSourceIds);
  };

  const toggleSelectSource = (id: string) => {
    setSelectedSourceIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleSelectAll = (ids: string[]) => {
    setSelectedSourceIds(selectedSourceIds.length === ids.length ? [] : ids);
  };

  const addFaqField = () => setFaqs([...faqs, { question: "", answer: "" }]);
  const removeFaqField = (index: number) => {
    if (faqs.length > 1) setFaqs(faqs.filter((_, i) => i !== index));
  };
  const updateFaqField = (index: number, field: "question" | "answer", value: string) => {
    const newFaqs = [...faqs];
    newFaqs[index][field] = value;
    setFaqs(newFaqs);
  };

  const botsArray = bots as Bot[];

  if (botsLoading && botsArray.length === 0) {
    return (
      <div className="space-y-8 p-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="h-125" />
          <Skeleton className="h-125" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground flex h-full flex-col overflow-hidden">
      <main className="w-full flex-1 space-y-8 overflow-y-auto p-6 lg:p-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Data Sources</h1>
            <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
              Connect your documents, websites, and FAQs to train your AI agents.
            </p>
          </div>
          {botsArray.length > 0 && (
            <div className="shrink-0">
              <DataSourceManager
                bots={botsArray}
                selectedBotId={selectedBotId}
                onSelectedBotIdChange={setSelectedBotId}
                loading={botsLoading}
                actionLoading={uploadMutation.isPending || urlMutation.isPending || faqMutation.isPending}
                file={file}
                onFileChange={setFile}
                onFileUpload={handleFileUpload}
                url={url}
                onUrlChange={setUrl}
                onUrlSubmit={handleUrlAdd}
                faqName={faqName}
                onFaqNameChange={setFaqName}
                faqs={faqs}
                onFaqSubmit={handleFaqAdd}
                onAddFaqField={addFaqField}
                onRemoveFaqField={removeFaqField}
                onUpdateFaqField={updateFaqField}
                onAgentCreated={() => { void mutateBots(); }}
                isDataModalOpen={isDataModalOpen}
                setIsDataModalOpen={setIsDataModalOpen}
                hasDataSources={dataSources.length > 0}
              />
            </div>
          )}
        </div>

        {botsArray.length === 0 ? (
          <div className="border-border/40 bg-muted/5 flex min-h-[400px] flex-col items-center justify-center border-2 border-dashed p-12">
            <div className="bg-primary/10 mb-6 flex size-20 items-center justify-center">
              <BotIcon className="text-primary size-10" />
            </div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight uppercase">No Chatbots Detected</h2>
            <p className="text-muted-foreground mb-8 max-w-md text-center">You need to create at least one chatbot agent before you can connect data sources.</p>
            <CreateAgentDialog onSuccess={() => { void mutateBots(); }} />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <div className="flex-1">
              <ActiveSourcesList
                dataSources={dataSources}
                sourcesLoading={sourcesLoading}
                onViewDetails={setViewingSource}
                onDelete={handleDelete}
                onAddSource={() => setIsDataModalOpen(true)}
                selectedIds={selectedSourceIds}
                onSelect={toggleSelectSource}
                onSelectAll={handleSelectAll}
                onBulkDelete={handleBulkDelete}
              />
            </div>
          </div>
        )}
      </main>

      <SourceDetailsDialog
        source={viewingSource}
        onClose={() => setViewingSource(null)}
        content={sourceContent}
        contentLoading={contentLoading}
        itemUpdating={updateItemMutation.isPending ? 'loading' : null}
        onUpdateChunk={async (id, content) => { await updateItemMutation.mutateAsync({ type: 'chunk', id, content }); }}
        onDeleteChunk={async (id) => { await deleteItemMutation.mutateAsync({ type: 'chunk', id }); }}
        onUpdateFaq={async (id, q, a) => { await updateItemMutation.mutateAsync({ type: 'faq', id, content: { question: q, answer: a } }); }}
        onDeleteFaq={async (id) => { await deleteItemMutation.mutateAsync({ type: 'faq', id }); }}
      />
    </div>
  );
}
