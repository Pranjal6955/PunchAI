"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
    FieldError,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"
import { useFormContext } from "react-hook-form"

interface SignupFormProps extends React.ComponentProps<"div"> {
    onSubmit: (e: React.FormEvent) => void;
    isLoading?: boolean;
}

export function SignupForm({
    className,
    onSubmit,
    isLoading,
    ...props
}: SignupFormProps) {
    const { register, formState: { errors } } = useFormContext()

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <form onSubmit={onSubmit}>
                <FieldGroup>
                    <div className="flex flex-col items-center gap-2 text-center">
                        <Link
                            href="/"
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="flex items-center justify-center rounded-md">
                                <Image
                                    src="/Logo_dark_theme.png"
                                    alt="PunchAI Logo"
                                    width={64}
                                    height={64}
                                    priority
                                    className="object-contain"
                                />
                            </div>
                            <span className="sr-only">PunchAI</span>
                        </Link>
                        <h1 className="text-xl font-bold">Create an account</h1>
                        <FieldDescription>
                            Already have an account? <Link href="/login" className="font-bold text-primary underline underline-offset-4">Login</Link>
                        </FieldDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Field>
                            <FieldLabel htmlFor="firstName">First name</FieldLabel>
                            <Input
                                id="firstName"
                                placeholder="John"
                                {...register("firstName")}
                            />
                            {errors.firstName && <FieldError>{errors.firstName.message as string}</FieldError>}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                            <Input
                                id="lastName"
                                placeholder="Doe"
                                {...register("lastName")}
                            />
                            {errors.lastName && <FieldError>{errors.lastName.message as string}</FieldError>}
                        </Field>
                    </div>
                    <Field>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            {...register("email")}
                        />
                        {errors.email && <FieldError>{errors.email.message as string}</FieldError>}
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            {...register("password")}
                        />
                        {errors.password && <FieldError>{errors.password.message as string}</FieldError>}
                    </Field>
                    <Field>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Creating account..." : "Sign up"}
                        </Button>
                    </Field>
                    <FieldSeparator>Or</FieldSeparator>
                    <Field className="grid gap-4">
                        <Button variant="outline" type="button" className="w-full">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                                <path
                                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                    fill="currentColor"
                                />
                            </svg>
                            Continue with Google
                        </Button>
                    </Field>
                </FieldGroup>
            </form>
            <FieldDescription className="px-6 text-center">
                By clicking continue, you agree to our <Link href="#">Terms of Service</Link>{" "}
                and <Link href="#">Privacy Policy</Link>.
            </FieldDescription>
        </div>
    )
}
