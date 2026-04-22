import useSWR from "swr";
import { getProfile, updateProfile, uploadAvatar } from "@/lib/api-session";
import { toast } from "sonner";

export function useUser() {
    const { data: user, error, mutate, isLoading } = useSWR("user-profile", getProfile);

    const updateUserName = async (name: string) => {
        if (!user) return;
        try {
            const updated = await updateProfile(user.id, { name });
            if (updated) {
                mutate(updated, false);
                toast.success("Profile updated");
                return updated;
            }
        } catch (e) {
            toast.error("Failed to update profile");
        }
    };

    const updateUserPassword = async (password: string) => {
        if (!user) return;
        try {
            const updated = await updateProfile(user.id, { password });
            if (updated) {
                toast.success("Password updated");
                return updated;
            }
        } catch (e) {
            toast.error("Failed to update password");
        }
    };

    const uploadUserAvatar = async (file: File) => {
        try {
            const updated = await uploadAvatar(file);
            if (updated) {
                mutate(updated, false);
                toast.success("Avatar updated");
                return updated;
            }
        } catch (e) {
            toast.error("Failed to upload avatar");
        }
    };

    return {
        user,
        error,
        isLoading,
        updateUserName,
        updateUserPassword,
        uploadUserAvatar,
        mutate,
    };
}
