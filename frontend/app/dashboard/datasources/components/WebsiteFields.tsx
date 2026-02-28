import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dispatch, SetStateAction } from "react";
import { AddDataSourceFormData } from "./types";

interface WebsiteFieldsProps {
    formData: AddDataSourceFormData;
    setFormData: Dispatch<SetStateAction<AddDataSourceFormData>>;
}

export function WebsiteFields({ formData, setFormData }: WebsiteFieldsProps) {
    return (
        <>
            <div className="space-y-2">
                <Label htmlFor="web-name" className="text-muted-foreground">Display Name</Label>
                <Input
                    id="web-name"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="bg-muted/50 border-border focus-visible:ring-ring"
                    placeholder="e.g. My Company Blog"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="url" className="text-muted-foreground">Website URL</Label>
                <Input
                    id="url"
                    type="url"
                    required
                    value={formData.url}
                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                    className="bg-muted/50 border-border focus-visible:ring-ring"
                    placeholder="https://example.com"
                />
                <p className="text-xs text-muted-foreground">We will scrape the visible text content from this URL.</p>
            </div>
        </>
    );
}
