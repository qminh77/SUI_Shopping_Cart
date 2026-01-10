'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Address, AddressInput } from '@/lib/sui-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface AddressFormProps {
    address?: Address;
    onSubmit: (data: AddressInput) => Promise<void>;
    onCancel: () => void;
    isSubmitting?: boolean;
}

export function AddressForm({ address, onSubmit, onCancel, isSubmitting = false }: AddressFormProps) {
    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<AddressInput>({
        defaultValues: address ? {
            full_name: address.full_name,
            phone: address.phone,
            address_line1: address.address_line1,
            address_line2: address.address_line2 || '',
            city: address.city,
            state_province: address.state_province || '',
            postal_code: address.postal_code || '',
            country: address.country || 'Vietnam',
            label: address.label || '',
            is_default: address.is_default
        } : {
            country: 'Vietnam',
            is_default: false
        }
    });

    const [isDefault, setIsDefault] = useState(address?.is_default || false);

    const onFormSubmit = async (data: AddressInput) => {
        await onSubmit({ ...data, is_default: isDefault });
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
                <Label htmlFor="full_name" className="text-white">
                    Full Name <span className="text-red-400">*</span>
                </Label>
                <Input
                    id="full_name"
                    {...register('full_name', {
                        required: 'Full name is required',
                        minLength: { value: 2, message: 'Name must be at least 2 characters' }
                    })}
                    placeholder="John Doe"
                    className="mt-1.5 bg-black/40 border-white/20 text-white"
                />
                {errors.full_name && (
                    <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>
                )}
            </div>

            {/* Phone */}
            <div>
                <Label htmlFor="phone" className="text-white">
                    Phone Number <span className="text-red-400">*</span>
                </Label>
                <Input
                    id="phone"
                    {...register('phone', {
                        required: 'Phone number is required',
                        pattern: {
                            value: /^[0-9\s\-\+\(\)]{10,}$/,
                            message: 'Invalid phone number format'
                        }
                    })}
                    placeholder="+84 123 456 789"
                    className="mt-1.5 bg-black/40 border-white/20 text-white"
                />
                {errors.phone && (
                    <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>
                )}
            </div>

            {/* Address Line 1 */}
            <div>
                <Label htmlFor="address_line1" className="text-white">
                    Address Line 1 <span className="text-red-400">*</span>
                </Label>
                <Input
                    id="address_line1"
                    {...register('address_line1', {
                        required: 'Address is required',
                        minLength: { value: 5, message: 'Address must be at least 5 characters' }
                    })}
                    placeholder="123 Main Street"
                    className="mt-1.5 bg-black/40 border-white/20 text-white"
                />
                {errors.address_line1 && (
                    <p className="text-red-400 text-xs mt-1">{errors.address_line1.message}</p>
                )}
            </div>

            {/* Address Line 2 */}
            <div>
                <Label htmlFor="address_line2" className="text-white">
                    Address Line 2 (Optional)
                </Label>
                <Input
                    id="address_line2"
                    {...register('address_line2')}
                    placeholder="Apartment, suite, etc."
                    className="mt-1.5 bg-black/40 border-white/20 text-white"
                />
            </div>

            {/* City and State/Province */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="city" className="text-white">
                        City <span className="text-red-400">*</span>
                    </Label>
                    <Input
                        id="city"
                        {...register('city', {
                            required: 'City is required',
                            minLength: { value: 2, message: 'City must be at least 2 characters' }
                        })}
                        placeholder="Ho Chi Minh City"
                        className="mt-1.5 bg-black/40 border-white/20 text-white"
                    />
                    {errors.city && (
                        <p className="text-red-400 text-xs mt-1">{errors.city.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="state_province" className="text-white">
                        State/Province (Optional)
                    </Label>
                    <Input
                        id="state_province"
                        {...register('state_province')}
                        placeholder="District 1"
                        className="mt-1.5 bg-black/40 border-white/20 text-white"
                    />
                </div>
            </div>

            {/* Postal Code and Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="postal_code" className="text-white">
                        Postal Code (Optional)
                    </Label>
                    <Input
                        id="postal_code"
                        {...register('postal_code', {
                            pattern: {
                                value: /^[A-Za-z0-9\s\-]{3,10}$/,
                                message: 'Invalid postal code format'
                            }
                        })}
                        placeholder="700000"
                        className="mt-1.5 bg-black/40 border-white/20 text-white"
                    />
                    {errors.postal_code && (
                        <p className="text-red-400 text-xs mt-1">{errors.postal_code.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="country" className="text-white">
                        Country <span className="text-red-400">*</span>
                    </Label>
                    <Select
                        defaultValue={watch('country') || 'Vietnam'}
                        onValueChange={(value) => setValue('country', value)}
                    >
                        <SelectTrigger className="mt-1.5 bg-black/40 border-white/20 text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black/95 backdrop-blur-md border-white/20">
                            <SelectItem value="Vietnam">Vietnam</SelectItem>
                            <SelectItem value="USA">United States</SelectItem>
                            <SelectItem value="UK">United Kingdom</SelectItem>
                            <SelectItem value="Singapore">Singapore</SelectItem>
                            <SelectItem value="Thailand">Thailand</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Label */}
            <div>
                <Label htmlFor="label" className="text-white">
                    Label (Optional)
                </Label>
                <Input
                    id="label"
                    {...register('label')}
                    placeholder="Home, Office, etc."
                    className="mt-1.5 bg-black/40 border-white/20 text-white"
                />
            </div>

            {/* Set as Default */}
            <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                    id="is_default"
                    checked={isDefault}
                    onCheckedChange={(checked) => setIsDefault(!!checked)}
                    className="border-white/20 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                <Label htmlFor="is_default" className="text-white cursor-pointer">
                    Set as default address
                </Label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4">
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>{address ? 'Update' : 'Create'} Address</>
                    )}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}
