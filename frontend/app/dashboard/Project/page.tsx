"use client"

import { useEffect, useState } from "react";
import { getProjects, Project, deleteProject } from "@/lib/api-session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Plus,
    Search,
    LayoutGrid,
    List,
    MoreVertical,
    Trash2,
    ExternalLink,
    Filter,
    ArrowUpDown,
    Code2
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import Image from "next/image";

const API_TYPE_LOGOS: Record<string, string> = {
    "Node.js": "/nodejs_2.svg",
    "Python": "/python_4.svg",
    "Go": "/Go_Logo_Blue.svg.png",
    "PHP": "/php_4.svg",
    "Ruby": "/ruby_4.svg",
    "Java": "/java_5.svg",
};

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [apiTypeFilter, setApiTypeFilter] = useState<string>("all");

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const data = await getProjects();
            setProjects(data);
        } catch (error) {
            toast.error("Failed to load projects");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchProjects();
    }, []);

    const handleDeleteProject = async (projectId: string) => {
        if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
            return;
        }

        try {
            const success = await deleteProject(projectId);
            if (success) {
                toast.success("Project deleted successfully");
                setProjects(projects.filter(p => p._id !== projectId));
            } else {
                toast.error("Failed to delete project");
            }
        } catch (error) {
            toast.error("An error occurred while deleting");
        }
    };

    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = apiTypeFilter === "all" || project.apiType === apiTypeFilter;
        return matchesSearch && matchesFilter;
    });

    const uniqueApiTypes = Array.from(new Set(projects.map(p => p.apiType)));

    if (loading && projects.length === 0) {
        return (
            <div className="p-4 space-y-8 w-full min-h-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-48 rounded-none" />
                        <Skeleton className="h-4 w-64 rounded-none" />
                    </div>
                    <Skeleton className="h-10 w-36 rounded-none" />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Skeleton className="h-10 flex-1 rounded-none" />
                    <Skeleton className="h-10 w-32 rounded-none" />
                    <Skeleton className="h-10 w-24 rounded-none" />
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-64 w-full rounded-none" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-8 w-full min-h-screen pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Your Projects</h1>
                    <p className="text-muted-foreground text-lg">
                        Manage your API workspaces and infrastructure.
                    </p>
                </div>
                <CreateProjectDialog onSuccess={fetchProjects} />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-muted/30 p-2 border border-border/40 backdrop-blur-sm">
                <div className="relative w-full lg:max-w-md group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                        placeholder="Search projects by name or description..."
                        className="pl-9 h-10 rounded-none border-border/60 bg-background focus:ring-0 focus-visible:ring-0 focus-visible:border-primary transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-none border-border/60 h-10 px-4 shrink-0 shadow-none gap-2">
                                <Filter className="mr-1 h-4 w-4" />
                                {apiTypeFilter !== "all" && API_TYPE_LOGOS[apiTypeFilter] && (
                                    <img src={API_TYPE_LOGOS[apiTypeFilter]} alt="" className="h-3.5 w-auto" />
                                )}
                                {apiTypeFilter === "all" ? "All Environments" : apiTypeFilter}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-none border-border/60 min-w-[180px]">
                            <DropdownMenuItem onClick={() => setApiTypeFilter("all")} className="cursor-pointer">
                                All Environments
                            </DropdownMenuItem>
                            {uniqueApiTypes.map(type => (
                                <DropdownMenuItem key={type} onClick={() => setApiTypeFilter(type)} className="cursor-pointer gap-2">
                                    {API_TYPE_LOGOS[type] && (
                                        <img src={API_TYPE_LOGOS[type]} alt="" className="h-4 w-auto object-contain" />
                                    )}
                                    {type}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex border border-border/60 p-0.5 shrink-0 bg-background">
                        <Button
                            variant={viewMode === "grid" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8 rounded-none shadow-none"
                            onClick={() => setViewMode("grid")}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8 rounded-none shadow-none"
                            onClick={() => setViewMode("list")}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Projects Display */}
            {filteredProjects.length === 0 ? (
                <Card className="border-dashed border-2 bg-transparent rounded-none shadow-none">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="h-16 w-16 rounded-none bg-muted flex items-center justify-center mb-6">
                            <Code2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-2xl font-medium">No projects found</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mt-2 mb-8">
                            {searchQuery || apiTypeFilter !== "all"
                                ? "No projects match your current search or filter criteria. Try adjusting them."
                                : "Get started by creating your first project to monitor and test your APIs."
                            }
                        </p>
                        {!searchQuery && apiTypeFilter === "all" ? (
                            <CreateProjectDialog onSuccess={fetchProjects} />
                        ) : (
                            <Button variant="outline" className="rounded-none" onClick={() => { setSearchQuery(""); setApiTypeFilter("all"); }}>
                                Clear Filters
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : viewMode === "grid" ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                        {filteredProjects.map((project, index) => (
                            <motion.div
                                key={project._id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2, delay: index * 0.03 }}
                            >
                                <Card className="group relative rounded-none border-border/60 bg-card hover:border-primary/50 transition-all duration-300 shadow-none hover:shadow-xl hover:shadow-primary/5 flex flex-col h-full overflow-hidden">
                                    <CardHeader className="pb-4 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-2">
                                                <Badge variant="secondary" className="rounded-none uppercase tracking-tighter text-[10px] font-bold px-3 py-2 border-border/40 min-w-[40px] justify-center bg-muted/60">
                                                    {API_TYPE_LOGOS[project.apiType] ? (
                                                        <img
                                                            src={API_TYPE_LOGOS[project.apiType]}
                                                            alt={project.apiType}
                                                            className="h-5 w-auto object-contain"
                                                        />
                                                    ) : project.apiType}
                                                </Badge>
                                                <Badge variant="outline" className="rounded-none capitalize text-[10px] font-medium px-2 py-0">
                                                    {project.role}
                                                </Badge>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none -mt-1 -mr-1">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-none border-border/60 min-w-[150px]">
                                                    <DropdownMenuItem asChild className="cursor-pointer">
                                                        <Link href={`/dashboard/Project/${project._id}`}>
                                                            <ExternalLink className="mr-2 h-4 w-4" />
                                                            View Dashboard
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    {project.role === "admin" && (
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive cursor-pointer"
                                                            onClick={() => handleDeleteProject(project._id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Project
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold group-hover:text-primary transition-colors leading-tight">
                                                {project.name}
                                            </h3>
                                            <p className="text-muted-foreground text-sm line-clamp-2 mt-2 min-h-[40px]">
                                                {project.description || "Experimental API workspace for testing and development."}
                                            </p>
                                        </div>
                                    </CardHeader>

                                    <CardFooter className="mt-auto pt-6 border-t border-border/40 flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                                        <span>
                                            Created {new Date(project.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                        </span>
                                        <Link href={`/dashboard/Project/${project._id}`}>
                                            <Button variant="link" className="h-auto p-0 text-[10px] uppercase font-bold tracking-widest text-primary hover:no-underline flex items-center group/btn">
                                                Details <ExternalLink className="ml-1 h-3 w-3 transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="border border-border/60 bg-card overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border/60 text-[10px] font-semibold tracking-widest text-muted-foreground bg-muted/30">
                        <div className="col-span-5 flex items-center">Project Name</div>
                        <div className="col-span-2 flex items-center">Environment</div>
                        <div className="col-span-2 flex items-center">Role</div>
                        <div className="col-span-2 flex items-center">Created</div>
                        <div className="col-span-1 flex items-center justify-end">Actions</div>
                    </div>
                    <AnimatePresence mode="popLayout">
                        {filteredProjects.map((project, index) => (
                            <motion.div
                                key={project._id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors items-center h-16"
                            >
                                <div className="col-span-5 font-semibold text-sm truncate pr-4">
                                    <Link href={`/dashboard/Project/${project._id}`} className="hover:text-primary transition-colors">
                                        {project.name}
                                    </Link>
                                </div>
                                <div className="col-span-2">
                                    <Badge variant="secondary" className="rounded-none uppercase text-[10px] font-bold px-3 py-2 border-border/40 min-w-[36px] justify-center bg-muted/60">
                                        {API_TYPE_LOGOS[project.apiType] ? (
                                            <img
                                                src={API_TYPE_LOGOS[project.apiType]}
                                                alt={project.apiType}
                                                className="h-4.5 w-auto object-contain"
                                            />
                                        ) : project.apiType}
                                    </Badge>
                                </div>
                                <div className="col-span-2">
                                    <Badge variant="outline" className="rounded-none capitalize text-[10px] font-medium px-2 py-0">
                                        {project.role}
                                    </Badge>
                                </div>
                                <div className="col-span-2 text-xs text-muted-foreground pr-4 truncate">
                                    {new Date(project.createdAt).toLocaleDateString()}
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-none border-border/60 min-w-[150px]">
                                            <DropdownMenuItem asChild className="cursor-pointer">
                                                <Link href={`/dashboard/Project/${project._id}`}>
                                                    <ExternalLink className="mr-2 h-4 w-4" />
                                                    Open
                                                </Link>
                                            </DropdownMenuItem>
                                            {project.role === "admin" && (
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive cursor-pointer"
                                                    onClick={() => handleDeleteProject(project._id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
