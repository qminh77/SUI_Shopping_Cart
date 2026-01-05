'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/lib/sui-utils';

interface CartItem extends Product {
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
    // Selection methods
    selectedItems: Set<string>;
    toggleSelection: (productId: string) => void;
    selectAll: () => void;
    deselectAll: () => void;
    getSelectedItems: () => CartItem[];
    removeSelectedItems: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'sui-commerce-cart';

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    // Load cart from localStorage on mount
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem(CART_STORAGE_KEY);
            if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                setItems(parsedCart);
                // Select all items by default when loading cart
                setSelectedItems(new Set(parsedCart.map((item: CartItem) => item.id)));
            }
        } catch (error) {
            console.error('Failed to load cart from localStorage:', error);
        }
        setIsInitialized(true);
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (isInitialized) {
            try {
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
            } catch (error) {
                console.error('Failed to save cart to localStorage:', error);
            }
        }
    }, [items, isInitialized]);

    const addToCart = (product: Product, quantity: number = 1) => {
        setItems(currentItems => {
            const existingItem = currentItems.find(item => item.id === product.id);

            if (existingItem) {
                const newQuantity = existingItem.quantity + quantity;
                // Cap at stock limit
                const finalQuantity = Math.min(newQuantity, product.stock);

                return currentItems.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: finalQuantity }
                        : item
                );
            }

            // Cap initial add at stock limit
            const finalQuantity = Math.min(quantity, product.stock);

            // Auto-select new item
            setSelectedItems(prev => new Set(prev).add(product.id));

            return [...currentItems, { ...product, quantity: finalQuantity }];
        });
    };

    const updateQuantity = (productId: string, quantity: number) => {
        setItems(currentItems =>
            currentItems.map(item => {
                if (item.id === productId) {
                    // Ensure quantity is between 1 and stock
                    const validQuantity = Math.min(Math.max(1, quantity), item.stock);
                    return { ...item, quantity: validQuantity };
                }
                return item;
            })
        );
    };

    const removeFromCart = (productId: string) => {
        setItems(currentItems => currentItems.filter(item => item.id !== productId));
        setSelectedItems(prev => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
        });
    };

    const clearCart = () => {
        setItems([]);
        setSelectedItems(new Set());
    };

    const toggleSelection = (productId: string) => {
        setSelectedItems(prev => {
            const next = new Set(prev);
            if (next.has(productId)) {
                next.delete(productId);
            } else {
                next.add(productId);
            }
            return next;
        });
    };

    const selectAll = () => {
        setSelectedItems(new Set(items.map(item => item.id)));
    };

    const deselectAll = () => {
        setSelectedItems(new Set());
    };

    const getSelectedItems = () => {
        return items.filter(item => selectedItems.has(item.id));
    };

    const removeSelectedItems = () => {
        setItems(currentItems => currentItems.filter(item => !selectedItems.has(item.id)));
        setSelectedItems(new Set());
    };

    const getTotalItems = () => {
        return items.reduce((total, item) => total + item.quantity, 0);
    };

    const getTotalPrice = () => {
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    return (
        <CartContext.Provider value={{
            items,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getTotalItems,
            getTotalPrice,
            selectedItems,
            toggleSelection,
            selectAll,
            deselectAll,
            getSelectedItems,
            removeSelectedItems
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
}
