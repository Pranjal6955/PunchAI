import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FaqFieldsProps {
    formData: {
        name: string;
        question: string;
        answer: string;
        [key: string]: any;
    };
    setFormData: (data: any) => void;
}

export function FaqFields({ formData, setFormData }: FaqFieldsProps) {
    return (
        <>
            <div className="space-y-2">
                <Label htmlFor="faq-name" className="text-muted-foreground">Group Name</Label>
                <Input
                    id="faq-name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="bg-muted/50 border-border focus-visible:ring-ring"
                    placeholder="e.g. Pricing FAQ"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="question" className="text-muted-foreground">Question</Label>
                <Input
                    id="question"
                    required
                    value={formData.question}
                    onChange={e => setFormData({ ...formData, question: e.target.value })}
                    className="bg-muted/50 border-border focus-visible:ring-ring"
                    placeholder="How much does it cost?"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="answer" className="text-muted-foreground">Answer</Label>
                <Textarea
                    id="answer"
                    required
                    value={formData.answer}
                    onChange={e => setFormData({ ...formData, answer: e.target.value })}
                    className="bg-muted/50 border-border min-h-[100px] focus-visible:ring-ring"
                    placeholder="Our pricing starts at..."
                />
            </div>
        </>
    );
}
