import { useQuery } from "@tanstack/react-query";
import { getChat } from "@/lib/api-session";

export function useChatDetails(chatId: string | null) {
    const { data: chat, error, isLoading } = useQuery({
        queryKey: ["chat", chatId],
        queryFn: () => getChat(chatId!),
        enabled: !!chatId,
    });

    return {
        chat,
        error,
        isLoading,
    };
}
