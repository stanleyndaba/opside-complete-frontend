/**
 * TenantSwitcher - Dropdown component for switching between workspaces
 */

import React from 'react';
import { useTenant, Tenant } from '@/contexts/TenantContext';
import { ChevronDown, Building2, Check, Crown, Shield, User, Eye } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Get role icon
 */
function RoleIcon({ role }: { role: Tenant['role'] }) {
    switch (role) {
        case 'owner':
            return <Crown className="h-3 w-3 text-amber-500" />;
        case 'admin':
            return <Shield className="h-3 w-3 text-blue-500" />;
        case 'member':
            return <User className="h-3 w-3 text-gray-500" />;
        case 'viewer':
            return <Eye className="h-3 w-3 text-gray-400" />;
    }
}

/**
 * Get plan badge color
 */
function getPlanColor(plan: Tenant['plan']): string {
    switch (plan) {
        case 'enterprise':
            return 'bg-purple-100 text-purple-700';
        case 'professional':
            return 'bg-blue-100 text-blue-700';
        case 'starter':
            return 'bg-green-100 text-green-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
}

/**
 * Get status badge color
 */
function getStatusColor(status: Tenant['status']): string {
    switch (status) {
        case 'active':
            return 'bg-green-100 text-green-700';
        case 'trialing':
            return 'bg-blue-100 text-blue-700';
        case 'suspended':
        case 'read_only':
            return 'bg-yellow-100 text-yellow-700';
        case 'canceled':
        case 'deleted':
            return 'bg-red-100 text-red-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
}

interface TenantSwitcherProps {
    className?: string;
    showPlan?: boolean;
    compact?: boolean;
}

export function TenantSwitcher({ className, showPlan = true, compact = false }: TenantSwitcherProps) {
    const { tenant, tenants, switchTenant, isLoading } = useTenant();

    if (!tenant) {
        return null;
    }

    // Single tenant - no switcher needed
    if (tenants.length <= 1 && compact) {
        return (
            <div className={cn('flex items-center gap-2', className)}>
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">{tenant.name}</span>
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        'flex items-center gap-2 px-3 py-2 h-auto',
                        className
                    )}
                    disabled={isLoading}
                >
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">{tenant.name}</span>
                        {showPlan && !compact && (
                            <span className="text-xs text-gray-500 capitalize">{tenant.plan} plan</span>
                        )}
                    </div>
                    {tenants.length > 1 && (
                        <ChevronDown className="h-4 w-4 text-gray-400 ml-1" />
                    )}
                </Button>
            </DropdownMenuTrigger>

            {tenants.length > 1 && (
                <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wider">
                        Switch Workspace
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {tenants.map((t) => (
                        <DropdownMenuItem
                            key={t.id}
                            onClick={() => t.id !== tenant.id && switchTenant(t.slug)}
                            className={cn(
                                'flex items-center justify-between cursor-pointer',
                                t.id === tenant.id && 'bg-gray-50'
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-gray-400" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{t.name}</span>
                                    <div className="flex items-center gap-1">
                                        <RoleIcon role={t.role} />
                                        <span className="text-xs text-gray-500 capitalize">{t.role}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {t.status !== 'active' && (
                                    <Badge variant="outline" className={cn('text-xs', getStatusColor(t.status))}>
                                        {t.status}
                                    </Badge>
                                )}
                                <Badge variant="outline" className={cn('text-xs', getPlanColor(t.plan))}>
                                    {t.plan}
                                </Badge>
                                {t.id === tenant.id && (
                                    <Check className="h-4 w-4 text-green-500" />
                                )}
                            </div>
                        </DropdownMenuItem>
                    ))}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-xs text-gray-500">
                        <span>Manage workspaces in Settings</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            )}
        </DropdownMenu>
    );
}

export default TenantSwitcher;
