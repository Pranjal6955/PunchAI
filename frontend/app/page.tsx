import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Bot, Command, Sparkles, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navigation */}
      <nav className="flex h-16 items-center justify-between px-6 border-b border-zinc-100 dark:border-zinc-900 lg:px-20">
        <div className="flex items-center gap-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
            <Image
              src="/Logo_dark_theme.png"
              alt="PunchAI Logo"
              width={32}
              height={32}
              className="rounded-lg object-contain"
            />
          </div>
          <span className="text-xl font-bold tracking-tight">PunchAI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-sm font-medium">Login</Button>
          </Link>
          <Link href="/dashboard">
            <Button className="bg-black text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200 gap-2">
              Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center lg:px-20">
        <div className="relative isolate">
          {/* Background decorative elements */}
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-zinc-200 to-zinc-400 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
          </div>

          <div className="max-w-3xl py-32">
            <div className="mb-8 flex justify-center">
              <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400 ring-1 ring-zinc-100 dark:ring-zinc-800 hover:ring-zinc-200 transition-all cursor-default flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span>Next-generation AI for your business</span>
              </div>
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-black dark:text-zinc-50 sm:text-7xl">
              Turn your data into <span className="text-zinc-400 dark:text-zinc-500">conversations.</span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              PunchAI connects to your websites, docs, and APIs to create intelligent chatbots that understand your business perfectly. Deploy in minutes, not months.
            </p>

            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/dashboard">
                <Button size="lg" className="bg-black text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200 h-14 px-8 text-lg font-semibold shadow-xl transition-all hover:scale-105 active:scale-95 gap-2">
                  Get Started for Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button variant="ghost" size="lg" className="text-lg font-semibold h-14 px-8 underline underline-offset-4">
                  Read Documentation
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mx-auto mt-20 max-w-7xl px-6 lg:px-8 pb-32">
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            <Card className="p-8 border-zinc-100 dark:border-zinc-900 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm">
              <div className="flex flex-col gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white dark:bg-zinc-800">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">Instant Integration</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Sync your existing websites and documents with a single click. No coding required.
                </p>
              </div>
            </Card>
            <Card className="p-8 border-zinc-100 dark:border-zinc-900 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm">
              <div className="flex flex-col gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white dark:bg-zinc-800">
                  <Bot className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">Custom AI Agents</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Fine-tune behavior and personality to match your brand's unique voice and tone.
                </p>
              </div>
            </Card>
            <Card className="p-8 border-zinc-100 dark:border-zinc-900 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm">
              <div className="flex flex-col gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white dark:bg-zinc-800">
                  <Command className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">Enterprise Analytics</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Grainular insights into usage, performance, and user satisfaction across all sessions.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-100 dark:border-zinc-900 py-10 px-6 lg:px-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 grayscale opacity-50">
            <Image
              src="/Logo_dark_theme.png"
              alt="PunchAI Logo"
              width={24}
              height={24}
              className="rounded-lg object-contain"
            />
            <span className="text-sm font-semibold tracking-tight uppercase">PunchAI</span>
          </div>
          <p className="text-zinc-400 dark:text-zinc-600 text-xs">
            © 2026 PunchAI Inc. All rights reserved. Built with Next.js and Tailwind.
          </p>
        </div>
      </footer>
    </div>
  )
}
