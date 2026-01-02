import { PACKAGE_ID } from './sui-utils';

/**
 * Get product type string for Kiosk operations
 */
export function getProductType(): string {
    return `${PACKAGE_ID}::product::Product`;
}

// Note: Kiosk transaction building is now handled directly in useKiosk hook
// using @mysten/kiosk KioskClient for better type safety
