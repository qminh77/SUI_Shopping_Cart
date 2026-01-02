import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID } from '@/lib/sui-utils';

export const createProductAndListTx = (
    tx: Transaction,
    shopId: string,
    name: string,
    description: string,
    imageUrl: string,
    price: number,
    kioskId: string,
    kioskCapId: string
) => {
    // 1. Mint Product
    const product = tx.moveCall({
        target: `${PACKAGE_ID}::product::mint`,
        arguments: [
            tx.pure.address(shopId),
            tx.pure.string(name),
            tx.pure.string(description),
            tx.pure.string(imageUrl),
            tx.pure.u64(price),
        ],
    });

    const productType = `${PACKAGE_ID}::product::Product`;

    // 2. Place in Kiosk
    tx.moveCall({
        target: '0x2::kiosk::place',
        arguments: [
            tx.object(kioskId),
            tx.object(kioskCapId),
            product,
        ],
        typeArguments: [productType],
    });

    // 3. List in Kiosk
    tx.moveCall({
        target: '0x2::kiosk::list',
        arguments: [
            tx.object(kioskId),
            tx.object(kioskCapId),
            product, // Using the product reference from mint
            tx.pure.u64(price),
        ],
        typeArguments: [productType],
    });

    return tx;
};
