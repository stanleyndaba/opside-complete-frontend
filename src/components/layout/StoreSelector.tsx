import React, { useEffect, useState } from 'react';
import { Store, ChevronDown, Check, Plus, Globe, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface StoreEntity {
    id: string;
    name: string;
    marketplace: string;
    is_active: boolean;
}

export function StoreSelector() {
    const [stores, setStores] = useState<StoreEntity[]>([]);
    const [activeStoreId, setActiveStoreId] = useState<string | null>(
        localStorage.getItem('active_store_id')
    );
    const [isLoading, setIsLoading] = useState(true);

    const activeStore = stores.find(s => s.id === activeStoreId) || stores[0];

    useEffect(() => {
        async function loadStores() {
            try {
                const response = await api.getStores();
                if (response.ok && response.data?.stores) {
                    setStores(response.data.stores);

                    // If no active store is set, default to the first one
                    if (!activeStoreId && response.data.stores.length > 0) {
                        handleSwitchStore(response.data.stores[0].id);
                    }
                }
            } catch (error) {
                console.error('Failed to load stores:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadStores();
    }, []);

    const handleSwitchStore = (storeId: string) => {
        localStorage.setItem('active_store_id', storeId);
        setActiveStoreId(storeId);
        // Refresh the page to reset all contexts and data planes
        window.location.reload();
    };

    if (isLoading) {
        return (
            <div className="h-9 w-32 bg-slate-100 animate-pulse rounded-lg" />
        );
    }

    // Handle case with no stores (e.g. new user)
    if (stores.length === 0) {
        return (
            <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 gap-2 border-dashed border-slate-300 text-slate-500 hover:text-emerald-600 hover:border-emerald-200"
                onClick={() => window.location.href = '/integrations-hub'}
            >
                <Plus className="h-3.5 w-3.5" />
                <span className="text-[13px] font-medium">Connect Store</span>
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100/80 rounded-lg transition-all group border border-transparent hover:border-slate-200/50">
                    <div className="h-6 w-6 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                        <Store className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col items-start min-w-[100px]">
                        <span className="text-[13px] font-semibold text-slate-900 leading-none mb-0.5">
                            {activeStore?.name || 'Select Store'}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                            <Globe className="h-2 w-2" />
                            {activeStore?.marketplace?.replace('amazon_', '') || 'Marketplace'}
                        </span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors ml-1" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 p-1 shadow-2xl border-slate-200/60 rounded-xl">
                <DropdownMenuLabel className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Personal Control Plane
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100" />

                {stores.map((store) => (
                    <DropdownMenuItem
                        key={store.id}
                        onClick={() => handleSwitchStore(store.id)}
                        className={cn(
                            "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all mb-0.5 last:mb-0",
                            activeStoreId === store.id ? "bg-emerald-50 text-emerald-900" : "hover:bg-slate-50 text-slate-600"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                                activeStoreId === store.id ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                            )}>
                                <Store className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-semibold tracking-tight">{store.name}</span>
                                <span className="text-[11px] opacity-70 font-medium">{store.marketplace}</span>
                            </div>
                        </div>
                        {activeStoreId === store.id && (
                            <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                <Check className="h-3 w-3" />
                            </div>
                        )}
                    </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem
                    onClick={() => window.location.href = '/integrations-hub'}
                    className="px-3 py-2.5 rounded-lg cursor-pointer text-emerald-600 hover:bg-emerald-50 font-semibold text-[13px] flex items-center gap-2"
                >
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Plus className="h-4 w-4" />
                    </div>
                    Add New Marketplace
                </DropdownMenuItem>

                <div className="px-3 py-2 mt-1 bg-slate-50 rounded-lg flex items-center gap-2 group border border-slate-100">
                    <ShieldCheck className="h-3 w-3 text-slate-400" />
                    <span className="text-[10px] text-slate-400 font-medium leading-none">
                        Hard Execution Boundary Active
                    </span>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
