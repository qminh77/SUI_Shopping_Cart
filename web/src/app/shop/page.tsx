'use client';

import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import {
    Card,
    Text,
    Button,
    Grid,
    Badge,
    Image,
    Spacer,
    Loading,
    Page,
    useToasts
} from '@geist-ui/core';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ProductDetailDialog } from '@/components/ProductDetailDialog';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { mistToSui, formatAddress, Product } from '@/lib/sui-utils';
import Link from 'next/link';
import { ShoppingCart, Eye } from '@geist-ui/icons';

export default function ShopPage() {
    const account = useCurrentAccount();
    const { products, isLoading } = useProducts();
    const { addToCart, items: cartItems } = useCart();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const { setToast } = useToasts();

    const listedProducts = products?.filter(p => p.listed) || [];

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        setIsDetailOpen(true);
    };

    const handleQuickAddToCart = (e: React.MouseEvent<HTMLButtonElement>, product: Product) => {
        e.stopPropagation();
        // e.preventDefault();
        const isInCart = cartItems.some(item => item.id === product.id);

        if (isInCart) {
            setToast({ text: 'Product already in cart', type: 'warning' });
            return;
        }

        addToCart(product);
        setToast({ text: 'Added to cart!', type: 'success' });
    };

    return (
        <Page dotBackdrop width="100%" padding={0}>
            <Navigation />

            {/* Hero Section */}
            <div style={{
                background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                padding: '6rem 1rem 4rem',
                position: 'relative'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '800px',
                    height: '400px',
                    background: 'radial-gradient(ellipse at center, rgba(77, 162, 255, 0.1) 0%, transparent 70%)',
                    zIndex: -1,
                    filter: 'blur(80px)'
                }} />

                <Grid.Container justify="center" direction="column" alignItems="center">
                    <Grid>
                        <div style={{
                            background: 'rgba(77, 162, 255, 0.1)',
                            color: '#4DA2FF',
                            border: '1px solid rgba(77, 162, 255, 0.2)',
                            padding: '4px 12px',
                            fontSize: '0.8rem',
                            marginBottom: '1rem',
                            letterSpacing: '0.5px',
                            fontWeight: 600
                        }} className="cut-corner">
                            VERIFIED MARKETPLACE
                        </div>
                    </Grid>
                    <Grid>
                        <Text h2 style={{ margin: '1rem 0', textAlign: 'center', fontSize: '2.5rem', letterSpacing: '-1px' }}>
                            Discover <span style={{ color: '#4DA2FF' }}>NFT Products</span>
                        </Text>
                    </Grid>
                    <Grid>
                        <Text p type="secondary" style={{ maxWidth: '600px', textAlign: 'center', fontSize: '1.1rem', lineHeight: 1.6 }}>
                            Browse and purchase digital assets from verified creators.
                            Secured by the Sui blockchain.
                        </Text>
                    </Grid>
                </Grid.Container>
            </div>

            {/* Main Content */}
            <Page.Content>
                {/* Loading State */}
                {isLoading ? (
                    <Grid.Container gap={2} justify="center">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <Grid key={i} xs={24} sm={12} md={8} lg={6}>
                                <div style={{
                                    width: '100%',
                                    height: '350px',
                                    borderRadius: '16px',
                                    background: 'rgba(255,255,255,0.02)',
                                    animation: 'pulse 1.5s infinite'
                                }} />
                            </Grid>
                        ))}
                    </Grid.Container>
                ) : listedProducts.length === 0 ? (
                    /* Empty State */
                    <Grid.Container justify="center" direction="column" alignItems="center" style={{ minHeight: '40vh', opacity: 0.5 }}>
                        <Grid>
                            <ShoppingCart size={48} color="#666" />
                        </Grid>
                        <Grid>
                            <Text h4 my={1}>No Listings Found</Text>
                        </Grid>
                    </Grid.Container>
                ) : (
                    <>
                        {/* Results Meta */}
                        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
                            <Text small b style={{ color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {listedProducts.length} Items Found
                            </Text>
                        </div>

                        {/* Products Grid */}
                        <Grid.Container gap={2}>
                            {listedProducts.map((product) => {
                                const isInCart = cartItems.some(item => item.id === product.id);

                                return (
                                    <Grid xs={24} sm={12} md={8} lg={6} key={product.id}>
                                        <div
                                            onClick={() => handleProductClick(product)}
                                            style={{
                                                width: '100%',
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                position: 'relative'
                                            }}
                                            className="hover:scale-[1.02] hover:border-white/10 tech-border-glow cut-corner"
                                        >
                                            {/* Image */}
                                            <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#111' }}>
                                                <Image
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    width="100%"
                                                    height="100%"
                                                    style={{ objectFit: 'cover' }}
                                                    draggable={false}
                                                />
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '12px',
                                                    right: '12px',
                                                    background: 'rgba(0,0,0,0.6)',
                                                    backdropFilter: 'blur(4px)',
                                                    color: '#fff',
                                                    fontSize: '10px',
                                                    fontWeight: 600,
                                                    padding: '4px 8px',
                                                    border: '1px solid rgba(255,255,255,0.1)'
                                                }} className="cut-corner-bottom-right">
                                                    NFT
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div style={{ padding: '1.25rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                    <Text h4 my={0} style={{ fontSize: '1.1rem', fontWeight: 600 }} className="truncate">
                                                        {product.name}
                                                    </Text>
                                                </div>

                                                <Text p small type="secondary" style={{
                                                    height: '2.4em',
                                                    overflow: 'hidden',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    marginBottom: '1rem',
                                                    fontSize: '0.9rem',
                                                    lineHeight: 1.4
                                                }}>
                                                    {product.description}
                                                </Text>

                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    paddingTop: '1rem',
                                                    borderTop: '1px solid rgba(255,255,255,0.05)'
                                                }}>
                                                    <div>
                                                        <Text small style={{ color: '#666', fontSize: '0.75rem', display: 'block', marginBottom: '2px' }}>PRICE</Text>
                                                        <Text b style={{ fontSize: '1.1rem', color: '#fff' }}>{mistToSui(product.price)} SUI</Text>
                                                    </div>

                                                    {/* @ts-ignore */}
                                                    <Button
                                                        auto
                                                        scale={0.75}
                                                        type={isInCart ? 'secondary' : 'success'}
                                                        icon={<ShoppingCart />}
                                                        onClick={(e) => handleQuickAddToCart(e as any, product)}
                                                        disabled={isInCart}
                                                        style={{ borderRadius: 0, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}
                                                        className="cut-corner-bottom-right"
                                                    >
                                                        {isInCart ? 'Added' : 'Add'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Grid>
                                );
                            })}
                        </Grid.Container>
                    </>
                )}
            </Page.Content>

            <ProductDetailDialog
                product={selectedProduct}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
            />

            <Footer />
        </Page>
    );
}
