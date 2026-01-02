'use client';

import {
    Modal,
    Button,
    Tag,
    Text,
    Grid,
    Image,
    Divider,
    Snippet,
    useToasts,
    Loading
} from '@geist-ui/core';
import { Product, mistToSui, formatAddress } from '@/lib/sui-utils';
import { useCart } from '@/contexts/CartContext';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useProducts } from '@/hooks/useProducts';
import { useKiosk } from '@/hooks/useKiosk';
import { ShoppingCart, Clock } from '@geist-ui/icons';

interface ProductDetailDialogProps {
    product: Product | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    kioskId?: string; // Optional: Kiosk ID where product is listed
}

export function ProductDetailDialog({ product, open, onOpenChange, kioskId }: ProductDetailDialogProps) {
    const { addToCart, items } = useCart();
    const account = useCurrentAccount();
    const { purchaseProduct, isPurchasing: isLegacyPurchasing } = useProducts();
    const { purchaseFromKiosk, isPurchasing: isKioskPurchasing } = useKiosk(account?.address);
    const { setToast } = useToasts();

    const isPurchasing = isLegacyPurchasing || isKioskPurchasing;

    if (!product) return null;

    const isInCart = items.some(item => item.id === product.id);

    const handleAddToCart = () => {
        addToCart(product);
        setToast({ text: 'Added to cart!', type: 'success' });
    };

    const handleBuyNow = async () => {
        if (!account) {
            setToast({ text: 'Please connect your wallet', type: 'error' });
            return;
        }

        try {
            if (kioskId) {
                await purchaseFromKiosk({
                    kioskId,
                    productId: product.id,
                    price: product.price,
                    productName: product.name,
                    seller: product.creator,
                });
            } else {
                // Legacy purchase (for products not in Kiosk)
                await purchaseProduct({
                    productId: product.id,
                    price: product.price,
                    seller: product.creator,
                });
            }
            onOpenChange(false);
        } catch (error) {
            console.error('Purchase error:', error);
            setToast({ text: 'Purchase failed', type: 'error' });
        }
    };

    return (
        <Modal visible={open} onClose={() => onOpenChange(false)} width="60rem">
            <Modal.Content>
                <Grid.Container gap={2}>
                    {/* Product Image - Left Side */}
                    <Grid xs={24} md={12}>
                        <div style={{ position: 'relative', width: '100%', borderRadius: '8px', overflow: 'hidden', background: '#333' }}>
                            <Image
                                src={product.imageUrl}
                                alt={product.name}
                                width="100%"
                                height="100%"
                                style={{ objectFit: 'cover', aspectRatio: '1/1' }}
                            />
                            <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                                <Tag type="lite">NFT Product</Tag>
                            </div>
                        </div>
                    </Grid>

                    {/* Product Details - Right Side */}
                    <Grid xs={24} md={12} direction="column">
                        {/* Header Info */}
                        <div style={{ width: '100%' }}>
                            {/* @ts-ignore */}
                            <Grid.Container justify="space-between" alignItems="center">
                                <Text small type="secondary">
                                    Seller: {formatAddress(product.creator)}
                                </Text>
                                <Tag type={product.listed ? 'success' : 'warning'}>
                                    {product.listed ? 'Listed' : 'Unlisted'}
                                </Tag>
                            </Grid.Container>

                            <Text h2 style={{ marginBottom: '0.5rem' }}>{product.name}</Text>

                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                <Text h2 type="success" my={0}>{mistToSui(product.price)}</Text>
                                <Text span type="secondary">SUI</Text>
                            </div>
                        </div>

                        <Divider h={2} />

                        {/* Description */}
                        <div>
                            <Text h5 style={{ textTransform: 'uppercase', color: '#666', fontSize: '0.8rem', letterSpacing: '1px' }}>About</Text>
                            <Text p style={{ lineHeight: '1.6' }}>
                                {product.description}
                            </Text>
                        </div>

                        {/* Product Meta */}
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                            <Grid.Container gap={1}>
                                <Grid xs={24}>
                                    <Text small type="secondary" style={{ display: 'block', marginBottom: '0.2rem' }}>Product ID</Text>
                                    <Snippet symbol="" text={product.id} width="100%" type="dark" />
                                </Grid>
                                <Grid xs={24}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <Clock size={16} />
                                        <Text small>Created {new Date(product.createdAt).toLocaleDateString()}</Text>
                                    </div>
                                </Grid>
                            </Grid.Container>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* @ts-ignore */}
                            <Button
                                shadow
                                type="success"
                                onClick={handleBuyNow}
                                disabled={!account || isPurchasing || !product.listed}
                                loading={isPurchasing}
                                width="100%"
                            >
                                {isPurchasing ? 'Processing...' : !account ? 'Connect to Purchase' : 'Buy Now'}
                            </Button>

                            {/* @ts-ignore */}
                            <Button
                                onClick={handleAddToCart}
                                disabled={isInCart || !product.listed}
                                width="100%"
                                icon={<ShoppingCart />}
                            >
                                {isInCart ? 'In Cart' : 'Add to Cart'}
                            </Button>
                        </div>
                    </Grid>
                </Grid.Container>
            </Modal.Content>
            {/* @ts-ignore */}
            <Modal.Action passive onClick={() => onOpenChange(false)}>Close</Modal.Action>
        </Modal>
    );
}
