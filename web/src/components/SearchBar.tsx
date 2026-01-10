'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchBarProps {
    onSearch?: (query: string) => void;
    placeholder?: string;
    defaultValue?: string;
    className?: string;
}

export function SearchBar({
    onSearch,
    placeholder = 'Search products...',
    defaultValue = '',
    className
}: SearchBarProps) {
    const [query, setQuery] = useState(defaultValue);

    const handleSearch = (value: string) => {
        setQuery(value);
        onSearch?.(value);
    };

    const handleClear = () => {
        setQuery('');
        onSearch?.('');
    };

    return (
        <div className={cn("relative w-full", className)}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-10 h-11 bg-background"
            />
            {query && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={handleClear}
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear search</span>
                </Button>
            )}
        </div>
    );
}
