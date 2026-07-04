import React from 'react';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuList,
    NavigationMenuTrigger
} from '@/components/ui/navigation-menu';
import {
    FileText,
    Briefcase,
    TrendingUp,
    BadgePercent,
    ShieldCheck,
    Layers,
    BarChart3,
    Activity,
    Globe2,
    Network,
    type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const productMenuGroups = [
    {
        label: 'Recovery Infrastructure',
        badge: 'Core Systems',
        items: [
            { title: 'Discrepancy Engine', description: 'Continuous monitoring of inbound, inventory, and fee states.', icon: Activity },
            { title: 'Evidence Vault', description: 'Automated collection of BOLs, invoices, and shipment logs.', icon: Layers },
            { title: 'Surgical Case Builder', description: 'Policy-aligned claim construction for maximum approval rates.', icon: FileText },
            { title: 'Dispute Automation', description: 'Autonomous handling of lowball offers and rejections.', icon: ShieldCheck }
        ]
    },
    {
        label: 'Operational Control',
        items: [
            { title: 'Recovery Intelligence', description: 'Real-time visibility into claim status, payouts, and ROI.', icon: BarChart3 },
            { title: 'Audit Transparency', description: 'Full logs of every agent action and Amazon interaction.', icon: Briefcase },
            { title: 'Global Sync', description: 'Unified recovery operations across all international marketplaces.', icon: Globe2 },
            { title: 'API & Integrations', description: 'Connect recovery data to your existing ERP or warehouse stack.', icon: Network }
        ]
    },
    {
        label: 'Solutions',
        items: [
            { title: 'Founding 500', description: 'Exclusive infrastructure access for early believers.', icon: BadgePercent },
            { title: 'Enterprise Ops', description: 'Multi-workspace recovery for aggregators and 8-figure brands.', icon: TrendingUp },
            { title: 'Managed Recovery', description: 'White-glove oversight for complex, high-volume accounts.', icon: Briefcase }
        ]
    }
];

type ProductsMegaMenuProps = {
    variant?: 'dark' | 'light';
};

export function ProductsMegaMenu({ variant = 'dark' }: ProductsMegaMenuProps) {
    const triggerClassName = variant === 'light'
        ? 'h-9 rounded-[6px] border border-transparent bg-transparent px-3 text-[10px] font-sans font-bold uppercase tracking-tight text-[#25313A] outline-none ring-0 transition-colors hover:border-transparent hover:bg-[#F3F6F8] hover:text-[#182026] focus:border-transparent focus:bg-transparent focus:text-[#25313A] focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 data-[state=open]:!border-transparent data-[state=open]:!bg-[#F3F6F8] data-[state=open]:!text-[#182026]'
        : 'h-9 rounded-full border border-transparent bg-transparent px-3 text-[11px] font-semibold uppercase tracking-tight text-white/90 outline-none ring-0 transition-colors hover:border-transparent hover:bg-white/10 hover:text-white focus:border-transparent focus:bg-transparent focus:text-white/90 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 data-[state=open]:!border-transparent data-[state=open]:!bg-white/10 data-[state=open]:!text-white';

    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className={triggerClassName}>
                        Products
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="relative z-[100] w-[calc(100vw-2rem)] overflow-hidden rounded-[22px] bg-[#FAFAF7] shadow-[0_28px_90px_rgba(37,49,58,0.16)] ring-1 ring-[#D8E3E8] lg:fixed lg:left-1/2 lg:top-[85px] lg:w-[95vw] lg:max-w-[1120px] lg:-translate-x-1/2">
                            <div className="grid grid-cols-1 lg:grid-cols-3">
                                {productMenuGroups.map((group, index) => (
                                    <div
                                        key={group.label}
                                        className={cn(
                                            'p-6 lg:p-7',
                                            index === 1 && 'bg-white/45',
                                            index < productMenuGroups.length - 1 && 'border-b border-[#E4EDF1] lg:border-b-0 lg:border-r'
                                        )}
                                    >
                                        <div className="mb-5 flex items-center justify-between gap-3">
                                            <h4 className="text-[10px] font-bold uppercase tracking-tight text-[#66737F]">
                                                {group.label}
                                            </h4>
                                            {group.badge && (
                                                <span className="rounded-[4px] border border-[#CDD7DE] bg-white/65 px-2.5 py-1 text-[8px] font-bold uppercase tracking-tight text-[#3D4952]">
                                                    {group.badge}
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 gap-2.5">
                                            {group.items.map((item) => (
                                                <ProductServiceItem
                                                    key={item.title}
                                                    icon={item.icon}
                                                    title={item.title}
                                                    description={item.description}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}

export function ProductServiceItem({
    icon: Icon,
    title,
    description,
    variant = 'light'
}: {
    icon: LucideIcon,
    title: string,
    description: string,
    variant?: 'dark' | 'light'
}) {
    const isLight = variant === 'light';

    return (
        <div
            className={cn(
                'group flex cursor-default items-center gap-3.5 rounded-[8px] border p-4 transition-all duration-200 ease-out hover:-translate-y-0.5',
                isLight
                    ? 'border-transparent bg-transparent hover:border-[#DCE3E8] hover:bg-white hover:shadow-[0_16px_34px_rgba(24,32,38,0.08)]'
                    : 'border-transparent bg-transparent hover:bg-white/[0.045] hover:shadow-[0_16px_34px_rgba(255,255,255,0.05)]'
            )}
        >
            <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border transition-all duration-200',
                isLight
                    ? 'border-[#CDD7DE] bg-[#F9F9FB] text-[#25313A] group-hover:border-[#9EACB6] group-hover:bg-white group-hover:shadow-[0_0_0_3px_rgba(24,32,38,0.04)]'
                    : 'border-white/14 bg-white/[0.035] text-white group-hover:border-white/28 group-hover:shadow-[0_0_0_3px_rgba(255,255,255,0.055)]'
            )}>
                <Icon className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
                <span className={cn('block text-[13px] font-bold tracking-tight', isLight ? 'text-[#182026]' : 'text-white')}>
                    {title}
                </span>
                <p className={cn('mt-1.5 text-[11px] leading-[1.45]', isLight ? 'text-[#66737F]' : 'text-white/55')}>
                    {description}
                </p>
            </div>
        </div>
    );
}
