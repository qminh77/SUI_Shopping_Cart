'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Store, LogOut, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WalletConnectButton } from '@/components/WalletConnectButton'
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
        { href: '/admin/shops', label: 'Shops Management', icon: Store },
    ]

    return (
        // FORCE DARK MODE for the entire admin section
        <div className="dark flex min-h-screen w-full bg-black text-neutral-50 font-sans selection:bg-blue-500/30">

            {/* Background elements */}
            <div className="fixed inset-0 bg-black/90 pointer-events-none z-[-1]" />
            <div className="fixed inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none z-[-1]" />

            {/* Sidebar with Tech styling */}
            <aside className="fixed inset-y-0 left-0 z-20 w-64 border-r border-white/10 bg-black/40 backdrop-blur-xl flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-white/10 gap-3 bg-blue-900/5">
                    <div className="h-8 w-8 bg-blue-500/10 flex items-center justify-center border border-blue-500/30 cut-corner">
                        <ShieldCheck className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-sm font-bold tracking-widest text-white uppercase">Admin<span className="text-blue-500">CP</span></h2>
                        <span className="text-[10px] text-neutral-500 tracking-wider">v2.0.4</span>
                    </div>
                </div>
                <div className="flex-1 py-6 px-4 space-y-6">
                    <div className="space-y-1">
                        <div className="text-[10px] font-bold text-blue-500/80 uppercase tracking-widest px-3 mb-2">Main Modules</div>
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 text-sm font-medium transition-all duration-200 cut-corner-bottom-right border border-transparent",
                                    pathname === item.href
                                        ? "bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                                        : "text-neutral-400 hover:text-white hover:bg-white/5 hover:border-white/10"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="p-4 border-t border-white/10 bg-black/20">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/10 hover:border-red-500/20 border border-transparent transition-all cut-corner-bottom-right"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        TERMINATE SESSION
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 pl-64 flex flex-col min-h-screen">
                <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-white/10 bg-black/40 px-8 backdrop-blur-xl">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]"></span>
                            {pathname === '/admin/shops' ? 'SHOP DIRECTORY' : 'DASHBOARD'}
                        </h1>
                    </div>
                    <WalletConnectButton />
                </header>
                <div className="p-8 flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
