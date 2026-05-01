import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile, uploadAvatar } from "@/lib/api-session";
import { toast } from "sonner";

export function useUser() {
    const queryClient = useQueryClient();

    const { data: user, error, isLoading, refetch } = useQuery({
        queryKey: ["user-profile"],
        queryFn: getProfile,
    });

    const updateProfileMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateProfile(id, data),
        onSuccess: (updated) => {
            if (updated) {
                queryClient.setQueryData(["user-profile"], updated);
                toast.success("Profile updated");
            }
        },
        onError: () => {
            toast.error("Failed to update profile");
        }
    });

    const updatePasswordMutation = useMutation({
        mutationFn: ({ id, password }: { id: string; password: string }) => updateProfile(id, { password }),
        onSuccess: (updated) => {
            if (updated) {
                toast.success("Password updated");
            }
        },
        onError: () => {
            toast.error("Failed to update password");
        }
    });

    const uploadAvatarMutation = useMutation({
        mutationFn: uploadAvatar,
        onSuccess: (updated) => {
            if (updated) {
                queryClient.setQueryData(["user-profile"], updated);
                toast.success("Avatar updated");
            }
        },
        onError: () => {
            toast.error("Failed to upload avatar");
        }
    });

    return {
        user,
        error,
        isLoading,
        updateUserName: (name: string) => user && updateProfileMutation.mutateAsync({ id: user.id, data: { name } }),
        updateUserPassword: (password: string) => user && updatePasswordMutation.mutateAsync({ id: user.id, password }),
        uploadUserAvatar: uploadAvatarMutation.mutateAsync,
        mutate: refetch,
    };
}
