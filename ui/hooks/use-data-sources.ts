import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDataSources, deleteDataSource, DataSource } from "@/lib/api-session";
import { toast } from "sonner";

export function useDataSources(botId: string | null) {
    const queryClient = useQueryClient();

    const { data: dataSources = [], error, isLoading, refetch } = useQuery<DataSource[]>({
        queryKey: ["data-sources", botId],
        queryFn: () => (botId ? getDataSources(botId) : Promise.resolve([])),
        enabled: !!botId,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteDataSource,
        onSuccess: (success, dsId) => {
            if (success) {
                queryClient.setQueryData(["data-sources", botId], (old: any) => 
                    old ? old.filter((ds: any) => ds.id !== dsId) : []
                );
                toast.success("Data source removed");
            }
        },
        onError: () => {
            toast.error("Failed to delete data source");
        }
    });

    return {
        dataSources,
        error,
        isLoading,
        removeDataSource: deleteMutation.mutateAsync,
        mutate: refetch,
    };
}
