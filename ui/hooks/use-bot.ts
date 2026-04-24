import useSWR from "swr";
import { getBot, updateBot, Bot } from "@/lib/api-session";
import { toast } from "sonner";

export function useBot(botId: string | undefined) {
    const { data: bot, error, mutate, isLoading } = useSWR(
        botId ? `bot-${botId}` : null,
        () => getBot(botId!)
    );

    const updateBotData = async (data: Partial<Omit<Bot, "id">>) => {
        if (!botId) return;
        try {
            const updated = await updateBot(botId, data);
            if (updated) {
                mutate(updated, false);
                return updated;
            }
        } catch (e) {
            toast.error("Failed to update agent");
        }
        return null;
    };

    return {
        bot,
        error,
        isLoading,
        updateBotData,
        mutate,
    };
}
