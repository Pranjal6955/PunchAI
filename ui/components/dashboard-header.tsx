"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { getBot } from "@/lib/api-session";

export function DashboardHeader() {
  const pathname = usePathname();
  const params = useParams();
  const [botName, setBotName] = useState<string | null>(null);

  useEffect(() => {
    const fetchBotName = async () => {
      const id = params?.Id as string;
      if (id) {
        try {
          const bot = await getBot(id);
          if (bot) setBotName(bot.name);
        } catch (error) {
          console.error("Failed to fetch bot for breadcrumb", error);
        }
      } else {
        setBotName(null);
      }
    };
    fetchBotName();
  }, [params?.Id]);

  interface Crumb {
    label: string;
    href: string;
    current: boolean;
  }

  const getBreadcrumbs = (): Crumb[] => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: { label: string; href: string; current: boolean }[] = [];
    let currentPath = "";

    // Mapping for user-friendly labels
    const labelMap: Record<string, string> = {
      dashboard: "Dashboard",
      chatbot: "Chatbots",
      dataSource: "Data Sources",

    };

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      // Check if it's likely an ID (comes after chatbot/Project and doesn't match keys)
      const isId = index > 0 &&
        (segments[index - 1] === "chatbot" || segments[index - 1] === "Project") &&
        !labelMap[segment];

      let label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

      if (isId) {
        label = botName || "Loading...";
      }

      breadcrumbs.push({
        label,
        href: currentPath,
        current: isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <BreadcrumbItem className="hidden md:block">
                  {crumb.current ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {idx < breadcrumbs.length - 1 && (
                  <BreadcrumbSeparator className="hidden md:block" />
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
