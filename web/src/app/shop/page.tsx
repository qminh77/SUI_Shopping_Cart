'use client';

import { useState, useEffect } from 'react';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WalletConnection } from '@/components/WalletConnection';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import Image from 'next/image';
import { PurchaseDialog } from '@/components/PurchaseDialog';
import { toast } from 'sonner';
import { SearchFilterBar, FilterState } from '@/components/SearchFilterBar';

interface Product {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    price: number;
    creator: string;
    objectId: string;
}

export default function ShopPage() {
    const client = useSuiClient();
    const account = useCurrentAccount();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        searchQuery: '',
        priceMin: '',
        priceMax: '',
        creatorAddress: '',
        sortBy: 'name-asc',
    });

    const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;

    useEffect(() => {
        const loadProducts = async () => {
            if (!PACKAGE_ID) {
                setError('Package ID not configured');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // Fetch Product NFTs
                // Note: In production, use Sui indexer or backend service to query all products
                // For now, we'll show products owned by the current user if connected
                // Otherwise show empty state with instructions

                if (!account) {
                    // No wallet connected - show empty state
                    setProducts([]);
                    setIsLoading(false);
                    return;
                }

                const productType = `${PACKAGE_ID}::product::Product`;

                const response = await client.getOwnedObjects({
                    owner: account.address,
                    filter: {
                        StructType: productType,
                    },
                    options: {
                        showContent: true,
                        showOwner: true,
                    },
                });

                // Parse products
                const fetchedProducts: Product[] = [];

                for (const obj of response.data) {
                    if (obj.data?.content?.dataType === 'moveObject') {
                        const fields = obj.data.content.fields as any;

                        fetchedProducts.push({
                            id: fields.id?.id || obj.data.objectId,
                            objectId: obj.data.objectId,
                            name: fields.name || 'Unknown Product',
                            description: fields.description || '',
                            imageUrl: fields.image_url || '',
                            price: Number(fields.price) / 1_000_000_000, // Convert MIST to SUI
                            creator: fields.creator || '',
                        });
                    }
                }

                setProducts(fetchedProducts);
            } catch (err) {
                console.error('Error loading products:', err);
                setError('Failed to load products from blockchain');
            } finally {
                setIsLoading(false);
            }
        };

        loadProducts();
    }, [client, PACKAGE_ID, account]);

    const formatSUI = (amount: number) => `${amount.toFixed(3)} SUI`;
    const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

    const handlePurchaseClick = (product: Product) => {
        if (!account) {
            toast.error('Please connect your wallet first');
            return;
        }
        setSelectedProduct(product);
        setIsPurchaseDialogOpen(true);
    };

    const handlePurchaseSuccess = () => {
        // Reload products after successful purchase
        const loadProducts = async () => {
            if (!PACKAGE_ID || !account) return;

            try {
                const productType = `${PACKAGE_ID}::product::Product`;
                const response = await client.getOwnedObjects({
                    owner: account.address,
                    filter: { StructType: productType },
                    options: { showContent: true, showOwner: true },
                });

                const fetchedProducts: Product[] = [];
                for (const obj of response.data) {
                    if (obj.data?.content?.dataType === 'moveObject') {
                        const fields = obj.data.content.fields as any;
                        fetchedProducts.push({
                            id: fields.id?.id || obj.data.objectId,
                            objectId: obj.data.objectId,
                            name: fields.name || 'Unknown Product',
                            description: fields.description || '',
                            imageUrl: fields.image_url || '',
                            price: Number(fields.price) / 1_000_000_000,
                            creator: fields.creator || '',
                        });
                    }
                }
                setProducts(fetchedProducts);
            } catch (err) {
                console.error('Error reloading products:', err);
            }
        };
        loadProducts();
    };

    const handleClearFilters = () => {
        setFilters({
            searchQuery: '',
            priceMin: '',
            priceMax: '',
            creatorAddress: '',
            sortBy: 'name-asc',
        });
    };

    // Filter and sort products
    const filteredProducts = products
        .filter((product) => {
            // Search filter
            if (filters.searchQuery && !product.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
                return false;
            }
            // Price range filter
            if (filters.priceMin && product.price < parseFloat(filters.priceMin)) {
                return false;
            }
            if (filters.priceMax && product.price > parseFloat(filters.priceMax)) {
                return false;
            }
            // Creator filter
            if (filters.creatorAddress && !product.creator.toLowerCase().includes(filters.creatorAddress.toLowerCase())) {
                return false;
            }
            return true;
        })
        .sort((a, b) => {
            switch (filters.sortBy) {
                case 'price-asc':
                    return a.price - b.price;
                case 'price-desc':
                    return b.price - a.price;
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                default:
                    return 0;
            }
        });

    return (
        <div className="min-h-screen bg-background">
            {/* Minimal Header */}
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="h-8 w-8 rounded bg-foreground text-background flex items-center justify-center font-bold">
                                S
                            </div>
                            <span className="text-lg font-bold tracking-tight">Sui Commerce</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href="/seller" className="text-sm font-medium hover:text-primary transition-colors">
                                Sell Product
                            </Link>
                            <WalletConnection />
                        </div>
                    </div>
                </div>
            </header>

            {/* Clean Hero Section */}
            <section className="border-b bg-secondary/20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-6">
                        <Badge variant="secondary" className="px-4 py-1.5 text-sm font-normal bg-background border rounded-full">
                            Sui Testnet Marketplace
                        </Badge>
                        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
                            Curated Digital Assets
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Discover valid and verified NFTs on the Sui blockchain.
                            Secure ownership, instant delivery.
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Search & Filter Bar */}
                {!error && !isLoading && (
                    <div className="mb-10">
                        <SearchFilterBar
                            filters={filters}
                            onFiltersChange={setFilters}
                            onClearFilters={handleClearFilters}
                        />
                    </div>
                )}

                {/* Products Grid */}
                {error ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <Card className="max-w-md w-full border-destructive/20 shadow-none">
                            <CardContent className="p-8 text-center space-y-4">
                                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto text-destructive">
                                    ⚠️
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-foreground">Unable to load products</h3>
                                    <p className="text-sm text-muted-foreground">{error}</p>
                                </div>
                                <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
                                    Try Again
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                ) : isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="space-y-4">
                                <div className="aspect-[4/5] bg-secondary/50 animate-pulse rounded-md" />
                                <div className="space-y-2">
                                    <div className="h-4 bg-secondary/50 rounded w-3/4 animate-pulse" />
                                    <div className="h-4 bg-secondary/50 rounded w-1/4 animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-6 text-center border-2 border-dashed rounded-lg border-secondary">
                        <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center text-3xl">
                            🔍
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold">No products found</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                {products.length === 0
                                    ? "Marketplace is currently empty. Be the first to list a product."
                                    : "Try adjusting your search or filters to find what you're looking for."}
                            </p>
                        </div>
                        <div className="pt-2">
                            {products.length === 0 ? (
                                <Link href="/seller">
                                    <Button size="lg" className="rounded-full px-8">List Item</Button>
                                </Link>
                            ) : (
                                <Button onClick={handleClearFilters} variant="outline" className="rounded-full">
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Results Meta */}
                        <div className="flex items-center justify-between mb-8 pb-4 border-b">
                            <p className="text-sm font-medium text-muted-foreground">
                                {filteredProducts.length} Results
                            </p>
                        </div>

                        {/* Minimalist Product Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                            {filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="group cursor-pointer"
                                >
                                    {/* Product Image Container */}
                                    <div className="relative aspect-[4/5] overflow-hidden bg-secondary/20 rounded-md mb-4">
                                        <Image
                                            src={product.imageUrl}
                                            alt={product.name}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />

                                        {/* Hover Overlay Actions */}
                                        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/60 to-transparent">
                                            <Button
                                                className="w-full bg-white text-black hover:bg-white/90 border-none shadow-lg"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePurchaseClick(product);
                                                }}
                                                disabled={!account}
                                            >
                                                {account ? 'Buy Now' : 'Connect Wallet'}
                                            </Button>
                                        </div>

                                        <div className="absolute top-3 left-3">
                                            <Badge variant="secondary" className="backdrop-blur-sm bg-white/90 text-black border-none text-xs font-medium">
                                                NFT
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Minimal Info */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="font-medium text-base text-foreground line-clamp-1 group-hover:underline decoration-1 underline-offset-4">
                                                {product.name}
                                            </h3>
                                            <span className="font-semibold text-base whitespace-nowrap">
                                                {formatSUI(product.price)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            by <span className="text-foreground">{formatAddress(product.creator)}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Trust Signals */}
                {!error && !isLoading && (
                    <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 border-t pt-12">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm uppercase tracking-wide">Blockchain Secured</h4>
                            <p className="text-sm text-muted-foreground">Every item is verified on the Sui network for authentic ownership.</p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm uppercase tracking-wide">Instant Settlement</h4>
                            <p className="text-sm text-muted-foreground">Lightning fast transactions with sub-second finality.</p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm uppercase tracking-wide">Low Fees</h4>
                            <p className="text-sm text-muted-foreground">Experience minimal gas fees for all your transactions.</p>
                        </div>
                    </div>
                )}
            </main>

            {/* Purchase Dialog */}
            <PurchaseDialog
                product={selectedProduct}
                open={isPurchaseDialogOpen}
                onOpenChange={setIsPurchaseDialogOpen}
                onSuccess={handlePurchaseSuccess}
            />

            {/* Clean Footer */}
            <footer className="border-t bg-background py-16 mt-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-center md:text-left space-y-2">
                            <h4 className="font-bold text-lg">Sui Commerce</h4>
                            <p className="text-sm text-muted-foreground">The premier marketplace for digital assets.</p>
                        </div>
                        <div className="flex gap-8 text-sm text-muted-foreground">
                            <span>Powered by Sui</span>
                            <span>Secure & Fast</span>
                            <span>Verified Assets</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
