import { supabase } from './categories.service';
import { Address, AddressInput } from '@/lib/sui-utils';

/**
 * Get all addresses for a wallet
 */
export async function getAddresses(walletAddress: string): Promise<Address[]> {
    const { data, error } = await supabase
        .from('buyer_addresses')
        .select('*')
        .eq('buyer_wallet', walletAddress)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching addresses:', error);
        return [];
    }

    return data || [];
}

/**
 * Get default address for a wallet
 */
export async function getDefaultAddress(walletAddress: string): Promise<Address | null> {
    const { data, error } = await supabase
        .from('buyer_addresses')
        .select('*')
        .eq('buyer_wallet', walletAddress)
        .eq('is_default', true)
        .single();

    if (error) {
        // If no default found, get the most recent one
        if (error.code === 'PGRST116') {
            const addresses = await getAddresses(walletAddress);
            return addresses[0] || null;
        }
        console.error('Error fetching default address:', error);
        return null;
    }

    return data;
}

/**
 * Get address by ID
 */
export async function getAddressById(id: string): Promise<Address | null> {
    const { data, error } = await supabase
        .from('buyer_addresses')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching address:', error);
        return null;
    }

    return data;
}

/**
 * Create new address
 */
export async function createAddress(
    walletAddress: string,
    addressData: AddressInput
): Promise<Address | null> {
    const { data, error } = await supabase
        .from('buyer_addresses')
        .insert({
            buyer_wallet: walletAddress,
            ...addressData,
            country: addressData.country || 'Vietnam'
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating address:', error);
        return null;
    }

    return data;
}

/**
 * Update existing address
 */
export async function updateAddress(
    id: string,
    addressData: Partial<AddressInput>
): Promise<Address | null> {
    const { data, error } = await supabase
        .from('buyer_addresses')
        .update(addressData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating address:', error);
        return null;
    }

    return data;
}

/**
 * Delete address
 */
export async function deleteAddress(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('buyer_addresses')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting address:', error);
        return false;
    }

    return true;
}

/**
 * Set address as default
 */
export async function setDefaultAddress(
    addressId: string,
    walletAddress: string
): Promise<boolean> {
    // The database trigger will automatically unset other defaults
    // We just need to set this one to true
    const { error } = await supabase
        .from('buyer_addresses')
        .update({ is_default: true })
        .eq('id', addressId)
        .eq('buyer_wallet', walletAddress);

    if (error) {
        console.error('Error setting default address:', error);
        return false;
    }

    return true;
}

/**
 * Validate address data before submission
 */
export function validateAddressInput(input: AddressInput): string[] {
    const errors: string[] = [];

    if (!input.full_name || input.full_name.trim().length < 2) {
        errors.push('Full name must be at least 2 characters');
    }

    if (!input.phone || !/^[0-9\s\-\+\(\)]{10,}$/.test(input.phone)) {
        errors.push('Phone number must be at least 10 digits');
    }

    if (!input.address_line1 || input.address_line1.trim().length < 5) {
        errors.push('Address line 1 must be at least 5 characters');
    }

    if (!input.city || input.city.trim().length < 2) {
        errors.push('City is required');
    }

    if (input.postal_code && !/^[A-Za-z0-9\s\-]{3,10}$/.test(input.postal_code)) {
        errors.push('Invalid postal code format');
    }

    return errors;
}
