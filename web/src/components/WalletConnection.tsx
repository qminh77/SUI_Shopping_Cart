'use client';

import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';

export function WalletConnection() {
    const account = useCurrentAccount();

    return (
        <div className="flex items-center gap-3">
            <ConnectButton />
            {account && (
                <span className="hidden sm:inline text-xs text-muted-foreground font-mono">
                    {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </span>
            )}
        </div>
    );
}
