import React, { Dispatch, SetStateAction } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { WebsiteFields } from "./WebsiteFields";
import { DocumentFields } from "./DocumentFields";
import { FaqFields } from "./FaqFields";
import { SourceType, AddDataSourceFormData } from "./types";

interface AddDataSourceModalProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    activeTab: SourceType;
    setActiveTab: (tab: SourceType) => void;
    formData: AddDataSourceFormData;
    setFormData: Dispatch<SetStateAction<AddDataSourceFormData>>;
    setFile: Dispatch<SetStateAction<File | null>>;
    handleAddSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
    existingFaqNames?: string[];
}

export function AddDataSourceModal({
    isOpen,
    setIsOpen,
    activeTab,
    setActiveTab,
    formData,
    setFormData,
    setFile,
    handleAddSubmit,
    isSubmitting,
    existingFaqNames
}: AddDataSourceModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px] bg-background text-foreground border-border">
                <DialogHeader>
                    <DialogTitle>Add Data Source</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Inject new knowledge into your AI agent&apos;s Brain.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SourceType)} className="mt-4">
                    <TabsList className="grid w-full grid-cols-3 bg-muted/50 border border-border">
                        <TabsTrigger value="website" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">Website</TabsTrigger>
                        <TabsTrigger value="document" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">Document</TabsTrigger>
                        <TabsTrigger value="faq" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">FAQ</TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleAddSubmit} className="mt-6 space-y-4">
                        {activeTab === "website" && (
                            <WebsiteFields formData={formData} setFormData={setFormData} />
                        )}

                        {activeTab === "document" && (
                            <DocumentFields formData={formData} setFormData={setFormData} setFile={setFile} isEditMode={false} />
                        )}

                        {activeTab === "faq" && (
                            <FaqFields formData={formData} setFormData={setFormData} existingFaqNames={existingFaqNames} />
                        )}

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="border-border bg-transparent hover:bg-muted text-muted-foreground">Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                {isSubmitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save & Process
                            </Button>
                        </DialogFooter>
                    </form>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
