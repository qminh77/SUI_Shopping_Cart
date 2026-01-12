import React, { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from '@/components/ui/label';
import { useTopLevelCategories, useSubcategories, useCategoryById } from '@/hooks/useCategories';
import { useLanguage } from '@/contexts/LanguageContext';

interface CategorySelectorProps {
    value: string | null;
    onChange: (value: string | null) => void;
    disabled?: boolean;
    className?: string;
}

export function CategorySelector({ value, onChange, disabled, className }: CategorySelectorProps) {
    const { t } = useLanguage();
    // Determine if the current value is a top-level or subcategory
    // We need to fetch the category details if value is provided to know its parent
    const { data: selectedCategory, isLoading: isLoadingSelected } = useCategoryById(value);

    // State for local selection
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
    const [openParent, setOpenParent] = useState(false);
    const [openChild, setOpenChild] = useState(false);

    // Update local state when value changes externally or when category details load
    useEffect(() => {
        if (selectedCategory) {
            if (selectedCategory.parent_id) {
                setSelectedParentId(selectedCategory.parent_id);
            } else {
                setSelectedParentId(selectedCategory.id);
            }
        } else if (value === null) {
            setSelectedParentId(null);
        }
    }, [selectedCategory, value]);

    // Fetch top level categories
    const { data: topLevelCategories, isLoading: isLoadingTop } = useTopLevelCategories();

    // Fetch subcategories for the selected parent
    const { data: subElements, isLoading: isLoadingSubs } = useSubcategories(selectedParentId);

    // Handle parent selection
    const handleParentSelect = (parentId: string) => {
        setSelectedParentId(parentId);
        setOpenParent(false);

        // If the selected parent has no subcategories (we might not know yet, but assuming for now),
        // or just fundamentally, selecting a parent IS a valid selection.
        // However, if we want to enforce leaf selection, we might handle it differently.
        // For now, let's treat selecting a parent as selecting that category.
        // We will update the actual value to this parent ID. 
        // If the user then selects a subcategory, we update to that.
        onChange(parentId);
    };

    // Handle child selection
    const handleChildSelect = (childId: string) => {
        onChange(childId);
        setOpenChild(false);
    };

    const selectedParent = topLevelCategories?.find(c => c.id === selectedParentId);
    // Determine current display value for child selector
    // It matches 'value' if 'value' is one of the subcategories
    const selectedChild = subElements?.find(c => c.id === value);

    return (
        <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
            <div className="space-y-2">
                <Label>{t('categories.main')}</Label>
                <Popover open={openParent} onOpenChange={setOpenParent}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openParent}
                            className="w-full justify-between"
                            disabled={disabled || isLoadingTop}
                        >
                            {selectedParent ? (
                                <span className="flex items-center gap-2">
                                    {selectedParent.icon && <span>{selectedParent.icon}</span>}
                                    {selectedParent.name}
                                </span>
                            ) : (
                                t('categories.select')
                            )}
                            {isLoadingTop ? (
                                <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-50" />
                            ) : (
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder={t('categories.search')} />
                            <CommandList>
                                <CommandEmpty>{t('categories.notFound')}</CommandEmpty>
                                <CommandGroup>
                                    {topLevelCategories?.map((category) => (
                                        <CommandItem
                                            key={category.id}
                                            value={category.name}
                                            onSelect={() => handleParentSelect(category.id)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedParentId === category.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {category.icon && <span className="mr-2">{category.icon}</span>}
                                            {category.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Only show subcategory selector if there are subcategories available OR if we are loading them */}
            {(isLoadingSubs || (subElements && subElements.length > 0)) && (
                <div className="space-y-2">
                    <Label>{t('categories.sub')}</Label>
                    <Popover open={openChild} onOpenChange={setOpenChild}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openChild}
                                className="w-full justify-between"
                                disabled={disabled || isLoadingSubs || !selectedParentId}
                            >
                                {selectedChild ? (
                                    <span className="flex items-center gap-2">
                                        {selectedChild.icon && <span>{selectedChild.icon}</span>}
                                        {selectedChild.name}
                                    </span>
                                ) : (
                                    t('categories.selectSub')
                                )}
                                {isLoadingSubs ? (
                                    <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-50" />
                                ) : (
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder={t('categories.search')} />
                                <CommandList>
                                    <CommandEmpty>{t('categories.notFound')}</CommandEmpty>
                                    <CommandGroup>
                                        {subElements?.map((category) => (
                                            <CommandItem
                                                key={category.id}
                                                value={category.name}
                                                onSelect={() => handleChildSelect(category.id)}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        value === category.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {category.icon && <span className="mr-2">{category.icon}</span>}
                                                {category.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            )}
        </div>
    );
}
