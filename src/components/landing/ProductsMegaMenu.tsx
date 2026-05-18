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
    Search,
    Briefcase,
    TrendingUp,
    ArrowRight,
    BoxSelect,
    BadgePercent,
    Truck,
    ShieldCheck,
    ArrowLeft,
    Layers,
    BarChart3,
    Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ProductsMegaMenuProps = {
    variant?: 'dark' | 'light';
};

export function ProductsMegaMenu({ variant = 'dark' }: ProductsMegaMenuProps) {
    const triggerClassName = variant === 'light'
        ? 'h-9 rounded-full border border-transparent bg-transparent px-3 text-[11px] font-semibold uppercase tracking-tight text-[#66737F] outline-none ring-0 transition-colors hover:border-transparent hover:bg-[#F3F6F8] hover:text-[#182026] focus:border-transparent focus:bg-transparent focus:text-[#66737F] focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 data-[state=open]:!border-transparent data-[state=open]:!bg-[#F3F6F8] data-[state=open]:!text-[#182026]'
        : 'h-9 rounded-full border border-transparent bg-transparent px-3 text-[11px] font-semibold uppercase tracking-tight text-white/90 outline-none ring-0 transition-colors hover:border-transparent hover:bg-white/10 hover:text-white focus:border-transparent focus:bg-transparent focus:text-white/90 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 data-[state=open]:!border-transparent data-[state=open]:!bg-white/10 data-[state=open]:!text-white';
    const panelClassName = 'lg:fixed lg:left-1/2 lg:-translate-x-1/2 lg:top-[85px] flex flex-col lg:flex-row w-[calc(100vw-2rem)] lg:w-[95vw] lg:max-w-[1440px] bg-[#FAFAF7] rounded-[22px] overflow-hidden shadow-[0_28px_90px_rgba(37,49,58,0.16)] ring-1 ring-[#D8E3E8]';
    const labelClassName = 'text-[9px] font-bold text-[#66737F] uppercase tracking-tight';

    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className={triggerClassName}>
                        Products
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className={cn(panelClassName, 'relative z-[100]')}>

                            {/* Column 1: Recovery Coverage */}
                            <div className="flex-[1.6] border-r border-[#E4EDF1] p-6 lg:p-7">
                                <div className="mb-5 flex items-center justify-between">
                                    <h4 className={labelClassName}>
                                        Recovery Coverage
                                    </h4>
                                    <span className={cn(
                                        'rounded px-2 py-0.5 text-[7px] font-bold uppercase tracking-tighter',
                                        'border border-[#D8E3E8] bg-white text-[#66737F]'
                                    )}>
                                        Core Coverage
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                    <NavItem
                                        variant="light"
                                        icon={Search}
                                        title="Inbound Shipments"
                                        description="Short receives and receiving drift"
                                    />
                                    <NavItem
                                        variant="light"
                                        icon={ShieldCheck}
                                        title="Lost or Damaged Inventory"
                                        description="Recovery across FBA states"
                                    />
                                    <NavItem
                                        variant="light"
                                        icon={BoxSelect}
                                        title="Fee Discrepancies"
                                        description="Overcharges, reversals, and gaps"
                                    />
                                    <NavItem
                                        variant="light"
                                        icon={ArrowLeft}
                                        title="Refund Without Return"
                                        description="Refunds not matched to real return outcome"
                                    />
                                    <NavItem
                                        variant="light"
                                        icon={Truck}
                                        title="Transfer & Operations"
                                        description="Inter-fulfillment discrepancies"
                                    />
                                    <NavItem
                                        variant="light"
                                        icon={BarChart3}
                                        title="Recovery Workflow"
                                        description="Valid cases, evidence, filing, payout"
                                        highlight
                                    />
                                </div>
                            </div>

                            {/* Column 2: Evidence & Control */}
                            <div className="flex-1 border-r border-[#E4EDF1] bg-white/45 p-6 lg:p-7">
                                <h4 className={cn(labelClassName, 'mb-5')}>
                                    Evidence & Control
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    <NavItem
                                        variant="light"
                                        icon={Layers}
                                        title="Evidence Matching"
                                        description="Connect support to the right case"
                                    />
                                    <NavItem
                                        variant="light"
                                        icon={Briefcase}
                                        title="Filing Readiness"
                                        description="Hold weak or duplicate issues back"
                                    />
                                    <NavItem
                                        variant="light"
                                        icon={BadgePercent}
                                        title="Recovery Tracking"
                                        description="Approval and payout visibility"
                                    />
                                    <NavItem
                                        variant="light"
                                        icon={FileText}
                                        title="Connected Sources"
                                        description="Email, storage, and uploaded proof"
                                    />
                                </div>
                            </div>

                            {/* Column 3: By Seller Type */}
                            <div className="flex-[0.8] bg-white/70 p-6 lg:p-7">
                                <h4 className={cn(labelClassName, 'mb-5')}>
                                    By Seller Type
                                </h4>
                                <div className="grid grid-cols-1 gap-2.5">
                                    <NavItem
                                        variant="light"
                                        icon={Activity}
                                        title="Emerging Sellers"
                                        description="Read-only audit and guided recovery"
                                    />
                                    <NavItem
                                        variant="light"
                                        icon={TrendingUp}
                                        title="Growth Sellers"
                                        description="Ongoing recovery coverage at scale"
                                    />
                                    <NavItem
                                        variant="light"
                                        icon={Layers}
                                        title="Enterprise Teams"
                                        description="Multi-workspace recovery operations"
                                    />
                                </div>

                                <div className={cn(
                                    'relative mt-6 overflow-hidden rounded-xl border p-5',
                                    'border-[#D8E3E8] bg-white'
                                )}>
                                    <h5 className="mb-1 text-[9px] font-bold text-[#182026]">Enterprise Support</h5>
                                    <p className="mb-3 line-clamp-1 text-[8px] leading-relaxed text-[#66737F]">
                                        Recovery coverage for larger and more complex operations.
                                    </p>
                                    <div className="flex cursor-default items-center gap-1.5 text-[8px] font-bold uppercase tracking-tight text-[#182026]">
                                        Recovery Coverage <ArrowRight className="h-2.5 w-2.5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}

function NavItem({
    icon: Icon,
    title,
    description,
    highlight = false,
    variant = 'dark'
}: {
    icon: any,
    title: string,
    description: string,
    highlight?: boolean,
    variant?: 'dark' | 'light'
}) {
    const isLight = variant === 'light';

    return (
        <div
            className={cn(
                'group block cursor-default rounded-xl border p-3.5 transition-colors',
                isLight
                    ? highlight
                        ? 'border-white/70 bg-white/58 shadow-[0_14px_36px_rgba(37,49,58,0.08)]'
                        : 'border-transparent bg-transparent hover:border-white/70 hover:bg-white/48 hover:shadow-[0_14px_36px_rgba(37,49,58,0.08)]'
                    : highlight
                        ? 'border-white/10 bg-white/[0.06]'
                        : 'border-transparent bg-transparent'
            )}
        >
            <div className="flex items-center gap-3.5">
                <div className={cn(
                    'shrink-0 rounded-lg border p-2 transition-all',
                    isLight
                        ? highlight
                            ? 'border-white/70 bg-white/76 text-[#25313A]'
                            : 'border-white/60 bg-white/40 text-[#25313A] group-hover:bg-white/76'
                        : highlight
                            ? 'border-white/15 bg-white/10 text-white/75'
                            : 'border-transparent bg-white/5 text-white/40'
                )}>
                    <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                    <span className={cn(
                        'block whitespace-nowrap text-[9.5px] font-bold tracking-tight',
                        isLight
                            ? highlight
                                ? 'text-[#25313A]'
                                : 'text-[#182026]'
                            : highlight
                                ? 'text-white'
                                : 'text-white/90'
                    )}>
                        {title}
                    </span>
                    <p className={cn('mt-1 text-[8px] leading-none', isLight ? 'text-[#66737F]' : 'text-white/20')}>
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
}
