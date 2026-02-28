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

import { WebsiteFields } from "./WebsiteFields";
import { DocumentFields } from "./DocumentFields";
import { FaqFields } from "./FaqFields";
import { DataSource, AddDataSourceFormData } from "./types";

interface EditDataSourceModalProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    selectedSource: DataSource | null;
    formData: AddDataSourceFormData;
    setFormData: Dispatch<SetStateAction<AddDataSourceFormData>>;
    setFile: Dispatch<SetStateAction<File | null>>;
    handleEditSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
}

export function EditDataSourceModal({
    isOpen,
    setIsOpen,
    selectedSource,
    formData,
    setFormData,
    setFile,
    handleEditSubmit,
    isSubmitting
}: EditDataSourceModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px] bg-background text-foreground border-border">
                <DialogHeader>
                    <DialogTitle>Edit Data Source</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Update {selectedSource?.name}. Changing content will re-process the data.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
                    {selectedSource?.type === "website" && (
                        <WebsiteFields formData={formData} setFormData={setFormData} />
                    )}

                    {selectedSource?.type === "document" && (
                        <DocumentFields formData={formData} setFormData={setFormData} setFile={setFile} isEditMode={true} />
                    )}

                    {selectedSource?.type === "faq" && (
                        <FaqFields formData={formData} setFormData={setFormData} />
                    )}

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="border-border bg-transparent hover:bg-muted text-muted-foreground">Cancel</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            {isSubmitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Update Data
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
