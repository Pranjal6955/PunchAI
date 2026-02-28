import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dispatch, SetStateAction } from "react";
import { AddDataSourceFormData } from "./types";
import { Plus, Trash2 } from "lucide-react";

interface FaqFieldsProps {
    formData: AddDataSourceFormData;
    setFormData: Dispatch<SetStateAction<AddDataSourceFormData>>;
    existingFaqNames?: string[];
}

export function FaqFields({ formData, setFormData, existingFaqNames = [] }: FaqFieldsProps) {
    const handleAddFaq = () => {
        setFormData({
            ...formData,
            faqs: [...(formData.faqs || []), { question: "", answer: "" }]
        });
    };

    const handleRemoveFaq = (index: number) => {
        const updatedFaqs = [...(formData.faqs || [])];
        updatedFaqs.splice(index, 1);
        setFormData({ ...formData, faqs: updatedFaqs });
    };

    const updateFaq = (index: number, field: "question" | "answer", value: string) => {
        const updatedFaqs = [...(formData.faqs || [])];
        updatedFaqs[index][field] = value;
        setFormData({ ...formData, faqs: updatedFaqs });
    };

    const faqs = formData.faqs || [{ question: "", answer: "" }];

    return (
        <div className="space-y-4">
            <datalist id="faq-groups">
                {existingFaqNames.map(name => (
                    <option key={name} value={name} />
                ))}
            </datalist>
            <div className="space-y-2">
                <Label htmlFor="faq-name" className="text-muted-foreground">Group Name</Label>
                <Input
                    id="faq-name"
                    list="faq-groups"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="bg-muted/50 border-border focus-visible:ring-ring"
                    placeholder="e.g. Pricing FAQ"
                    required
                />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-foreground font-semibold">Q&A Pairs</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddFaq} className="h-8">
                        <Plus className="w-4 h-4 mr-1" /> Add Another
                    </Button>
                </div>

                {faqs.map((faq, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg bg-card/50 space-y-3 relative group">
                        {faqs.length > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFaq(index)}
                                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor={`question-${index}`} className="text-muted-foreground">Question</Label>
                            <Input
                                id={`question-${index}`}
                                required
                                value={faq.question}
                                onChange={e => updateFaq(index, "question", e.target.value)}
                                className="bg-muted/50 border-border focus-visible:ring-ring"
                                placeholder="How much does it cost?"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`answer-${index}`} className="text-muted-foreground">Answer</Label>
                            <Textarea
                                id={`answer-${index}`}
                                required
                                value={faq.answer}
                                onChange={e => updateFaq(index, "answer", e.target.value)}
                                className="bg-muted/50 border-border min-h-[80px] focus-visible:ring-ring"
                                placeholder="Our pricing starts at..."
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

