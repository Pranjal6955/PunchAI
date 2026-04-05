import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Punch Studio",
    template: "%s | Punch Studio",
  },
  description: "An webapp for Chatbot as a Service where user can customize and integrate to his website.",
  icons: {
    icon: "/Logo_dark_theme.png",
  },
};

import { TooltipProvider } from "@/components/ui/tooltip";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", "font-sans", inter.variable, geistMono.variable)}>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider delayDuration={0}>
          {children}
        </TooltipProvider>
        <Toaster closeButton position="top-right" />
      </body>
    </html>
  );
}
