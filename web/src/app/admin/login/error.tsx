'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Admin Login Error:', error)
    }, [error])

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-white p-10 text-black dark:bg-black dark:text-white">
            <h2 className="text-xl font-bold">Something went wrong!</h2>
            <p className="text-red-500">{error.message}</p>
            <button
                className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                onClick={() => reset()}
            >
                Try again
            </button>
        </div>
    )
}
