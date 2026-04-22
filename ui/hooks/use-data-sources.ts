import useSWR from "swr";
import { getDataSources, deleteDataSource } from "@/lib/api-session";
import { toast } from "sonner";

export function useDataSources(botId: string | null) {
    const { data: dataSources = [], error, mutate, isLoading } = useSWR(
        botId ? ["data-sources", botId] : null,
        () => (botId ? getDataSources(botId) : [])
    );

    const removeDataSource = async (dsId: string) => {
        try {
            const success = await deleteDataSource(dsId);
            if (success) {
                mutate(dataSources.filter(ds => ds.id !== dsId), false);
                toast.success("Data source removed");
                return true;
            }
        } catch (e) {
            toast.error("Failed to delete data source");
        }
        return false;
    };

    return {
        dataSources,
        error,
        isLoading,
        removeDataSource,
        mutate,
    };
}
