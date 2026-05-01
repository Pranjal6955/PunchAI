import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBots, deleteBot, Bot } from "@/lib/api-session";
import { toast } from "sonner";

export function useBots() {
    const queryClient = useQueryClient();

    const { data: bots = [], error, isLoading, refetch } = useQuery<Bot[]>({
        queryKey: ["bots-list"],
        queryFn: () => getBots(),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteBot,
        onSuccess: (success, botId) => {
            if (success) {
                queryClient.setQueryData(["bots-list"], (old: any) => 
                    old ? old.filter((b: any) => b.id !== botId) : []
                );
                toast.success("Agent deleted successfully");
            }
        },
        onError: () => {
            toast.error("Failed to delete agent");
        }
    });

    return {
        bots,
        error,
        isLoading,
        removeBot: deleteMutation.mutateAsync,
        mutate: refetch,
    };
}
