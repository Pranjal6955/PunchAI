import { format } from "date-fns";
import { Edit2, Trash2, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { DataSource } from "../types";
import { getStatusBadge, getTypeIcon } from "../utils";

interface DataSourceTableProps {
    filteredSources: DataSource[];
    loading: boolean;
    handleOpenAddModal: (type: "website") => void;
    handleOpenViewModal: (source: DataSource) => void;
    handleOpenEditModal: (source: DataSource) => void;
    handleDelete: (id: string) => void;
    selectedIds: string[];
    onSelect: (id: string) => void;
    onSelectAll: () => void;
}

export function DataSourceTable({
    filteredSources,
    loading,
    handleOpenAddModal,
    handleOpenViewModal,
    handleOpenEditModal,
    handleDelete,
    selectedIds,
    onSelect,
    onSelectAll
}: DataSourceTableProps) {
    const allSelected = filteredSources.length > 0 && selectedIds.length === filteredSources.length;

    return (
        <Table>
            <TableHeader className="border-border">
                <TableRow className="border-b border-border hover:bg-muted/50">
                    <TableHead className="w-12 text-center">
                        <Checkbox
                            checked={allSelected}
                            onCheckedChange={onSelectAll}
                            disabled={filteredSources.length === 0}
                            aria-label="Select all"
                        />
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">Name</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Type</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Added</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading && filteredSources.length === 0 ? (
                    <TableRow className="border-b border-border">
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Loading your data sources...
                        </TableCell>
                    </TableRow>
                ) : filteredSources.length === 0 ? (
                    <TableRow className="border-b border-border">
                        <TableCell colSpan={6} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                                    <FileText className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <p className="font-medium text-muted-foreground">No data sources yet</p>
                                <p className="text-sm mt-1 max-w-sm text-center">Your AI doesn&apos;t have any custom knowledge. Add a website, document, or FAQ to get started.</p>
                                <Button onClick={() => handleOpenAddModal("website")} className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">Get Started</Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : (
                    filteredSources.map((source) => (
                        <TableRow key={source._id} className="border-b border-border border-opacity-50 hover:bg-muted/50">
                            <TableCell className="text-center">
                                <Checkbox
                                    checked={selectedIds.includes(source._id)}
                                    onCheckedChange={() => onSelect(source._id)}
                                    aria-label={`Select ${source.name}`}
                                />
                            </TableCell>
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span>{source.name}</span>
                                    {source.type === 'website' && <span className="text-xs text-muted-foreground truncate max-w-xs">{source.sourceUrl}</span>}
                                    {source.status === 'failed' && <span className="text-xs text-red-400 truncate max-w-xs">{source.errorMessage}</span>}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center capitalize text-muted-foreground">
                                    {getTypeIcon(source.type)}
                                    <span className="ml-2">{source.type}</span>
                                </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(source.status)}</TableCell>
                            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                                {format(new Date(source.createdAt), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleOpenViewModal(source)}
                                        className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                        title="View Details"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleOpenEditModal(source)}
                                        className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(source._id)}
                                        className="text-muted-foreground hover:text-red-400 hover:bg-muted hover:bg-opacity-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
