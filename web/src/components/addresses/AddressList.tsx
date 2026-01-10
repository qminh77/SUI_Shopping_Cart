'use client';

import { useState } from 'react';
import { useAddresses } from '@/hooks/useAddresses';
import { AddressCard } from './AddressCard';
import { AddressForm } from './AddressForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, MapPin, Loader2 } from 'lucide-react';
import { Address, AddressInput } from '@/lib/sui-utils';

export function AddressList() {
    const {
        addresses,
        isLoading,
        createAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        isCreating,
        isUpdating,
        isDeleting,
        isSettingDefault
    } = useAddresses();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | undefined>();
    const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

    const handleCreate = async (data: AddressInput) => {
        await createAddress(data);
        setIsFormOpen(false);
    };

    const handleUpdate = async (data: AddressInput) => {
        if (!editingAddress) return;
        await updateAddress({ id: editingAddress.id, data });
        setEditingAddress(undefined);
        setIsFormOpen(false);
    };

    const handleDelete = async () => {
        if (!deletingAddressId) return;
        await deleteAddress(deletingAddressId);
        setDeletingAddressId(null);
    };

    const handleEdit = (address: Address) => {
        setEditingAddress(address);
        setIsFormOpen(true);
    };

    const handleCancelForm = () => {
        setIsFormOpen(false);
        setEditingAddress(undefined);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 uppercase">
                        <MapPin className="w-6 h-6 text-primary" />
                        Delivery Addresses
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage your shipping addresses
                    </p>
                </div>
                <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Add Address</span>
                </Button>
            </div>

            {/* Address Grid */}
            {addresses.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 border border-border rounded-lg">
                    <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-2 uppercase">No addresses yet</h3>
                    <p className="text-muted-foreground mb-6">
                        Add your first delivery address to get started
                    </p>
                    <Button
                        onClick={() => setIsFormOpen(true)}
                        variant="outline"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Address
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {addresses.map(address => (
                        <AddressCard
                            key={address.id}
                            address={address}
                            onEdit={handleEdit}
                            onDelete={(id) => setDeletingAddressId(id)}
                            onSetDefault={setDefaultAddress}
                            isDeleting={isDeleting}
                            isSettingDefault={isSettingDefault}
                        />
                    ))}
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={isFormOpen} onOpenChange={handleCancelForm}>
                <DialogContent className="max-w-2xl bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="uppercase tracking-wider">
                            {editingAddress ? 'Edit Address' : 'Add New Address'}
                        </DialogTitle>
                    </DialogHeader>
                    <AddressForm
                        address={editingAddress}
                        onSubmit={editingAddress ? handleUpdate : handleCreate}
                        onCancel={handleCancelForm}
                        isSubmitting={isCreating || isUpdating}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deletingAddressId} onOpenChange={() => setDeletingAddressId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="uppercase text-destructive">Delete Address?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This address will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingAddressId(null)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDelete}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
