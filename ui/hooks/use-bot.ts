import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBot, updateBot, Bot } from "@/lib/api-session";
import { toast } from "sonner";

export function useBot(botId: string | undefined) {
    const queryClient = useQueryClient();

    const { data: bot, error, isLoading, refetch } = useQuery<Bot | null>({
        queryKey: ["bot", botId],
        queryFn: () => getBot(botId!),
        enabled: !!botId,
    });

    const updateBotMutation = useMutation({
        mutationFn: (data: Partial<Omit<Bot, "id">>) => updateBot(botId!, data),
        onSuccess: (updated) => {
            if (updated) {
                queryClient.setQueryData(["bot", botId], updated);
                // Also update the list if it exists
                queryClient.invalidateQueries({ queryKey: ["bots-list"] });
            }
        },
        onError: () => {
            toast.error("Failed to update agent");
        }
    });

    return {
        bot,
        error,
        isLoading,
        updateBotData: updateBotMutation.mutateAsync,
        mutate: refetch,
    };
}
