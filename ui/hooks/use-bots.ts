import useSWR from "swr";
import { getBots, deleteBot } from "@/lib/api-session";
import { toast } from "sonner";

export function useBots() {
    const { data: bots = [], error, mutate, isLoading } = useSWR("all-bots", getBots);

    const removeBot = async (botId: string) => {
        try {
            const success = await deleteBot(botId);
            if (success) {
                mutate(bots.filter(b => b.id !== botId), false);
                toast.success("Agent deleted successfully");
                return true;
            }
        } catch (e) {
            toast.error("Failed to delete agent");
        }
        return false;
    };

    return {
        bots,
        error,
        isLoading,
        removeBot,
        mutate,
    };
}
