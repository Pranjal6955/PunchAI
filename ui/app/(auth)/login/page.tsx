"use client"

import { LoginForm } from "@/components/login-form"
import { DottedBackground } from "@/components/dotted-background"
import Image from "next/image"

export default function LoginPage() {
    return (
        <DottedBackground className="p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <a href="/" className="flex items-center gap-2 self-center">
                    <Image
                        src="/Logo_dark_theme.png"
                        alt="PunchAI Logo"
                        width={120}
                        height={40}
                        className="h-10 w-auto"
                    />
                </a>
                <LoginForm />
            </div>
        </DottedBackground>
    )
}
