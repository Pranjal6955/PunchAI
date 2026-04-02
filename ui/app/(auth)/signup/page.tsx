"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, FormProvider } from "react-hook-form"
import * as z from "zod"
import { SignupForm } from "@/components/signup-form"

const signupSchema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
})

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
    const methods = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
        },
    })

    const { handleSubmit, formState: { isSubmitting } } = methods

    function onSubmit(values: SignupFormValues) {
        console.log("Signup values:", values)
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <FormProvider {...methods}>
                <SignupForm
                    className="w-full max-w-[440px]"
                    onSubmit={handleSubmit(onSubmit)}
                    isLoading={isSubmitting}
                />
            </FormProvider>
        </div>
    )
}

