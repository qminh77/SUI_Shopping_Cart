'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, RefreshCw } from 'lucide-react';
import { useProvinces, Province, District, Ward } from '@/hooks/useProvinces';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
            // We'll set these via effect matching later if possible, or just keep string
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

    // API Hooks
    const {
        provinces, districts, wards,
        getDistricts, getWards,
        resetDistricts, resetWards,
        version, setVersion,
        source, setSource
    } = useProvinces();

    // Local state for selected codes to drive the API fetching
    const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);
    const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | null>(null);
    const [selectedWardCode, setSelectedWardCode] = useState<number | null>(null);

    // Initial Data Matching (Auto-fill selects if editing)
    useEffect(() => {
        if (address && provinces.length > 0) {
            // Match Province (City)
            const matchedProv = provinces.find(p => p.name === address.city || address.city.includes(p.name));
            if (matchedProv) {
                setSelectedProvinceCode(matchedProv.code);
                getDistricts(matchedProv.code);
            }
        }
    }, [address, provinces]);

    useEffect(() => {
        if (address && selectedProvinceCode && districts.length > 0) {
            // Match District (State/Province)
            const matchedDist = districts.find(d => d.name === address.state_province || (address.state_province && address.state_province.includes(d.name)));
            if (matchedDist) {
                setSelectedDistrictCode(matchedDist.code);
                getWards(matchedDist.code);
            }
        }
    }, [address, districts, selectedProvinceCode]);

    useEffect(() => {
        if (address && selectedDistrictCode && wards.length > 0) {
            // Match Ward (Address Line 2)
            const matchedWard = wards.find(w => w.name === address.address_line2 || (address.address_line2 && address.address_line2.includes(w.name)));
            if (matchedWard) {
                setSelectedWardCode(matchedWard.code);
            }
        }
    }, [address, wards, selectedDistrictCode]);


    const onFormSubmit = async (data: AddressInput) => {
        await onSubmit({ ...data, is_default: isDefault });
    };

    const handleProvinceChange = (value: string) => {
        // Value is code string
        const code = Number(value);
        const prov = provinces.find(p => p.code === code);

        setSelectedProvinceCode(code);
        setValue('city', prov?.name || '');

        // Reset children
        setSelectedDistrictCode(null);
        setSelectedWardCode(null);
        setValue('state_province', '');
        setValue('address_line2', '');

        resetDistricts();
        resetWards();
        getDistricts(code);
    };

    const handleDistrictChange = (value: string) => {
        const code = Number(value);
        const dist = districts.find(d => d.code === code);

        setSelectedDistrictCode(code);
        setValue('state_province', dist?.name || '');

        // Reset child
        setSelectedWardCode(null);
        setValue('address_line2', '');

        resetWards();
        getWards(code);
    };

    const handleWardChange = (value: string) => {
        const code = Number(value);
        const ward = wards.find(w => w.code === code);

        setSelectedWardCode(code);
        setValue('address_line2', ward?.name || '');
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
            {/* Version Toggle */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex-1">
                    <Label className="mb-2 block text-xs font-semibold uppercase text-muted-foreground">
                        Data Source API
                    </Label>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs ${source === 'api' ? 'font-bold text-primary' : ''}`}>Official API</span>
                        {/* Hidden toggle if needed, or simplified as just version for now since user prioritized V1/V2 */}
                    </div>
                </div>

                <div className="flex-1">
                    <Label className="mb-2 block text-xs font-semibold uppercase text-muted-foreground">
                        Administrative Division
                    </Label>
                    <Tabs
                        defaultValue={version}
                        onValueChange={(v) => {
                            setVersion(v as 'v1' | 'v2');
                            // Reset selections on version change
                            setSelectedProvinceCode(null);
                            setSelectedDistrictCode(null);
                            setSelectedWardCode(null);
                        }}
                        className="w-full"
                    >
                        <TabsList className="w-full grid grid-cols-2 h-8">
                            <TabsTrigger value="v1" className="text-xs">
                                Pre-Merger (V1)
                            </TabsTrigger>
                            <TabsTrigger value="v2" className="text-xs">
                                Post-Merger (V2)
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <p className="text-[10px] text-muted-foreground mt-1 text-right">
                        Use V2 for latest 2025 updates
                    </p>
                </div>
            </div>

            {/* Full Name & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="full_name">Full Name <span className="text-red-400">*</span></Label>
                    <Input
                        id="full_name"
                        {...register('full_name', { required: 'Required', minLength: 2 })}
                        placeholder="Nguyen Van A"
                        className="mt-1.5"
                    />
                    {errors.full_name && <p className="text-destructive text-xs mt-1">{errors.full_name.message}</p>}
                </div>
                <div>
                    <Label htmlFor="phone">Phone <span className="text-red-400">*</span></Label>
                    <Input
                        id="phone"
                        {...register('phone', { required: 'Required', pattern: /^[0-9\s\-\+\(\)]{10,}$/ })}
                        placeholder="0912 345 678"
                        className="mt-1.5"
                    />
                    {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
                </div>
            </div>

            {/* Address Selection Area */}
            <div className="space-y-4 pt-2">
                <Label>Address Details <span className="text-red-400">*</span></Label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Province / City */}
                    <div>
                        <Select
                            onValueChange={handleProvinceChange}
                            value={selectedProvinceCode?.toString()}
                            disabled={provinces.length === 0}
                        >
                            <SelectTrigger className="w-full mt-1.5">
                                <SelectValue placeholder="Select Province/City" />
                            </SelectTrigger>
                            <SelectContent>
                                {provinces.map((p) => (
                                    <SelectItem key={p.code} value={p.code.toString()}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <input type="hidden" {...register('city', { required: 'Province is required' })} />
                        {errors.city && <p className="text-destructive text-xs mt-1">{errors.city.message}</p>}
                    </div>

                    {/* District */}
                    <div>
                        <Select
                            onValueChange={handleDistrictChange}
                            value={selectedDistrictCode?.toString()}
                            disabled={!selectedProvinceCode}
                        >
                            <SelectTrigger className="w-full mt-1.5">
                                <SelectValue placeholder="Select District" />
                            </SelectTrigger>
                            <SelectContent>
                                {districts.map((d) => (
                                    <SelectItem key={d.code} value={d.code.toString()}>
                                        {d.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <input type="hidden" {...register('state_province', { required: 'District is required' })} />
                    </div>

                    {/* Ward (mapped to address_line2) */}
                    <div>
                        <Select
                            onValueChange={handleWardChange}
                            value={selectedWardCode?.toString()}
                            disabled={!selectedDistrictCode}
                        >
                            <SelectTrigger className="w-full mt-1.5">
                                <SelectValue placeholder="Select Ward" />
                            </SelectTrigger>
                            <SelectContent>
                                {wards.map((w) => (
                                    <SelectItem key={w.code} value={w.code.toString()}>
                                        {w.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <input type="hidden" {...register('address_line2', { required: 'Ward is required' })} />
                    </div>
                </div>
            </div>

            {/* Specific Address Line 1 */}
            <div>
                <Label htmlFor="address_line1">Street Address <span className="text-red-400">*</span></Label>
                <Input
                    id="address_line1"
                    {...register('address_line1', { required: 'Street address is required', minLength: 5 })}
                    placeholder="No. 123, Le Loi Street"
                    className="mt-1.5"
                />
                {errors.address_line1 && <p className="text-destructive text-xs mt-1">{errors.address_line1.message}</p>}
            </div>

            {/* Extra Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="label">Label (Optional)</Label>
                    <Input
                        id="label"
                        {...register('label')}
                        placeholder="Home, Office..."
                        className="mt-1.5"
                    />
                </div>
                <div className="flex items-end pb-3">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="is_default"
                            checked={isDefault}
                            onCheckedChange={(checked) => setIsDefault(!!checked)}
                        />
                        <Label htmlFor="is_default" className="cursor-pointer font-normal">
                            Set as default address
                        </Label>
                    </div>
                </div>
            </div>

            {/* Hint for matching names matches */}
            <p className="text-[10px] text-muted-foreground border-t pt-2 mt-2">
                * Selected administrative units are auto-saved to your address book.
            </p>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-4">
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
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
                    className="flex-1"
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}
