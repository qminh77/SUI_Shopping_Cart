'use client';

import { Address } from '@/lib/sui-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Phone, User, Edit2, Trash2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressCardProps {
    address: Address;
    onEdit: (address: Address) => void;
    onDelete: (id: string) => void;
    onSetDefault: (id: string) => void;
    isDeleting?: boolean;
    isSettingDefault?: boolean;
    showActions?: boolean;
}

export function AddressCard({
    address,
    onEdit,
    onDelete,
    onSetDefault,
    isDeleting = false,
    isSettingDefault = false,
    showActions = true
}: AddressCardProps) {
    return (
        <Card className={cn(
            "hover:shadow-md transition-all",
            address.is_default && "border-primary"
        )}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                        {address.label && (
                            <Badge variant="secondary" className="text-xs">
                                {address.label}
                            </Badge>
                        )}
                        {address.is_default && (
                            <Badge className="text-xs flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" />
                                Mặc định
                            </Badge>
                        )}
                    </div>

                    {showActions && (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(address)}
                                className="h-8 w-8"
                            >
                                <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDelete(address.id)}
                                disabled={isDeleting}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    {/* Name */}
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">{address.full_name}</span>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">{address.phone}</span>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                            <div>{address.address_line1}</div>
                            {address.address_line2 && <div>{address.address_line2}</div>}
                            <div>
                                {address.city}
                                {address.state_province && `, ${address.state_province}`}
                                {address.postal_code && ` ${address.postal_code}`}
                            </div>
                            <div>{address.country}</div>
                        </div>
                    </div>
                </div>

                {/* Set as Default Button */}
                {showActions && !address.is_default && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSetDefault(address.id)}
                        disabled={isSettingDefault}
                        className="w-full mt-4"
                    >
                        <Star className="w-3 h-3 mr-2" />
                        Đặt làm mặc định
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
