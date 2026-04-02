"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, FormProvider } from "react-hook-form"
import * as z from "zod"
import { LoginForm } from "@/components/login-form"
import { authApi } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    remember: z.boolean().optional(),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
    const router = useRouter()
    const methods = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
            remember: false,
        },
    })

    const { handleSubmit, formState: { isSubmitting } } = methods

    async function onSubmit(values: LoginFormValues) {
        try {
            const response = await authApi.login({
                email: values.email,
                password: values.password,
            });

            // Store token
            localStorage.setItem("accessToken", response.accessToken);
            localStorage.setItem("user", JSON.stringify(response.user));

            toast.success("Login successful! Redirecting...");

            router.push("/dashboard");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Invalid credentials. Please try again.");
            console.error("Login error:", error);
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <FormProvider {...methods}>
                <LoginForm
                    className="w-full max-w-[400px]"
                    onSubmit={handleSubmit(onSubmit)}
                    isLoading={isSubmitting}
                />
            </FormProvider>
        </div>
    )
}

