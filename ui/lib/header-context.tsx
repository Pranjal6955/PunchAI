"use client"

import * as React from "react"
import { createContext, useContext, useState } from "react"

interface HeaderContextType {
    title: string | null
    setTitle: (title: string | null) => void
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined)

export function HeaderProvider({ children }: { children: React.ReactNode }) {
    const [title, setTitle] = useState<string | null>(null)

    return (
        <HeaderContext.Provider value={{ title, setTitle }}>
            {children}
        </HeaderContext.Provider>
    )
}

export function useHeader() {
    const context = useContext(HeaderContext)
    if (context === undefined) {
        throw new Error("useHeader must be used within a HeaderProvider")
    }
    return context
}
