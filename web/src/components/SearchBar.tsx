'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useDebouncedSearch } from '@/hooks/useSearch';
import Link from 'next/link';
import { mistToSui } from '@/lib/sui-utils';

interface SearchBarProps {
    onSearch?: (query: string) => void;
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
}

export function SearchBar({
    onSearch,
    placeholder = "Search products...",
    className,
    autoFocus = false
}: SearchBarProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { query, setQuery, debouncedQuery, products, suggestions, isLoading } = useDebouncedSearch('', 300);

    // Handle search submission
    const handleSearch = () => {
        if (query.trim()) {
            onSearch?.(query.trim());
            setShowSuggestions(false);
            inputRef.current?.blur();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            inputRef.current?.blur();
        }
    };

    const handleClear = () => {
        setQuery('');
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    // Show suggestions when focused and has query
    useEffect(() => {
        setShowSuggestions(isFocused && debouncedQuery.length >= 2);
    }, [isFocused, debouncedQuery]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={cn("relative w-full max-w-2xl", className)}>
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />

                <Input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className={cn(
                        "w-full pl-12 pr-12 py-6 bg-black/40 border-white/20 text-white placeholder:text-white/40",
                        "focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all",
                        isFocused && "bg-black/60 border-blue-500/50"
                    )}
                />

                {/* Loading or Clear Icon */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    ) : query ? (
                        <button
                            onClick={handleClear}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                            aria-label="Clear search"
                        >
                            <X className="w-4 h-4 text-white/60 hover:text-white" />
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (suggestions.length > 0 || products.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl max-h-[400px] overflow-y-auto z-50">
                    {/* Product Results */}
                    {products.length > 0 && (
                        <div className="p-2">
                            <div className="px-3 py-2 text-xs font-semibold text-white/50 uppercase tracking-wide">
                                Products
                            </div>
                            {products.slice(0, 5).map(product => (
                                <Link
                                    key={product.id}
                                    href={`/shop?productId=${product.id}`}
                                    className="block p-3 hover:bg-white/10 rounded transition-colors"
                                    onClick={() => setShowSuggestions(false)}
                                >
                                    <div className="flex items-center gap-3">
                                        {product.imageUrl && (
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                className="w-12 h-12 object-cover rounded border border-white/10"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-white truncate">
                                                {product.name}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-sm text-blue-400 font-semibold">
                                                    {mistToSui(product.price).toFixed(2)} SUI
                                                </span>
                                                {product.categoryName && (
                                                    <span className="text-xs text-white/40">
                                                        {product.categoryIcon} {product.categoryName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Search Suggestions */}
                    {suggestions.length > 0 && (
                        <div className="p-2 border-t border-white/10">
                            <div className="px-3 py-2 text-xs font-semibold text-white/50 uppercase tracking-wide">
                                Suggestions
                            </div>
                            {suggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setQuery(suggestion);
                                        handleSearch();
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
                                >
                                    <Search className="inline w-3 h-3 mr-2 opacity-40" />
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* No Results */}
                    {products.length === 0 && suggestions.length === 0 && !isLoading && (
                        <div className="p-6 text-center text-white/40">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No results found for &quot;{debouncedQuery}&quot;</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
