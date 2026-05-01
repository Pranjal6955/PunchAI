import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllOwnerChats, deleteChat, Chat } from "@/lib/api-session";
import { toast } from "sonner";

export function useChats(isExternal?: boolean) {
    const queryClient = useQueryClient();

    const { data: chats = [], error, isLoading, refetch } = useQuery<Chat[]>({
        queryKey: ["chats", isExternal],
        queryFn: () => getAllOwnerChats(isExternal),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteChat,
        onSuccess: (success, chatId) => {
            if (success) {
                queryClient.invalidateQueries({ queryKey: ["chats"] });
                toast.success("Conversation deleted");
            }
        },
        onError: () => {
            toast.error("Failed to delete conversation");
        }
    });

    return {
        chats,
        error,
        isLoading,
        removeChat: deleteMutation.mutateAsync,
        mutate: refetch,
        isDeleting: deleteMutation.isPending,
    };
}
