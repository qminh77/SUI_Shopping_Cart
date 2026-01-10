'use client';

import { Loader2 } from 'lucide-react';
import { MatrixText } from './matrix-text';

export function LoadingScreen({ text = "Loading Interface" }: { text?: string }) {
    return (
        <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 bg-background/50 backdrop-blur-sm">
            <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-foreground/10 opacity-75 duration-1000"></div>
                <Loader2 className="h-8 w-8 animate-spin text-foreground" />
            </div>
            <div className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
                <MatrixText text={text} speed={40} />
            </div>
        </div>
    );
}
