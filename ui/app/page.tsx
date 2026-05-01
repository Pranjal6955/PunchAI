"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Brain, 
  Cpu, 
  Database, 
  Globe, 
  MessageSquare, 
  ShieldCheck, 
  Zap,
  CheckCircle2,
  Layers,
  Search,
  Terminal,
  Code2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground selection:bg-primary/20">
      {/* Industrial Background Grid */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="bg-dot-pattern absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent)] opacity-30" />
      
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <div className="bg-primary flex h-8 w-8 items-center justify-center">
                <Image 
                src="/Logo_dark_theme.webp" 
                alt="PunchAI Logo" 
                width={20} 
                height={20} 
                className="invert"
                />
            </div>
            <span className="text-lg font-bold tracking-tighter uppercase">Punch Studio</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary">Features</Link>
            <Link href="#how-it-works" className="text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary">Workflow</Link>
            <Link href="#pricing" className="text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary">Pricing</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hidden text-xs font-bold uppercase tracking-widest sm:inline-flex">Login</Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="rounded-none gap-2 bg-primary px-4 text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                Get Started <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Industrial Hero Section */}
        <section className="relative pt-20 pb-24 md:pt-32 md:pb-40">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col items-center text-center">
                <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-8 border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary"
                >
                Industrial-Grade AI Infrastructure
                </motion.div>
                
                <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="max-w-4xl text-5xl font-black leading-[0.9] tracking-tighter md:text-8xl lg:text-9xl uppercase"
                >
                Power your <span className="text-primary italic">knowledge</span> with AI.
                </motion.h1>
                
                <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-8 max-w-2xl text-base font-medium text-muted-foreground md:text-lg"
                >
                Build, deploy, and scale intelligent chatbots powered by your proprietary data. 
                PDFs, URLs, and Office docs transformed into high-performance RAG pipelines.
                </motion.p>
                
                <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-12 flex flex-col gap-4 sm:flex-row"
                >
                <Link href="/dashboard">
                    <Button size="lg" className="rounded-none h-14 px-10 text-xs font-bold uppercase tracking-[0.2em] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]">
                    Create My Agent
                    </Button>
                </Link>
                <Button size="lg" variant="outline" className="rounded-none h-14 px-10 text-xs font-bold uppercase tracking-[0.2em]">
                    View Documentation
                </Button>
                </motion.div>
            </div>

            {/* Feature Bento Grid */}
            <div id="features" className="mt-32 grid grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-2">
                {/* Main Feature */}
                <motion.div 
                    whileHover={{ y: -4 }}
                    className="md:col-span-3 md:row-span-2 border border-border bg-card p-8 flex flex-col justify-between"
                >
                    <div>
                        <div className="bg-primary/10 mb-6 flex h-12 w-12 items-center justify-center text-primary">
                            <Cpu className="h-6 w-6" />
                        </div>
                        <h3 className="text-2xl font-bold uppercase tracking-tight mb-4">Hybrid RAG Architecture</h3>
                        <p className="text-muted-foreground">
                            Combining semantic vector search with industrial-strength keyword matching. 
                            Our retrieval pipeline ensures your agents always have the right context.
                        </p>
                    </div>
                    <div className="mt-8 flex gap-2">
                        <div className="h-1 w-full bg-primary" />
                        <div className="h-1 w-full bg-border" />
                        <div className="h-1 w-full bg-border" />
                    </div>
                </motion.div>

                {/* Sub Features */}
                <FeatureBentoCard 
                    className="md:col-span-3"
                    icon={Database}
                    title="Multi-Format Ingestion"
                    description="Drop PDF, DOCX, XLSX, and PPTX files directly into your agent's memory bank."
                />
                <FeatureBentoCard 
                    className="md:col-span-3"
                    icon={Zap}
                    title="SSE Data Streaming"
                    description="Real-time streaming responses for a zero-latency interactive chat experience."
                />
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section id="how-it-works" className="border-y border-border bg-muted/20 py-24">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row gap-16">
                <div className="md:w-1/3 space-y-6">
                    <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">The Pipeline</h2>
                    <p className="text-muted-foreground font-medium">From raw data to intelligent automation in three industrial steps.</p>
                    <div className="pt-8">
                        <Button variant="outline" className="rounded-none uppercase text-[10px] font-bold tracking-widest gap-2">
                            Explore Technical Docs <ArrowRight className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
                <div className="md:w-2/3 grid gap-8 sm:grid-cols-2">
                    <WorkflowStep 
                        number="01"
                        title="Ingest & Chunk"
                        description="Our system automatically splits and parses your documents into semantic fragments."
                    />
                    <WorkflowStep 
                        number="02"
                        title="Vectorize"
                        description="High-dimensional embeddings are generated and stored in our secure vector store."
                    />
                    <WorkflowStep 
                        number="03"
                        title="Context Merge"
                        description="User queries trigger a hybrid search across all connected knowledge bases."
                    />
                    <WorkflowStep 
                        number="04"
                        title="LLM Synthesis"
                        description="Proprietary models generate accurate, source-cited responses in real-time."
                    />
                </div>
            </div>
          </div>
        </section>

        {/* Performance Metrics */}
        <section className="py-24 bg-background">
            <div className="container mx-auto px-4 md:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <MetricCard label="Retrieval Accuracy" value="99.9%" />
                    <MetricCard label="Avg. SSE Latency" value="42ms" />
                    <MetricCard label="Tokens Processed" value="1.2B+" />
                    <MetricCard label="Uptime Reliability" value="99.99%" />
                </div>
            </div>
        </section>
        
        {/* Pricing Section */}
        <section id="pricing" className="py-24 border-t border-border">
          <div className="container mx-auto px-4 md:px-8">
            <div className="mb-16 text-center">
              <h2 className="text-4xl font-black uppercase tracking-tighter">Subscription Tiers</h2>
            </div>
            
            <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
               <PricingBox 
                  title="Standard"
                  price="Free"
                  features={["3 AI Agents", "Hybrid Search V1", "1GB Storage", "SSE Streaming"]}
               />
               <PricingBox 
                  title="Enterprise"
                  price="Custom"
                  features={["Unlimited Agents", "GraphRAG Integration", "Priority Support", "Custom Model Fine-tuning"]}
                  featured
               />
            </div>
          </div>
        </section>

        {/* Terminal CTA */}
        <section className="py-24">
            <div className="container mx-auto px-4 md:px-8">
                <div className="bg-zinc-950 border border-border/50 p-1 md:p-2 shadow-2xl">
                    <div className="border border-border/50 bg-background overflow-hidden">
                        <div className="h-10 border-b border-border bg-muted/30 px-4 flex items-center justify-between">
                            <div className="flex gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-zinc-800" />
                                <div className="h-2 w-2 rounded-full bg-zinc-800" />
                                <div className="h-2 w-2 rounded-full bg-zinc-800" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Terminal: Punch Studio</span>
                        </div>
                        <div className="p-8 md:p-16 text-center">
                            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8">Ready to deploy?</h2>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <Link href="/dashboard">
                                    <Button className="rounded-none h-14 px-12 text-xs font-bold uppercase tracking-[0.2em] w-full sm:w-auto">
                                        Launch Dashboard
                                    </Button>
                                </Link>
                                <Button variant="outline" className="rounded-none h-14 px-12 text-xs font-bold uppercase tracking-[0.2em] w-full sm:w-auto">
                                    Contact Support
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
      </main>

      <footer className="border-t border-border bg-muted/10 py-12">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="bg-primary h-6 w-6" />
              <span className="text-sm font-black uppercase tracking-tighter">Punch Studio</span>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              © 2026 PUNCH STUDIO SYSTEMS. ALL RIGHTS RESERVED.
            </div>
            <div className="flex gap-8">
              <Link href="#" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Github</Link>
              <Link href="#" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Documentation</Link>
              <Link href="#" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Status</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureBentoCard({ icon: Icon, title, description, className }: { icon: any, title: string, description: string, className?: string }) {
  return (
    <motion.div 
        whileHover={{ x: 4 }}
        className={cn("border border-border bg-card p-6", className)}
    >
        <div className="bg-primary/10 mb-4 flex h-10 w-10 items-center justify-center text-primary">
            <Icon className="h-5 w-5" />
        </div>
        <h4 className="text-lg font-bold uppercase tracking-tight mb-2">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}

function WorkflowStep({ number, title, description }: { number: string, title: string, description: string }) {
    return (
        <div className="space-y-4">
            <div className="text-2xl font-black text-primary opacity-50">{number}</div>
            <h4 className="text-xl font-bold uppercase tracking-tight">{title}</h4>
            <p className="text-sm text-muted-foreground font-medium">{description}</p>
        </div>
    )
}

function MetricCard({ label, value }: { label: string, value: string }) {
    return (
        <div className="border-l-2 border-primary pl-6 py-2">
            <div className="text-3xl font-black tracking-tighter">{value}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{label}</div>
        </div>
    )
}

function PricingBox({ title, price, features, featured }: { title: string, price: string, features: string[], featured?: boolean }) {
    return (
        <div className={cn(
            "p-8 border border-border flex flex-col",
            featured ? "bg-primary text-primary-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]" : "bg-card"
        )}>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-1">{title}</h3>
            <div className="text-4xl font-black mb-8">{price}</div>
            <ul className="space-y-4 mb-12 flex-1">
                {features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
                        <div className={cn("h-1.5 w-1.5", featured ? "bg-primary-foreground" : "bg-primary")} />
                        {f}
                    </li>
                ))}
            </ul>
            <Button className={cn(
                "rounded-none h-12 text-[10px] font-black uppercase tracking-widest",
                featured ? "bg-background text-foreground hover:bg-background/90" : ""
            )}>
                Get Started
            </Button>
        </div>
    )
}


