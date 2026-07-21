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
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { tenantRoute } from '@/lib/routes';
import { useTenant } from '@/contexts/TenantContext';

interface StoreEntity {
    id: string;
    name: string;
    marketplace: string;
    is_active: boolean;
}

export function StoreSelector() {
    const { tenantSlug } = useParams();
    const { isReady, tenant } = useTenant();
    const navigate = useNavigate();
    const currentTenantSlug = tenantSlug || tenant?.slug || 'beta';

    const [stores, setStores] = useState<StoreEntity[]>([]);
    const [activeStoreId, setActiveStoreId] = useState<string | null>(
        localStorage.getItem('active_store_id')
    );
    const [isLoading, setIsLoading] = useState(true);

    const activeStore = stores.find(s => s.id === activeStoreId) || stores[0];

    useEffect(() => {
        if (!isReady) return;
        async function loadStores() {
            try {
                const response = await api.getStores(currentTenantSlug);
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
    }, [isReady, currentTenantSlug]);

    const handleSwitchStore = (storeId: string) => {
        localStorage.setItem('active_store_id', storeId);
        setActiveStoreId(storeId);
        // Refresh the page to reset all contexts and data planes
        // In Option A, we'd ideally also change the tenantSlug if stores mapped to tenants
        // For now, keep hard reload but consider updating the URL if needed
        window.location.reload();
    };

    if (isLoading) {
        return null;
    }

    // Handle case with no stores (e.g. new user)
    if (stores.length === 0) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 px-4 py-2 hover:bg-white/[0.03] rounded-xl transition-all group border border-transparent hover:border-white/5">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500/20 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        <Store className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col items-start min-w-[100px]">
                        <span className="text-[11px] font-serif font-medium text-white tracking-tight uppercase">
                            {activeStore?.name || 'SELECT_NODE'}
                        </span>
                        <span className="text-[9px] font-mono text-emerald-500/50 flex items-center gap-1 uppercase tracking-tight">
                            <Globe className="h-2 w-2" />
                            {activeStore?.marketplace?.replace('amazon_', '') || 'REGION_LOCKED'}
                        </span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-white/20 group-hover:text-emerald-500 transition-colors ml-1" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 p-1.5 bg-[#0c0c0c] border border-white/10 shadow-3xl rounded-xl backdrop-blur-3xl">
                <DropdownMenuLabel className="px-3 py-2.5 text-[10px] font-mono font-bold text-white/20 uppercase tracking-tight">
                    Control_Plane_Nodes
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5 mx-2" />

                <ScrollArea className="max-h-[280px]">
                    <div className="p-1 space-y-1">
                        {stores.map((store) => (
                            <DropdownMenuItem
                                key={store.id}
                                onClick={() => handleSwitchStore(store.id)}
                                className={cn(
                                    "flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-all group/item",
                                    activeStoreId === store.id ? "bg-emerald-500/10 text-emerald-500" : "hover:bg-white/5 text-white/40 hover:text-white"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-9 w-9 rounded-lg flex items-center justify-center transition-all",
                                        activeStoreId === store.id ? "bg-emerald-500/20 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "bg-white/5 text-white/20 group-hover/item:text-white"
                                    )}>
                                        <Store className="h-4.5 w-4.5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-serif font-medium tracking-tight uppercase">{store.name}</span>
                                        <span className="text-[9px] font-mono opacity-50 uppercase tracking-tight">{store.marketplace}</span>
                                    </div>
                                </div>
                                {activeStoreId === store.id && (
                                    <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-black">
                                        <Check className="h-3 w-3" />
                                    </div>
                                )}
                            </DropdownMenuItem>
                        ))}
                    </div>
                </ScrollArea>

                <DropdownMenuSeparator className="bg-white/5 mx-2" />
                <DropdownMenuItem
                    onClick={() => navigate(tenantRoute(currentTenantSlug, '/integrations-hub'))}
                    className="px-3 py-3 rounded-lg cursor-pointer text-white/60 hover:bg-emerald-500/10 hover:text-emerald-500 font-serif font-medium text-[12px] flex items-center gap-3 uppercase tracking-tight transition-all"
                >
                    <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:text-emerald-500">
                        <Plus className="h-4 w-4" />
                    </div>
                    Link_New_Marketplace
                </DropdownMenuItem>

                <div className="px-4 py-2.5 mt-1 bg-white/[0.02] rounded-lg flex items-center gap-2 border border-white/5 mx-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-500/50" />
                    <span className="text-[9px] text-white/20 font-mono uppercase tracking-tight">
                        EXECUTION_BOUNDARY: SECURE
                    </span>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
