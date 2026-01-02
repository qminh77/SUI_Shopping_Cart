'use client';

export function Footer() {
    return (
        <footer className="mt-24 pb-12 border-t border-white/5 bg-black">
            <div className="max-w-7xl mx-auto px-6 pt-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {/* Brand Section */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-6">
                                <svg viewBox="0 0 384 512" className="h-full w-auto drop-shadow-[0_0_8px_rgba(77,162,255,0.3)]">
                                    <defs>
                                        <linearGradient id="suiGradientFooter" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#4DA2FF" />
                                            <stop offset="100%" stopColor="#3D5E99" />
                                        </linearGradient>
                                    </defs>
                                    <path
                                        d="M192 0C86 0 0 172 0 286.5c0 124.5 86 225.5 192 225.5s192-101 192-225.5C384 172 298 0 192 0z"
                                        fill="url(#suiGradientFooter)"
                                    />
                                </svg>
                            </div>
                            <span className="font-sans font-bold text-lg tracking-tight text-white flex gap-1.5">
                                SUI <span className="font-light opacity-60">COMMERCE</span>
                            </span>
                        </div>
                        <p className="text-neutral-500 text-sm leading-relaxed max-w-sm">
                            The premier decentralized marketplace built on the Sui Network.
                            <br />Fast, secure, and verifiable digital assets.
                        </p>
                    </div>

                    {/* Links/Info Section */}
                    <div className="flex flex-col md:flex-row gap-6 md:justify-end text-xs uppercase tracking-widest text-neutral-500 font-mono">
                        <span className="hover:text-blue-400 transition-colors cursor-default">Powered by Sui</span>
                        <span className="hover:text-blue-400 transition-colors cursor-default">Secure & Fast</span>
                        <span className="hover:text-blue-400 transition-colors cursor-default">Verified Assets</span>
                    </div>
                </div>

                <div className="mt-12 text-center pt-8 border-t border-white/5">
                    <p className="text-neutral-600 text-xs font-mono">
                        &copy; {new Date().getFullYear()} SUI COMMERCE. ALL RIGHTS RESERVED.
                    </p>
                </div>
            </div>
        </footer>
    );
}
