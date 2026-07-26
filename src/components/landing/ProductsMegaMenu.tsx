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
        label: 'Recovery Workflow',
        items: [
            { title: 'Discrepancy Detection', description: 'Find inventory, reimbursement, and fee discrepancies automatically.', icon: TrendingUp },
            { title: 'Evidence Builder', description: 'Connect invoices, BOLs, PODs, and shipment records into one case.', icon: Layers },
            { title: 'Case Preparation', description: 'Prepare Amazon-ready recovery cases before filing.', icon: FileText },
            { title: 'Recovery Automation', description: 'Handle follow-ups, lowball offers, and rejections automatically.', icon: ShieldCheck }
        ]
    },
    {
        label: 'Operational Control',
        items: [
            { title: 'Recovery Dashboard', description: 'Track claims, payouts, deadlines, and recovery performance.', icon: BarChart3 },
            { title: 'Recovery Timeline', description: 'Every Amazon reply, action, document, and payout in one place.', icon: Briefcase },
            { title: 'Global Operations', description: 'Manage recovery across every supported Amazon marketplace.', icon: Globe2 },
            { title: 'Accounting Integrations', description: 'Export recovered payouts to QuickBooks and Xero.', icon: Network }
        ]
    },
    {
        label: 'Solutions',
        items: [
            { title: 'Early Access', description: 'Founding 500 access with 0% commission through 2026.', icon: BadgePercent },
            { title: 'Enterprise', description: 'Recovery operations for multi-store and enterprise sellers.', icon: TrendingUp },
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
        : 'h-9 rounded-full !border-0 bg-transparent px-3 text-[11px] font-semibold uppercase tracking-tight text-white/90 shadow-none outline-none ring-0 transition-colors hover:!border-0 hover:bg-white/10 hover:text-white focus:!border-0 focus:bg-transparent focus:text-white/90 focus-visible:!border-0 focus-visible:outline-none focus-visible:ring-0 data-[state=open]:!border-0 data-[state=open]:!bg-white/10 data-[state=open]:!text-white';

    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className={triggerClassName}>
                        Operations
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="relative z-[100] w-[calc(100vw-2rem)] overflow-hidden rounded-[14px] bg-[#F3F6F8] shadow-[0_22px_70px_rgba(37,49,58,0.14)] ring-1 ring-[#D8E3E8] lg:fixed lg:left-1/2 lg:top-[78px] lg:w-[92vw] lg:max-w-[1040px] lg:-translate-x-1/2">
                            <div className="grid grid-cols-1 lg:grid-cols-3">
                                {productMenuGroups.map((group, index) => (
                                    <div
                                        key={group.label}
                                        className={cn(
                                            'p-5 lg:p-6',
                                            index === 1 && 'bg-white/45',
                                            index < productMenuGroups.length - 1 && 'border-b border-[#E4EDF1] lg:border-b-0 lg:border-r'
                                        )}
                                    >
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <h4 className="text-[10px] font-bold uppercase tracking-tight text-[#66737F]">
                                                {group.label}
                                            </h4>
                                            {group.badge && (
                                                <span className="rounded-[3px] border border-[#CDD7DE] bg-white/65 px-2 py-0.5 text-[8px] font-bold uppercase tracking-tight text-[#3D4952]">
                                                    {group.badge}
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 gap-1.5">
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
                'group flex cursor-default items-center gap-3 rounded-[6px] border p-3 transition-all duration-200 ease-out hover:-translate-y-0.5',
                isLight
                    ? 'border-transparent bg-transparent hover:border-[#DCE3E8] hover:bg-white hover:shadow-[0_16px_34px_rgba(24,32,38,0.08)]'
                    : 'border-transparent bg-transparent hover:bg-white/[0.045] hover:shadow-[0_16px_34px_rgba(255,255,255,0.05)]'
            )}
        >
            <div className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] transition-all duration-200',
                isLight
                    ? 'border border-[#CDD7DE] bg-[#F9F9FB] text-[#25313A] group-hover:border-[#9EACB6] group-hover:bg-white group-hover:shadow-[0_0_0_3px_rgba(24,32,38,0.04)]'
                    : 'bg-white/[0.055] text-white group-hover:bg-white/[0.075] group-hover:shadow-[0_0_0_3px_rgba(255,255,255,0.055)]'
            )}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
                <span className={cn('block text-[12.5px] font-bold tracking-tight', isLight ? 'text-[#182026]' : 'text-white')}>
                    {title}
                </span>
                <p className={cn('mt-1 text-[10.5px] leading-[1.35]', isLight ? 'text-[#66737F]' : 'text-white/55')}>
                    {description}
                </p>
            </div>
        </div>
    );
}
