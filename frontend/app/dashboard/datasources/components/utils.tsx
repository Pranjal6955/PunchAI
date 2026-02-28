import { Globe, FileText, MessageCircleQuestion, CheckCircle2, RefreshCw, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SourceType, SourceStatus } from "./types";

export const getStatusBadge = (status: SourceStatus) => {
    switch (status) {
        case "completed": return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
        case "processing": return <Badge variant="secondary" className="text-primary bg-primary/20"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Processing</Badge>;
        case "pending": return <Badge variant="outline" className="text-slate-600"><Clock className="w-3 h-3 mr-1" /> Queued</Badge>;
        case "failed": return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
    }
};

export const getTypeIcon = (type: SourceType) => {
    switch (type) {
        case "website": return <Globe className="w-4 h-4 text-blue-500" />;
        case "document": return <FileText className="w-4 h-4 text-orange-500" />;
        case "faq": return <MessageCircleQuestion className="w-4 h-4 text-purple-500" />;
    }
};
