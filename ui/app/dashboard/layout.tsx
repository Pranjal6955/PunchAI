import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "PunchAI - Dashboard",
    description: "View your analytics and manage your projects on PunchAI.",
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
