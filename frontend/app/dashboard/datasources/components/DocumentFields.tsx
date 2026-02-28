import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dispatch, SetStateAction } from "react";
import { AddDataSourceFormData } from "./types";

interface DocumentFieldsProps {
    formData: AddDataSourceFormData;
    setFormData: Dispatch<SetStateAction<AddDataSourceFormData>>;
    setFile: (file: File | null) => void;
    isEditMode?: boolean;
}

export function DocumentFields({ formData, setFormData, setFile, isEditMode = false }: DocumentFieldsProps) {
    return (
        <>
            <div className="space-y-2">
                <Label htmlFor="doc-name" className="text-muted-foreground">Document Name</Label>
                <Input
                    id="doc-name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="bg-muted/50 border-border focus-visible:ring-ring"
                    placeholder={isEditMode ? "" : "Will use filename if left blank"}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="file" className="text-muted-foreground">{isEditMode ? "Upload New File (Optional)" : "File"}</Label>
                <Input
                    id="file"
                    type="file"
                    required={!isEditMode}
                    accept=".pdf,.txt"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="bg-muted/50 border-border focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                    {isEditMode
                        ? "Leaving this empty will keep the existing document vectors intact."
                        : "Supported formats: .pdf, .txt. Max size: 10MB."
                    }
                </p>
            </div>
        </>
    );
}
