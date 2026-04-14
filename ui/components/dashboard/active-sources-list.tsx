"use client";

import * as React from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { DataSource } from "@/lib/api-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Globe,
  MessageSquareText,
  Database,
  Settings2,
  Trash2,
  Search,
  Activity,
  Plus,
  DatabaseBackup,
  ChevronDown,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

interface ActiveSourcesListProps {
  dataSources: DataSource[];
  sourcesLoading: boolean;
  onViewDetails: (source: DataSource) => void;
  onDelete: (id: string) => void;
  onAddSource?: () => void;
  selectedIds: string[];
  onSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onBulkDelete: () => void;
}

export function ActiveSourcesList({
  dataSources,
  sourcesLoading,
  onViewDetails,
  onDelete,
  onAddSource,
  selectedIds,
  onSelect,
  onSelectAll,
  onBulkDelete,
}: ActiveSourcesListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterType, setFilterType] = React.useState<string | null>(null);

  const filteredSources = dataSources.filter((source) => {
    const matchesSearch = source.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !filterType || source.type === filterType;
    return matchesSearch && matchesType;
  });

  const _counts = {
    total: dataSources.length,
    files: dataSources.filter((s) => s.type === "FILE").length,
    urls: dataSources.filter((s) => s.type === "URL").length,
    text: dataSources.filter((s) => s.type === "TEXT").length,
  };

  const _containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const _itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* List Container */}
      <Card className="flex min-h-[500px] flex-col overflow-hidden rounded-none border-white/5 bg-black/40 backdrop-blur-md">
        <CardHeader className="space-y-4">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                <Activity className="text-primary h-5 w-5 animate-pulse" />
                Knowledge Hub
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Active data streams fueling your AI&apos;s intelligence.
              </CardDescription>
            </div>

            <div className="flex w-full items-center gap-2 md:w-auto">
              <div className="relative flex-1 md:min-w-[240px] md:flex-none">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search knowledge..."
                  className="focus:border-primary/50 h-10 w-full rounded-none border border-white/10 bg-white/5 pr-4 pl-9 text-sm transition-all focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 min-w-[140px] justify-between gap-2 rounded-none border-white/10 bg-white/5 px-4 text-sm font-bold"
                  >
                    <div className="flex items-center gap-2">
                      <Filter className="text-primary h-3.5 w-3.5" />
                      <span>
                        {filterType === null
                          ? "All Sources"
                          : filterType === "FILE"
                            ? "Documents"
                            : filterType === "URL"
                              ? "Websites"
                              : "FAQs"}
                      </span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 rounded-none border-white/10 bg-black/90 backdrop-blur-xl"
                >
                  <DropdownMenuLabel className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">
                    Filter by type
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  {[
                    { label: "All Sources", value: null, icon: Database },
                    { label: "Documents", value: "FILE", icon: FileText },
                    { label: "Websites", value: "URL", icon: Globe },
                    { label: "FAQs", value: "TEXT", icon: MessageSquareText },
                  ].map((t) => (
                    <DropdownMenuItem
                      key={t.label}
                      onClick={() => setFilterType(t.value)}
                      className={cn(
                        "cursor-pointer gap-3 rounded-none py-2 focus:bg-white/7 focus:text-black",
                        filterType === t.value && "text-primary bg-white/5"
                      )}
                    >
                      <t.icon className="h-4 w-4" />
                      <span className="text-sm font-semibold tracking-wider">{t.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {filteredSources.length > 0 && (
            <div className="flex items-center gap-4">
              <div
                className="group flex cursor-pointer items-center gap-2"
                onClick={() => onSelectAll(filteredSources.map((s) => s.id))}
              >
                <Checkbox
                  checked={
                    filteredSources.length > 0 &&
                    filteredSources.every((s) => selectedIds.includes(s.id))
                  }
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-none border-white/20"
                />
                <span className="group-hover:text-primary text-[10px] font-bold tracking-widest uppercase transition-colors">
                  {selectedIds.length === filteredSources.length ? "DESELECT ALL" : "SELECT ALL"}
                </span>
              </div>

              {selectedIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="h-4 w-px bg-white/10" />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="border-destructive/50 hover:bg-destructive h-7 rounded-none border px-3 text-[10px] font-black tracking-widest uppercase transition-all hover:text-white"
                    onClick={onBulkDelete}
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    DELETE SELECTED ({selectedIds.length})
                  </Button>
                </motion.div>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 pt-1">
          {sourcesLoading ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-none bg-white/5" />
              ))}
            </div>
          ) : filteredSources.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center space-y-6 text-center">
              <DatabaseBackup className="h-10 w-10" />

              <div className="space-y-2">
                <h3 className="text-xl font-bold">No data source found</h3>
                <p className="text-muted-foreground max-w-xs">
                  Your knowledge base is currently empty. Add documents, links, or FAQ entries to
                  train your AI.
                </p>
              </div>
              <Button className="rounded-none text-sm" onClick={onAddSource}>
                <Plus className="h-4 w-4" />
                Add Data Source
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {filteredSources.map((source) => (
                <div key={source.id} className="group relative">
                  <div
                    className={cn(
                      "relative flex flex-col rounded-none border border-white/10 bg-white/[0.03] p-5 transition-all duration-300",
                      selectedIds.includes(source.id) && "bg-primary/[0.05] border-primary/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-1 items-center gap-4">
                        <Checkbox
                          checked={selectedIds.includes(source.id)}
                          onCheckedChange={() => onSelect(source.id)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-none border-white/20"
                        />
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-none border transition-all duration-300",
                            source.type === "FILE"
                              ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                              : source.type === "URL"
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                : "border-orange-500/20 bg-orange-500/10 text-orange-400"
                          )}
                        >
                          {source.type === "FILE" ? (
                            <FileText className="h-6 w-6" />
                          ) : source.type === "URL" ? (
                            <Globe className="h-6 w-6" />
                          ) : (
                            <MessageSquareText className="h-6 w-6" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="mb-1 truncate text-lg leading-none font-bold transition-colors">
                            {source.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="h-5 border-white/5 bg-white/5 px-2 py-0 text-[10px] font-bold tracking-wider uppercase"
                            >
                              {source.type === "FILE"
                                ? "Doc"
                                : source.type === "URL"
                                  ? "Web"
                                  : "FAQ"}
                            </Badge>
                            {source.status !== "COMPLETED" && (
                              <Badge
                                variant={source.status === "FAILED" ? "destructive" : "secondary"}
                                className="h-5 rounded-none px-2 text-[9px] font-black tracking-tighter uppercase"
                              >
                                {source.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-none transition-all hover:bg-white/10"
                          onClick={() => onViewDetails(source)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 h-8 w-8 rounded-none transition-all"
                          onClick={() => onDelete(source.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
