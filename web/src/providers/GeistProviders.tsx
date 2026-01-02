'use client';

import { GeistProvider, CssBaseline } from '@geist-ui/core';
import MouseSpotlight from '@/components/ui/MouseSpotlight';

export function GeistProviders({ children }: { children: React.ReactNode }) {
    return (
        <GeistProvider themeType="dark">
            <CssBaseline />
            <MouseSpotlight />
            {children}
        </GeistProvider>
    );
}
