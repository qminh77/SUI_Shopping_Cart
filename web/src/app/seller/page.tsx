'use client';

import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import {
    Button,
    Card,
    Input,
    Textarea,
    Tag,
    Text,
    Grid,
    Page,
    Spacer,
    Loading,
    Divider,
    useToasts,
} from '@geist-ui/core';
import { WalletConnection } from '@/components/WalletConnection';
import CreateShopForm from '@/components/shops/CreateShopForm';
import { useShop } from '@/hooks/useShop';
import { useProducts } from '@/hooks/useProducts';
import { useKiosk } from '@/hooks/useKiosk';
import { mistToSui, formatAddress } from '@/lib/sui-utils';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Package, Eye, EyeOff, ShoppingBag } from '@geist-ui/icons';

export default function SellerPage() {
    const account = useCurrentAccount();
    const { shop: userShop, isLoading: isLoadingShop, createShop } = useShop();
    const isCreatingShop = createShop.isPending;
    const { userProducts, createProduct, isCreatingProduct, toggleProductListing, isTogglingListing } = useProducts();
    const { hasKiosk, isLoadingKiosks, createKiosk, isCreatingKiosk } = useKiosk(account?.address);
    const { setToast } = useToasts();



    // Product form state
    const [productFormData, setProductFormData] = useState({
        name: '',
        description: '',
        imageUrl: '',
        price: '',
    });



    const handleCreateProduct = async () => {
        if (!userShop) return;
        if (!hasKiosk) {
            setToast({ text: 'Please create a Kiosk first!', type: 'warning' });
            return;
        }

        try {
            // Create the product NFT
            await createProduct({
                shopId: userShop.id,
                name: productFormData.name,
                description: productFormData.description,
                imageUrl: productFormData.imageUrl,
                price: parseFloat(productFormData.price),
            });

            setProductFormData({ name: '', description: '', imageUrl: '', price: '' });
            setToast({ text: 'Product created successfully!', type: 'success' });
        } catch (error) {
            console.error('Product creation error:', error);
            setToast({ text: 'Failed to create product', type: 'error' });
        }
    };

    const handleCreateKiosk = async () => {
        try {
            await createKiosk();
            setToast({ text: 'Kiosk created successfully!', type: 'success' });
        } catch (error) {
            console.error('Kiosk creation error:', error);
            setToast({ text: 'Failed to create kiosk', type: 'error' });
        }
    };

    const handleToggleListing = async (productId: string, currentlyListed: boolean) => {
        try {
            await toggleProductListing({ productId, list: !currentlyListed });
            setToast({ text: currentlyListed ? 'Product unlisted' : 'Product listed', type: 'success' });
        } catch (error) {
            console.error('Toggle listing error:', error);
            setToast({ text: 'Failed to update listing', type: 'error' });
        }
    };

    // Not connected
    if (!account) {
        return (
            <Page dotBackdrop width="100%" padding={0}>
                <Navigation />
                <Grid.Container justify="center" alignItems="center" style={{ minHeight: '60vh' }}>
                    <Grid xs={24} md={12}>
                        <Card>
                            <Text h3>Wallet Required</Text>
                            <Text p>Please connect your Sui wallet to access the seller dashboard.</Text>
                        </Card>
                    </Grid>
                </Grid.Container>
                <Footer />
            </Page>
        );
    }

    // Loading shop status
    if (isLoadingShop) {
        return (
            <Page dotBackdrop width="100%" padding={0}>
                <Navigation />
                <Grid.Container justify="center" alignItems="center" style={{ minHeight: '60vh' }}>
                    <Loading>Loading Seller Dashboard</Loading>
                </Grid.Container>
                <Footer />
            </Page>
        );
    }

    // No shop - show create shop form
    if (!userShop) {
        return (
            <Page dotBackdrop width="100%" padding={0}>
                <Navigation />
                <Page.Content>
                    <CreateShopForm />
                </Page.Content>
                <Footer />
            </Page>
        );
    }

    // Has shop - show dashboard
    return (
        <Page dotBackdrop width="100%" padding={0}>
            <Navigation />

            <Page.Content>
                <Grid.Container gap={2} justify="center">
                    <Grid xs={24}>
                        <div style={{ width: '100%', marginBottom: '2rem' }}>
                            <Text h2>Seller Dashboard</Text>
                            <Text p type="secondary">Manage your shop and products</Text>
                        </div>
                    </Grid>

                    {/* Shop Info */}
                    <Grid xs={24}>
                        <Card width="100%">
                            <Grid.Container justify="space-between" alignItems="center">
                                <Grid>
                                    <Text h4 my={0}>{userShop.shop_name}</Text>
                                    <Text p small type="secondary" my={0}>{userShop.shop_description}</Text>
                                </Grid>
                                <Grid>
                                    <Tag type="success">Your Shop</Tag>
                                </Grid>
                            </Grid.Container>
                        </Card>
                    </Grid>

                    {/* Kiosk Status */}
                    <Grid xs={24}>
                        <Card width="100%">
                            <Grid.Container justify="space-between" alignItems="center">
                                <Grid xs={18} direction="column">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <ShoppingBag />
                                        <Text h4 my={0}>Kiosk Status</Text>
                                    </div>
                                    <Text p small type="secondary">
                                        {hasKiosk ? 'Your Kiosk is ready for listing products' : 'Create a Kiosk to list and sell products'}
                                    </Text>
                                </Grid>
                                <Grid>
                                    {hasKiosk ? (
                                        <Tag type="success">Active</Tag>
                                    ) : (
                                        /* @ts-ignore */
                                        <Button
                                            onClick={handleCreateKiosk}
                                            disabled={isCreatingKiosk || isLoadingKiosks}
                                            loading={isCreatingKiosk}
                                            auto
                                            type="secondary"
                                            scale={0.8}
                                        >
                                            Create Kiosk
                                        </Button>
                                    )}
                                </Grid>
                            </Grid.Container>
                        </Card>
                    </Grid>

                    <Grid xs={24} md={12}>
                        {/* Create Product Form */}
                        <Card width="100%">
                            <Text h4>Create New Product</Text>
                            <Text p small type="secondary">Mint a product NFT linked to your shop</Text>
                            <Spacer h={1} />

                            {/* Shop Status Check - Only allow product creation if ACTIVE */}
                            {userShop.status !== 'ACTIVE' ? (
                                <div style={{ padding: '1.5rem', border: '2px solid #ff6b6b', borderRadius: '8px', backgroundColor: 'rgba(255, 107, 107, 0.1)', textAlign: 'center' }}>
                                    <Text h5 style={{ color: '#ff6b6b', margin: '0 0 0.5rem 0' }}>
                                        Shop {userShop.status === 'PENDING' ? 'Chưa Được Duyệt' : 'Bị Khóa'}
                                    </Text>
                                    <Text p small>
                                        {userShop.status === 'PENDING'
                                            ? 'Shop của bạn đang chờ Admin duyệt. Bạn chỉ có thể bán khi shop được duyệt.'
                                            : 'Shop của bạn đã bị khóa. Vui lòng liên hệ Admin.'
                                        }
                                    </Text>
                                    {userShop.admin_note && (
                                        <>
                                            <Spacer h={0.5} />
                                            <Text p small type="secondary" style={{ fontStyle: 'italic' }}>
                                                Ghi chú: {userShop.admin_note}
                                            </Text>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* @ts-ignore */}
                                    <Input
                                        width="100%"
                                        placeholder="e.g., Digital Artwork #1"
                                        value={productFormData.name}
                                        onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                                    >
                                        Product Name
                                    </Input>
                                    <Spacer h={1} />

                                    {/* @ts-ignore */}
                                    <Input
                                        width="100%"
                                        htmlType="number"
                                        placeholder="0.000"
                                        value={productFormData.price}
                                        onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                                    >
                                        Price (SUI)
                                    </Input>
                                    <Spacer h={1} />

                                    {/* @ts-ignore */}
                                    <Textarea
                                        width="100%"
                                        placeholder="Describe your product..."
                                        value={productFormData.description}
                                        onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                                    >
                                        Description
                                    </Textarea>
                                    <Spacer h={1} />

                                    {/* @ts-ignore */}
                                    <Input
                                        width="100%"
                                        placeholder="https://example.com/image.jpg"
                                        value={productFormData.imageUrl}
                                        onChange={(e) => setProductFormData({ ...productFormData, imageUrl: e.target.value })}
                                    >
                                        Image URL
                                    </Input>
                                    <Spacer h={1} />

                                    {/* @ts-ignore */}
                                    <Button
                                        onClick={handleCreateProduct}
                                        disabled={isCreatingProduct}
                                        loading={isCreatingProduct}
                                        width="100%"
                                        type="secondary"
                                    >
                                        Create Product NFT
                                    </Button>
                                </>
                            )}
                        </Card>
                    </Grid>

                    <Grid xs={24} md={12}>
                        {/* My Products List */}
                        <Card width="100%">
                            <Text h4>My Products ({userProducts?.length || 0})</Text>
                            <Spacer h={1} />

                            {!userProducts || userProducts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem 0', color: '#666' }}>
                                    <Package size={48} />
                                    <Text p>No products yet. Create your first product!</Text>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {userProducts.map((product) => (
                                        <Card key={product.id} width="100%" style={{ padding: '0.8rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Text h5 my={0} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</Text>
                                                        <Tag type={product.listed ? 'default' : 'secondary'} scale={0.5}>
                                                            {product.listed ? 'Listed' : 'Unlisted'}
                                                        </Tag>
                                                    </div>
                                                    <Text p small type="secondary" my={0} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {mistToSui(product.price)} SUI
                                                    </Text>
                                                </div>

                                                {/* @ts-ignore */}
                                                <Button
                                                    onClick={() => handleToggleListing(product.id, product.listed)}
                                                    disabled={isTogglingListing}
                                                    auto
                                                    scale={0.7}
                                                    icon={product.listed ? <EyeOff /> : <Eye />}
                                                >
                                                    {product.listed ? 'Unlist' : 'List'}
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </Grid>
                </Grid.Container>
            </Page.Content>

            <Footer />
        </Page>
    );
}
