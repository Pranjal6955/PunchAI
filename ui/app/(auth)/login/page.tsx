"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, FormProvider } from "react-hook-form"
import * as z from "zod"
import { LoginForm } from "@/components/login-form"

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    remember: z.boolean().optional(),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
    const methods = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
            remember: false,
        },
    })

    const { handleSubmit, formState: { isSubmitting } } = methods

    function onSubmit(values: LoginFormValues) {
        console.log("Login values:", values)
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

