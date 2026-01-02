'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Store, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConnectButton } from '@suiet/wallet-kit'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()

    // If login page, don't show admin sidebar layout
    if (pathname === '/admin/login') {
        return <>{children}</>
    }

    const handleLogout = async () => {
        try {
            await fetch('/api/admin/logout', { method: 'POST' })
            router.push('/admin/login')
            toast.success('Logged out')
        } catch {
            // ignore
        }
    }

    const navItems = [
        { href: '/admin/shops', label: 'Shops', icon: Store },
    ]

    return (
        <div className="flex min-h-screen w-full bg-gray-50 dark:bg-gray-900">
            {/* Sidebar - Manual Implementation */}
            <aside className="fixed inset-y-0 left-0 z-10 w-64 border-r bg-white dark:bg-gray-800 flex flex-col">
                <div className="h-16 flex items-center px-6 border-b">
                    <h2 className="text-xl font-bold">AdminCP</h2>
                </div>
                <div className="flex-1 py-6 px-4 space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">Management</div>
                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                    pathname === item.href
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="p-4 border-t">
                    <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </aside>

            <main className="flex-1 pl-64 flex flex-col min-h-screen">
                <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white/80 px-6 backdrop-blur dark:bg-gray-800/80">
                    <h1 className="text-lg font-semibold">
                        {pathname === '/admin/shops' ? 'Shop Management' : 'Admin'}
                    </h1>
                    <ConnectButton />
                </header>
                <div className="p-6 flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
