import { useState, useEffect } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface EditCompanyContextModalProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    userData: any;
    fetchUserData: () => void;
}

export function EditCompanyContextModal({ isOpen, setIsOpen, userData, fetchUserData }: EditCompanyContextModalProps) {
    const [formData, setFormData] = useState({
        companyName: "",
        industry: "",
        websiteUrl: "",
        chatbotPurpose: [] as string[],
        chatbotPersonality: "",
        supportedLanguages: [] as string[]
    });
    const [otherLanguage, setOtherLanguage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (userData && isOpen) {
            setFormData({
                companyName: userData.companyName || "",
                industry: userData.industry || "",
                websiteUrl: userData.websiteUrl || "",
                chatbotPurpose: userData.chatbotPurpose || [],
                chatbotPersonality: userData.chatbotPersonality || "",
                supportedLanguages: userData.supportedLanguages || []
            });
        }
    }, [userData, isOpen]);

    const handleCheckboxChange = (field: "chatbotPurpose" | "supportedLanguages", value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter((item) => item !== value)
                : [...prev[field], value],
        }));
    };

    const handleAddOtherLanguage = () => {
        const trimmed = otherLanguage.trim();
        if (trimmed && !formData.supportedLanguages.includes(trimmed)) {
            setFormData(prev => ({
                ...prev,
                supportedLanguages: [...prev.supportedLanguages, trimmed]
            }));
            setOtherLanguage("");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
            await axios.post(`${API_URL}/onboarding`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUserData();
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to update company context", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px] border-border bg-card text-foreground max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Company Context</DialogTitle>
                    <DialogDescription>
                        Update the fundamental context your AI agents use to represent your business.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Business Name</Label>
                            <Input
                                id="companyName"
                                value={formData.companyName}
                                className="bg-background border-input"
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="industry">Industry</Label>
                            <Select
                                value={formData.industry}
                                onValueChange={(value) => setFormData({ ...formData, industry: value })}
                            >
                                <SelectTrigger className="bg-background border-input">
                                    <SelectValue placeholder="Select industry" />
                                </SelectTrigger>
                                <SelectContent className="bg-card">
                                    <SelectItem value="E-commerce">E-commerce</SelectItem>
                                    <SelectItem value="SaaS / Tech">SaaS / Tech</SelectItem>
                                    <SelectItem value="Education">Education</SelectItem>
                                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                                    <SelectItem value="Finance">Finance</SelectItem>
                                    <SelectItem value="Travel">Travel</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="websiteUrl">Website URL</Label>
                            <Input
                                id="websiteUrl"
                                value={formData.websiteUrl}
                                className="bg-background border-input"
                                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3 pt-2">
                            <Label>Chatbot Personality</Label>
                            <RadioGroup
                                value={formData.chatbotPersonality}
                                onValueChange={(value: string) => setFormData({ ...formData, chatbotPersonality: value })}
                                className="grid grid-cols-2 gap-2"
                            >
                                {["Friendly & Casual", "Professional & Formal", "Technical Assistant", "Sales-focused"].map((option) => (
                                    <div key={option} className="flex items-center space-x-2">
                                        <RadioGroupItem value={option} id={`edit-personality-${option}`} />
                                        <Label htmlFor={`edit-personality-${option}`} className="text-sm font-normal cursor-pointer flex-1">
                                            {option}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        <div className="space-y-3 pt-2">
                            <Label>Chatbot Purpose</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {["Answer FAQs", "Order tracking", "Account issues", "Technical support", "Product information", "Billing & payments", "General inquiries"].map((option) => (
                                    <div key={option} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`edit-purpose-${option}`}
                                            checked={formData.chatbotPurpose.includes(option)}
                                            onCheckedChange={() => handleCheckboxChange("chatbotPurpose", option)}
                                        />
                                        <Label htmlFor={`edit-purpose-${option}`} className="text-sm font-normal cursor-pointer flex-1">
                                            {option}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <Label>Supported Languages</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {["English", "Hindi", ...formData.supportedLanguages.filter(l => l !== "English" && l !== "Hindi")].map((option) => (
                                    <div key={option} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`edit-language-${option}`}
                                            checked={formData.supportedLanguages.includes(option)}
                                            onCheckedChange={() => handleCheckboxChange("supportedLanguages", option)}
                                        />
                                        <Label htmlFor={`edit-language-${option}`} className="text-sm font-normal cursor-pointer flex-1">
                                            {option}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                                <Input
                                    placeholder="Add another language"
                                    value={otherLanguage}
                                    onChange={(e) => setOtherLanguage(e.target.value)}
                                    className="h-9 bg-background border-input"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddOtherLanguage();
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="h-9"
                                    onClick={handleAddOtherLanguage}
                                >
                                    Add
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
