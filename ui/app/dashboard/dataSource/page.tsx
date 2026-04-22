"use client";

import * as React from "react";
import {
  getBots,
  getDataSources,
  uploadDataSource,
  addUrlDataSource,
  addFaqDataSource,
  deleteDataSource,
  Bot,
  DataSource,
} from "@/lib/api-session";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { DataSourceManager } from "@/components/dashboard/data-source-manager";
import { ActiveSourcesList } from "@/components/dashboard/active-sources-list";
import { SourceDetailsDialog } from "@/components/dashboard/source-details-dialog";
import {
  getSourceChunks,
  updateChunk,
  listFaqs,
  updateFaq,
  deleteFaq,
  deleteChunk,
  FAQ,
  DocumentChunk,
} from "@/lib/api-session";
import { useSearchParams } from "next/navigation";
import { Bot as BotIcon } from "lucide-react";
import { useBots } from "@/hooks/use-bots";
import { useDataSources } from "@/hooks/use-data-sources";
import { CreateAgentDialog } from "@/components/dashboard/create-agent-dialog";

export default function DataSourcesPage() {
  const searchParams = useSearchParams();
  const botIdParam = searchParams.get("botId");

  const [viewingSource, setViewingSource] = React.useState<DataSource | null>(null);
  const [sourceContent, setSourceContent] = React.useState<{
    chunks: DocumentChunk[];
    faqs: FAQ[];
  }>({ chunks: [], faqs: [] });
  const [contentLoading, setContentLoading] = React.useState(false);

  const { bots, isLoading: botsLoading, mutate: mutateBots } = useBots();
  const [selectedBotId, setSelectedBotId] = React.useState<string>("");
  const { dataSources, isLoading: sourcesLoading, mutate: mutateSources, removeDataSource } = useDataSources(selectedBotId);

  const [actionLoading, setActionLoading] = React.useState(false);
  const [selectedSourceIds, setSelectedSourceIds] = React.useState<string[]>([]);

  // Set default selectedBotId
  React.useEffect(() => {
    if (bots.length > 0) {
      if (botIdParam && bots.some((b) => b.id === botIdParam)) {
        setSelectedBotId(botIdParam);
      } else if (!selectedBotId) {
        setSelectedBotId(bots[0].id);
      }
    }
  }, [bots, botIdParam, selectedBotId]);

  const loading = botsLoading && bots.length === 0;

  const [itemUpdating, setItemUpdating] = React.useState<string | null>(null);
  const [isDataModalOpen, setIsDataModalOpen] = React.useState(false);

  // Form states
  const [url, setUrl] = React.useState("");
  const [faqName, setFaqName] = React.useState("");
  const [faqs, setFaqs] = React.useState([{ question: "", answer: "" }]);
  const [file, setFile] = React.useState<File | null>(null);

  const handleFileUpload = async () => {
    if (!selectedBotId || !file) return false;
    setActionLoading(true);
    try {
      const success = await uploadDataSource(selectedBotId, file);
      if (success) {
        toast.success("File uploaded and processed successfully");
        setFile(null);
        // Refresh sources
        await mutateSources();
        return true;
      } else {
        toast.error("Failed to upload file");
        return false;
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("An error occurred during upload");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleUrlAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBotId || !url) return false;
    setActionLoading(true);
    try {
      const success = await addUrlDataSource(selectedBotId, url);
      if (success) {
        toast.success("Website synchronized successfully");
        setUrl("");
        // Refresh sources
        await mutateSources();
        return true;
      } else {
        toast.error("Failed to sync website");
        return false;
      }
    } catch (error) {
      console.error("URL error:", error);
      toast.error("An error occurred during URL sync");
      return false;
    } finally {
      setActionLoading(false);
    }
  };
  const handleFaqAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBotId || !faqName || faqs.some((f) => !f.question || !f.answer)) {
      toast.error("Please fill in all FAQ fields");
      return false;
    }
    setActionLoading(true);
    try {
      const success = await addFaqDataSource(selectedBotId, faqName, faqs);
      if (success) {
        toast.success("FAQs added successfully");
        setFaqName("");
        setFaqs([{ question: "", answer: "" }]);
        // Refresh sources
        await mutateSources();
        return true;
      } else {
        toast.error("Failed to add FAQs");
        return false;
      }
    } catch (error) {
      console.error("FAQ error:", error);
      toast.error("An error occurred adding FAQs");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (dsId: string) => {
    if (!confirm("Are you sure you want to delete this data source?")) return;
    const success = await removeDataSource(dsId);
    if (success) {
      setSelectedSourceIds((prev) => prev.filter((id) => id !== dsId));
      if (viewingSource?.id === dsId) setViewingSource(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedSourceIds.length) return;
    if (!confirm(`Are you sure you want to delete ${selectedSourceIds.length} data sources?`))
      return;

    setActionLoading(true);
    let successCount = 0;
    try {
      for (const id of selectedSourceIds) {
        const success = await deleteDataSource(id);
        if (success) {
          successCount++;
        }
      }

      await mutateSources();
      setSelectedSourceIds([]);
      toast.success(`Successfully deleted ${successCount} sources`);
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("An error occurred during bulk deletion");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelectSource = (id: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (ids: string[]) => {
    if (selectedSourceIds.length === ids.length) {
      setSelectedSourceIds([]);
    } else {
      setSelectedSourceIds(ids);
    }
  };

  const handleViewDetails = async (source: DataSource) => {
    setViewingSource(source);
    setContentLoading(true);
    try {
      if (source.type === "TEXT") {
        const allFaqs = await listFaqs(selectedBotId);
        const sourceFaqs = allFaqs.filter((f) => f.sourceId === source.id);
        setSourceContent({ chunks: [], faqs: sourceFaqs });
      } else {
        const chunks = await getSourceChunks(source.id);
        setSourceContent({ chunks: chunks, faqs: [] });
      }
    } catch (error) {
      console.error("Failed to load content:", error);
      toast.error("Failed to load source content");
    } finally {
      setContentLoading(false);
    }
  };

  const handleUpdateChunk = async (chunkId: string, newContent: string) => {
    setItemUpdating(chunkId);
    try {
      const updated = await updateChunk(chunkId, newContent);
      if (updated) {
        setSourceContent((prev) => ({
          ...prev,
          chunks: prev.chunks.map((c) => (c.id === chunkId ? updated : c)),
        }));
        toast.success("Content updated");
      }
    } catch {
      toast.error("Failed to update content");
    } finally {
      setItemUpdating(null);
    }
  };

  const handleDeleteChunk = async (chunkId: string) => {
    if (!confirm("Delete this text segment?")) return;
    try {
      const success = await deleteChunk(chunkId);
      if (success) {
        setSourceContent((prev) => ({
          ...prev,
          chunks: prev.chunks.filter((c) => c.id !== chunkId),
        }));
        toast.success("Segment removed");
      }
    } catch {
      toast.error("Failed to delete segment");
    }
  };

  const handleUpdateFaq = async (faqId: string, question: string, answer: string) => {
    setItemUpdating(faqId);
    try {
      const updated = await updateFaq(faqId, { question, answer });
      if (updated) {
        setSourceContent((prev) => ({
          ...prev,
          faqs: prev.faqs.map((f) => (f.id === faqId ? updated : f)),
        }));
        toast.success("FAQ updated");
      }
    } catch {
      toast.error("Failed to update FAQ");
    } finally {
      setItemUpdating(null);
    }
  };

  const handleDeleteFaq = async (faqId: string) => {
    if (!confirm("Delete this FAQ entry?")) return;
    try {
      const success = await deleteFaq(faqId);
      if (success) {
        setSourceContent((prev) => ({
          ...prev,
          faqs: prev.faqs.filter((f) => f.id !== faqId),
        }));
        toast.success("FAQ removed");
      }
    } catch {
      toast.error("Failed to delete FAQ");
    }
  };

  const addFaqField = () => setFaqs([...faqs, { question: "", answer: "" }]);
  const removeFaqField = (index: number) => {
    if (faqs.length > 1) {
      setFaqs(faqs.filter((_, i) => i !== index));
    }
  };
  const updateFaqField = (index: number, field: "question" | "answer", value: string) => {
    const newFaqs = [...faqs];
    newFaqs[index][field] = value;
    setFaqs(newFaqs);
  };

  if (loading) {
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
          {bots.length > 0 && (
            <div className="shrink-0">
              <DataSourceManager
                bots={bots}
                selectedBotId={selectedBotId}
                onSelectedBotIdChange={setSelectedBotId}
                loading={loading}
                actionLoading={actionLoading}
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
                onAgentCreated={mutateBots}
                isDataModalOpen={isDataModalOpen}
                setIsDataModalOpen={setIsDataModalOpen}
                hasDataSources={dataSources.length > 0}
              />
            </div>
          )}
        </div>

        {bots.length === 0 ? (
          <div className="border-border/40 bg-muted/5 flex min-h-[400px] flex-col items-center justify-center border-2 border-dashed p-12">
            <div className="bg-primary/10 mb-6 flex size-20 items-center justify-center">
              <BotIcon className="text-primary size-10" />
            </div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight uppercase">
              No Chatbots Detected
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md text-center">
              You need to create at least one chatbot agent before you can connect data sources.
              Data is added specifically to an individual agent.
            </p>
            <CreateAgentDialog onSuccess={mutateBots} />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <div className="flex-1">
              <ActiveSourcesList
                dataSources={dataSources}
                sourcesLoading={sourcesLoading}
                onViewDetails={handleViewDetails}
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
        itemUpdating={itemUpdating}
        onUpdateChunk={handleUpdateChunk}
        onDeleteChunk={handleDeleteChunk}
        onUpdateFaq={handleUpdateFaq}
        onDeleteFaq={handleDeleteFaq}
      />
    </div>
  );
}
