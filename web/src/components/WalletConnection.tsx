'use client';

import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';

export function WalletConnection() {
    const account = useCurrentAccount();

    return (
        <div className="flex items-center gap-0">
            <div className="wallet-adapter-button-trigger" style={{ zIndex: 10 }}>
                <ConnectButton />
            </div>
            {account && (
                <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(77, 162, 255, 0.3)',
                    borderLeft: 'none',
                    padding: '0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    height: '40px',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                }} className="hidden sm:flex group hover:bg-white/5">
                    <div className="flex flex-col items-end justify-center leading-none">
                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-mono mb-[2px]">Wallet</span>
                        <span className="text-xs text-white font-mono tracking-wider font-bold">
                            {account.address.slice(0, 4)}...{account.address.slice(-4)}
                        </span>
                    </div>
                    <div className="w-1.5 h-1.5 bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse" />
                </div>
            )}
        </div>
    );
}
