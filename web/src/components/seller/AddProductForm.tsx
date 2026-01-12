
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CategorySelector } from '@/components/CategorySelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { getUserShop, PACKAGE_ID, suiToMist } from '@/lib/sui-utils';

interface AddProductFormProps {
    userShop: any;
    isMissingOnChain: boolean;
}

export function AddProductForm({ userShop, isMissingOnChain }: AddProductFormProps) {
    const { t } = useLanguage();
    const client = useSuiClient();
    const queryClient = useQueryClient();
    const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

    const [isCreating, setIsCreating] = useState(false);
    const [productFormData, setProductFormData] = useState({
        name: '',
        description: '',
        imageUrl: '',
        price: '',
        stock: '100',
        categoryId: null as string | null,
    });

    const handleCreateProduct = async () => {
        if (!userShop) return;

        console.log('[ProductCreate] Verifying shop blockchain sync for:', userShop.owner_wallet);
        const freshOnChainShop = await getUserShop(client, userShop.owner_wallet);

        if (!freshOnChainShop) {
            toast.error(t('seller.dashboard.syncRequiredMsg'));
            return;
        }

        setIsCreating(true);

        try {
            const onChainShop = freshOnChainShop;
            console.log('[ProductCreate] Using on-chain shop ID:', onChainShop.id);

            const tx = new Transaction();
            const priceMist = suiToMist(parseFloat(productFormData.price));

            tx.moveCall({
                target: `${PACKAGE_ID}::product::create_shared_product`,
                arguments: [
                    tx.pure.address(onChainShop.id),
                    tx.pure.string(productFormData.name),
                    tx.pure.string(productFormData.description),
                    tx.pure.string(productFormData.imageUrl),
                    tx.pure.u64(priceMist),
                    tx.pure.u64(parseInt(productFormData.stock))
                ]
            });

            const result = await signAndExecute({ transaction: tx });

            const fullResponse = await client.waitForTransaction({
                digest: result.digest,
                options: { showEffects: true, showObjectChanges: true, showEvents: true }
            });

            let productId: string | null = null;

            if ((fullResponse as any).objectChanges) {
                const created = (fullResponse as any).objectChanges.find(
                    (obj: any) => obj.type === 'created' && obj.objectType?.includes('::product::Product')
                );
                if (created) productId = created.objectId;
            }

            if (!productId && (fullResponse as any).events) {
                const productCreatedEvent = (fullResponse as any).events.find(
                    (event: any) => event.type.includes('::ProductCreated')
                );
                if (productCreatedEvent?.parsedJson?.product_id) productId = productCreatedEvent.parsedJson.product_id;
            }

            if (productId) {
                try {
                    await fetch('/api/products/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            productId,
                            categoryId: productFormData.categoryId
                        }),
                    });
                } catch (syncError) {
                    console.error('Error syncing to Supabase:', syncError);
                }
            }

            toast.success(t('seller.products.form.createSuccess'));
            setProductFormData({ name: '', description: '', imageUrl: '', price: '', stock: '100', categoryId: null });
            queryClient.invalidateQueries({ queryKey: ['my-retail-products'] });

        } catch (error) {
            console.error('Create product error:', error);
            toast.error(t('seller.products.form.createError'));
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('seller.products.add')}</CardTitle>
                <CardDescription>{t('seller.products.addDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">{t('seller.products.form.name')}</Label>
                    <Input
                        id="name"
                        value={productFormData.name}
                        onChange={e => setProductFormData({ ...productFormData, name: e.target.value })}
                        placeholder="VD: iPhone 15 Pro"
                        disabled={isMissingOnChain}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="price">{t('seller.products.form.price')}</Label>
                    <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={productFormData.price}
                        onChange={e => setProductFormData({ ...productFormData, price: e.target.value })}
                        placeholder="0.00"
                        disabled={isMissingOnChain}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="stock">{t('seller.products.form.stock')}</Label>
                    <Input
                        id="stock"
                        type="number"
                        value={productFormData.stock}
                        onChange={e => setProductFormData({ ...productFormData, stock: e.target.value })}
                        disabled={isMissingOnChain}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="imageUrl">{t('seller.products.form.image')}</Label>
                    <Input
                        id="imageUrl"
                        value={productFormData.imageUrl}
                        onChange={e => setProductFormData({ ...productFormData, imageUrl: e.target.value })}
                        placeholder="https://..."
                        disabled={isMissingOnChain}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">{t('seller.products.form.description')}</Label>
                    <Textarea
                        id="description"
                        value={productFormData.description}
                        onChange={e => setProductFormData({ ...productFormData, description: e.target.value })}
                        placeholder="Mô tả sản phẩm..."
                        rows={3}
                        disabled={isMissingOnChain}
                    />
                </div>

                <div className="space-y-2">
                    <CategorySelector
                        value={productFormData.categoryId}
                        onChange={(value) => setProductFormData({ ...productFormData, categoryId: value })}
                        disabled={isMissingOnChain}
                    />
                </div>

                <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={handleCreateProduct}
                    disabled={isCreating || !productFormData.name || !productFormData.price || isMissingOnChain}
                >
                    {isMissingOnChain ? (
                        `🔒 ${t('seller.products.form.syncLock')}`
                    ) : isCreating ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {t('seller.products.form.creating')}
                        </>
                    ) : (
                        t('seller.products.form.create')
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
