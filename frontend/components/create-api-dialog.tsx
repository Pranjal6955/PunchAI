"use client"
import React, { useState } from 'react';
import { Plus, Loader2, Globe, Database, Code,File } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CreateApiDialogProps {
    projectId?: string;
}

export function CreateApiDialog({ projectId }: CreateApiDialogProps) {
    const [method, setMethod] = useState("GET");
    const [path, setPath] = useState("");
    const [responseBody, setResponseBody] = useState("");
    const [requestBody, setRequestBody] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const hasRequestBody = ["POST", "PUT", "PATCH"].includes(method);

    const handleSave = async () => {
        setIsCreating(true);
        // Potential logic for saving to backend using projectId
        setTimeout(() => {
            setIsCreating(false);
            setIsOpen(false);
            // Reset form
            setPath("");
            setResponseBody("");
            setRequestBody("");
            setMethod("GET");
        }, 1000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="h-11 rounded-none gap-2 px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95">
                    <Plus className="size-4 fill-current" />
                    New Request
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] rounded-none border-border/60 bg-background/95 backdrop-blur-xl p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-6 border-b border-border/40 bg-muted/20 text-left">
                    <DialogTitle className="text-2xl font-semibold tracking-tight">Create API</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Define your mock endpoint by providing the link, method, and response schema.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-4 gap-4 text-left">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Method</Label>
                            <Select value={method} onValueChange={setMethod}>
                                <SelectTrigger className="rounded-none border-border/60 bg-background/50 h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-none border-border/60 bg-background/95 backdrop-blur-xl">
                                    <SelectItem value="GET" className="rounded-none focus:bg-primary/10 focus:text-primary">GET</SelectItem>
                                    <SelectItem value="POST" className="rounded-none focus:bg-primary/10 focus:text-primary">POST</SelectItem>
                                    <SelectItem value="PUT" className="rounded-none focus:bg-primary/10 focus:text-primary">PUT</SelectItem>
                                    <SelectItem value="PATCH" className="rounded-none focus:bg-primary/10 focus:text-primary">PATCH</SelectItem>
                                    <SelectItem value="DELETE" className="rounded-none focus:bg-primary/10 focus:text-primary">DELETE</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-3 space-y-2">
                            <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground text-left block">Endpoint Link</Label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="/v1/users/login"
                                    className="pl-10 h-10 rounded-none border-border/60 bg-background/50 focus-visible:ring-1 focus-visible:ring-primary transition-all"
                                    value={path}
                                    onChange={(e) => setPath(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {hasRequestBody && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300 text-left">
                            <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground text-left block">Request Body (JSON)</Label>
                            <div className="relative group">
                                <Database className="absolute right-4 top-4 size-4 text-muted-foreground/40 group-focus-within:text-primary/40" />
                                <Textarea
                                    placeholder='{ "email": "user@example.com", "password": "..." }'
                                    className="min-h-[120px] rounded-none border-border/60 bg-background/50 font-mono text-xs focus-visible:ring-1 focus-visible:ring-primary resize-none p-4"
                                    value={requestBody}
                                    onChange={(e) => setRequestBody(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2 text-left">
                        <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground text-left block">Expected Response (JSON)</Label>
                        <div className="relative group">
                            <div className="absolute right-4 top-4 flex items-center gap-2">
                                <span className="text-[9px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-sm">200 OK</span>
                                <Code className="size-4 text-muted-foreground/40 group-focus-within:text-primary/40" />
                            </div>
                            <Textarea
                                placeholder='{ "status": "success", "data": { ... } }'
                                className="min-h-[180px] rounded-none border-border/60 bg-background/50 font-mono text-xs focus-visible:ring-1 focus-visible:ring-primary resize-none p-4"
                                value={responseBody}
                                onChange={(e) => setResponseBody(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter className="p-6 bg-muted/20 border-t border-border/40 gap-3">
                    <Button
                        variant="outline"
                        className="rounded-none border-border/60 h-11 px-6 hover:bg-muted transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="rounded-none gap-2 px-8 h-11 shadow-lg shadow-primary/20"
                        disabled={isCreating}
                        onClick={handleSave}
                    >
                        {isCreating ? <Loader2 className="size-4 animate-spin" /> : <File className="size-4" />}
                        SAVE ENDPOINT
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
