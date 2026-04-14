"use client";

import * as React from "react";
import { Bot } from "@/lib/api-session";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Code2,
  Terminal,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Eye,
  EyeOff,
  Loader2,
  FileText,
  Palette,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface IntegrationTabProps {
  bot: Bot;
  customCss: string;
  setCustomCss: (val: string) => void;
  handleUpdate: () => Promise<void>;
  updating: boolean;
  showApiKey: boolean;
  setShowApiKey: (val: boolean) => void;
  handleGenerateApiKey: () => Promise<void>;
  defaultCss: string;
}

export function IntegrationTab({
  bot,
  customCss,
  setCustomCss,
  handleUpdate,
  updating,
  showApiKey,
  setShowApiKey,
  handleGenerateApiKey,
  defaultCss,
}: IntegrationTabProps) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="bg-muted/40 border-border/50 rounded-none border shadow-sm">
          <CardHeader>
            <div className="mb-2 flex items-center gap-3">
              <div className="bg-primary/10 text-primary p-2">
                <Code2 className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl">Embed Widget</CardTitle>
            </div>
            <CardDescription>
              Add this script tag to your website&apos;s{" "}
              <code className="text-primary font-mono">&lt;head&gt;</code> or{" "}
              <code className="text-primary font-mono">&lt;body&gt;</code> tag to enable the
              chatbot.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                Widget Script Tag
              </Label>
              <div className="group relative">
                <pre className="overflow-x-auto border border-white/10 bg-black p-4 font-mono text-sm leading-relaxed text-white select-all">
                  {`<script 
  src="${origin}/widget/punch-chat.js"
  data-api-key="${bot.apiKey && showApiKey ? bot.apiKey : bot.apiKey ? "••••••••••••••••" : "YOUR_API_KEY"}"
  data-base-url="http://localhost:8000"
></script>`}
                </pre>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2 rounded-none opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => {
                    const code = `<script \n  src="${origin}/widget/punch-chat.js"\n  data-api-key="${bot.apiKey || "YOUR_API_KEY"}"\n  data-base-url="http://localhost:8000"\n></script>`;
                    navigator.clipboard.writeText(code);
                    toast.success("Script tag copied to clipboard");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-primary/5 border-primary/10 space-y-2 border p-4">
              <div className="text-primary flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-sm font-semibold">Security Tip</span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Your API key identifies this specific agent. Keep it secure and only embed it on
                domains you trust.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/40 border-border/50 rounded-none border shadow-sm">
          <CardHeader>
            <div className="mb-2 flex items-center gap-3">
              <div className="bg-primary/10 text-primary p-2">
                <Terminal className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl">Direct API Access</CardTitle>
            </div>
            <CardDescription>
              Interact with your agent programmatically via our REST API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                  Your Public API Key
                </Label>
                {bot.apiKey && (
                  <Badge
                    variant="outline"
                    className="rounded-none border-emerald-500/20 bg-emerald-500/10 text-[10px] font-bold tracking-tighter text-emerald-500 uppercase"
                  >
                    Active
                  </Badge>
                )}
              </div>

              {bot.apiKey ? (
                <div className="bg-background border-border/50 group hover:border-primary/30 flex gap-2 border p-1.5 transition-all">
                  <div className="text-muted-foreground flex flex-1 items-center overflow-hidden px-3 font-mono text-sm whitespace-nowrap select-none">
                    {showApiKey ? (
                      <span className="text-foreground">{bot.apiKey}</span>
                    ) : (
                      <span>•••••••••••••••••••••••••••••</span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-none"
                      onClick={() => setShowApiKey(!showApiKey)}
                      title={showApiKey ? "Hide API Key" : "Show API Key"}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-none"
                      onClick={() => {
                        navigator.clipboard.writeText(bot.apiKey || "");
                        toast.success("API Key copied");
                      }}
                      title="Copy Key"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-border/50 bg-muted/20 hover:bg-muted/30 flex flex-col items-center justify-center space-y-4 border border-dashed p-8 text-center transition-colors">
                  <div className="bg-background border-border/50 border p-4 shadow-sm">
                    <Zap className="text-primary h-6 w-6" />
                  </div>
                  <div className="max-w-[280px] space-y-1">
                    <p className="text-sm font-semibold">No API Key Generated</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      You need an API key to securely connect this agent to your external
                      applications and widgets.
                    </p>
                  </div>
                  <Button
                    variant="default"
                    className="h-11 rounded-none px-10"
                    onClick={handleGenerateApiKey}
                    disabled={updating}
                  >
                    {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate API Key
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                Quick Test (cURL)
              </Label>
              <pre className="bg-muted border-border/50 overflow-x-auto border p-4 font-mono text-xs leading-relaxed">
                {`curl -X POST http://localhost:8000/api/external/chat/init \\
  -H "X-API-Key: ${bot.apiKey && showApiKey ? bot.apiKey : bot.apiKey ? "••••••••••••••••" : "YOUR_API_KEY"}"`}
              </pre>
            </div>

            <div className="flex justify-end">
              <Link href="/docs" target="_blank">
                <Button variant="link" className="text-xs">
                  View Full API Documentation
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/40 border-border/50 rounded-none border shadow-sm lg:col-span-2">
          <CardHeader>
            <div className="mb-2 flex items-center gap-3">
              <div className="bg-primary/10 text-primary p-2">
                <Palette className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl">Custom CSS Styling (style.css)</CardTitle>
            </div>
            <CardDescription>
              Customize the widget&apos;s appearance to match your brand. Click &quot;Save Custom
              Style&quot; to apply changes to your live widget.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="group relative">
              <Textarea
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
                className="min-h-[300px] resize-y rounded-none border-white/10 bg-black p-6 font-mono text-sm leading-relaxed text-white focus:border-white/20"
                placeholder="Paste your custom CSS here..."
              />
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-4 right-4 rounded-none opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => {
                  navigator.clipboard.writeText(customCss);
                  toast.success("CSS copied to clipboard");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <Button
                  onClick={() => handleUpdate()}
                  disabled={updating}
                  className="rounded-none px-6"
                >
                  {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Custom Style
                </Button>
                <Button
                  variant="outline"
                  className="rounded-none px-6"
                  onClick={() => setCustomCss(defaultCss)}
                >
                  Reset to Default
                </Button>
              </div>
              <Button
                variant="ghost"
                className="h-9 rounded-none text-xs"
                onClick={() => {
                  const blob = new Blob([customCss], { type: "text/css" });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "style.css";
                  a.click();
                  window.URL.revokeObjectURL(url);
                  toast.success("style.css download started");
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Download style.css
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-full max-w-4xl pt-4">
        <Card className="bg-primary/5 border-primary/20 rounded-none border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground p-2">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl">Quick Start: Integration Guide</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="relative space-y-8">
              {/* Vertical line through steps */}
              <div className="from-primary/5 via-primary/20 to-primary/5 absolute top-2 bottom-2 left-[19px] w-[2px] bg-gradient-to-b" />

              {[
                {
                  step: "01",
                  title: "Configuration Check",
                  desc: "Before embedding, ensure you have added at least one Data Source. The widget requires an active knowledge base to respond to user queries effectively.",
                },
                {
                  step: "02",
                  title: "API Key Authentication",
                  desc: "Generate your unique API Key. This secures your agent and ensures only authorized sites can load your specific configuration.",
                },
                {
                  step: "03",
                  title: "Script Placement",
                  desc: "Insert the widget <script> tag into your website&apos;s HTML. We recommend placing it just before the </body> closing tag to ensure faster initial page load.",
                },
                {
                  step: "04",
                  title: "Style Override & CDN",
                  desc: "If you&apos;ve customized styles, those rules are injected automatically. You can also download the style.css to host it locally for advanced performance tuning.",
                },
                {
                  step: "05",
                  title: "Deployment Verification",
                  desc: "Refresh your website and test the chat. Use the 'Quick Test' cURL command in this dashboard to confirm that the backend is responding correctly.",
                },
              ].map((m, idx) => (
                <div key={m.step} className="group relative flex gap-8 pl-12">
                  <div className="bg-background border-primary/20 text-primary group-hover:border-primary absolute top-0 left-0 z-10 flex h-10 w-10 items-center justify-center border-2 text-xs font-black transition-colors">
                    {m.step}
                  </div>
                  <div className="space-y-1 py-1">
                    <h4 className="text-foreground flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
                      {m.title}
                      <div className="bg-primary/5 h-px w-12 flex-1" />
                    </h4>
                    <p className="text-muted-foreground max-w-2xl pr-12 text-sm leading-relaxed italic">
                      {m.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
