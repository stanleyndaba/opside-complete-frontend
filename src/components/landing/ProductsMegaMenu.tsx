import React from 'react';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuList,
    NavigationMenuTrigger
} from '@/components/ui/navigation-menu';
import {
    ArrowRight,
    Building2,
    Briefcase,
    FileCheck2,
    Layers,
    Users,
    WalletCards,
    Crown,
    Store,
    CheckCircle2,
    type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const productMenuGroups = [
    {
        label: 'By Business',
        items: [
            { title: 'Established FBA Brands', description: 'Continuous recovery control for brands with recurring shipment volume, meaningful inventory exposure and growing operational complexity.', icon: Store },
            { title: 'Agencies & Amazon Operators', description: 'Manage recoveries across client accounts while keeping evidence, ownership and seller approvals clear.', icon: Briefcase },
            { title: 'Aggregators & Multi-Brand Portfolios', description: 'Standardize recovery monitoring, case handling and financial reconciliation across multiple brands and entities.', icon: Building2 }
        ]
    },
    {
        label: 'By Team',
        items: [
            { title: 'Operations Teams', description: 'See evidence readiness, deadlines, ownership, Amazon responses and the next required action.', icon: Layers },
            { title: 'Finance Teams', description: 'Compare expected, approved, paid, underpaid, reversed and unreconciled values from one recovery record.', icon: WalletCards },
            { title: 'Founders & Leadership', description: 'Understand current recovery exposure, unresolved financial risk and the value reaching the business.', icon: Crown }
        ]
    },
    {
        label: 'Control at Scale',
        items: [
            { title: 'Multi-Account Oversight', description: 'Monitor recovery status across stores, brands and client accounts.', icon: Users },
            { title: 'Team Roles & Approvals', description: 'Assign ownership and preserve seller approval before sensitive actions.', icon: CheckCircle2 },
            { title: 'Accounting-Ready Records', description: 'Keep the case, evidence, response, payout and settlement trail connected for finance review.', icon: FileCheck2 }
        ]
    }
];

type ProductsMegaMenuProps = {
    variant?: 'dark' | 'light';
};

export function ProductsMegaMenu({ variant = 'dark' }: ProductsMegaMenuProps) {
    const triggerClassName = variant === 'light'
        ? 'h-9 rounded-[6px] border border-transparent bg-transparent px-3 text-[10px] font-sans font-bold uppercase tracking-tight text-[var(--margin-text-secondary)] outline-none ring-0 transition-colors hover:border-transparent hover:bg-[var(--margin-surface-alt)] hover:text-[var(--margin-text-primary)] focus:border-transparent focus:bg-transparent focus:text-[var(--margin-text-secondary)] focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 data-[state=open]:!border-transparent data-[state=open]:!bg-[var(--margin-surface-alt)] data-[state=open]:!text-[var(--margin-text-primary)]'
        : 'h-9 rounded-full !border-0 bg-transparent px-3 text-[11px] font-semibold uppercase tracking-tight text-white/90 shadow-none outline-none ring-0 transition-colors hover:!border-0 hover:bg-white/10 hover:text-white focus:!border-0 focus:bg-transparent focus:text-white/90 focus-visible:!border-0 focus-visible:outline-none focus-visible:ring-0 data-[state=open]:!border-0 data-[state=open]:!bg-white/10 data-[state=open]:!text-white';

    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className={cn(triggerClassName, "tracking-tight")}>
                        For Teams
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="relative z-[100] w-[calc(100vw-2rem)] max-h-[calc(100vh-160px)] overflow-y-auto rounded-[4px] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-[#E5E7EB] scrollbar-hide lg:fixed lg:left-1/2 lg:top-[72px] lg:w-[96vw] lg:max-w-[1020px] lg:-translate-x-1/2">
                            <div className="grid grid-cols-1 lg:grid-cols-3">
                                {productMenuGroups.map((group, index) => (
                                    <div
                                        key={group.label}
                                        className={cn(
                                            'p-4 lg:p-5',
                                            index < productMenuGroups.length - 1 && 'border-b border-[#D8E3E8]/60 lg:border-b-0 lg:border-r'
                                        )}
                                    >
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <h4 className="text-[11px] font-lora font-medium tracking-tight text-[#94A3B8]">
                                                {group.label}
                                            </h4>
                                            {group.badge && (
                                                <span className="rounded-[3px] border border-[#CDD7DE] bg-white/65 px-2 py-0.5 text-[8px] font-bold uppercase tracking-tight text-[#3D4952]">
                                                    {group.badge}
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 gap-0">
                                            {group.items.map((item) => (
                                                <ProductServiceItem
                                                    key={item.title}
                                                    icon={item.icon}
                                                    title={item.title}
                                                    description={item.description}
                                                    variant="light"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-[#D8E3E8] bg-[#F8FAFB] px-6 py-3 lg:flex lg:items-center lg:justify-between lg:px-8">
                                <div>
                                    <p className="text-[14px] font-semibold tracking-tight text-[#182026]">Built for serious FBA operations</p>
                                    <p className="mt-0.5 max-w-[680px] text-[11px] font-normal tracking-tight text-[#66737F]">
                                        Margin is designed for businesses where recovery crosses multiple shipments, systems and people, and where missed windows, weak evidence or incorrect payouts materially affect margin.
                                    </p>
                                </div>
                                <span className="mt-4 inline-flex cursor-pointer items-center gap-2 text-[12px] font-semibold tracking-tight text-[#0B74DE] transition-colors hover:text-[#0967C8] lg:mt-0">
                                    See who Margin is for
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </span>
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
                'landing-menu-item group flex cursor-default items-start gap-3 rounded-[3px] px-2 py-2.5 transition-colors duration-150',
                isLight
                    ? 'hover:bg-[#F3F5F4]'
                    : 'hover:bg-white/[0.03] hover:border-white/10'
            )}
        >
            <div className={cn(
                'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center transition-colors',
                isLight ? 'text-[#6B7280] group-hover:text-[#0B74DE]' : 'text-white/40 group-hover:text-white'
            )}>
                <Icon className="h-full w-full" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
                <span className={cn(
                    'block text-[12px] font-sans font-semibold tracking-tight transition-colors',
                    isLight ? 'text-[#182026] group-hover:text-[#0B74DE]' : 'text-white group-hover:text-blue-400'
                )}>
                    {title}
                </span>
                <p className={cn(
                    'mt-0.5 text-[10px] font-sans font-normal leading-[1.45] tracking-tight',
                    isLight ? 'text-[#66737F]' : 'text-white/50'
                )}>
                    {description}
                </p>
            </div>
        </div>
    );
}
