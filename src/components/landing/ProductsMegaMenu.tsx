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
    const isLight = variant === 'light';
    const triggerClassName = variant === 'light'
        ? 'h-9 rounded-full border border-transparent bg-transparent px-3 text-[11px] font-semibold uppercase tracking-tight text-[#66737F] outline-none transition-all hover:bg-[#F3F6F8] hover:text-[#182026] data-[state=open]:!bg-[#F3F6F8] data-[state=open]:!text-[#182026]'
        : 'h-9 rounded-full border border-transparent bg-transparent px-3 text-[11px] font-semibold uppercase tracking-tight text-white/90 outline-none transition-all hover:bg-white/10 hover:text-white data-[state=open]:!bg-white/10 data-[state=open]:!text-white';
    const panelClassName = isLight
        ? 'lg:fixed lg:left-1/2 lg:-translate-x-1/2 lg:top-[85px] flex w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[28px] bg-white/86 shadow-[0_34px_100px_rgba(37,49,58,0.16)] [backdrop-filter:blur(32px)_saturate(180%)] lg:w-[95vw] lg:max-w-[1440px] lg:flex-row'
        : 'lg:fixed lg:left-1/2 lg:-translate-x-1/2 lg:top-[85px] flex flex-col lg:flex-row w-[calc(100vw-2rem)] lg:w-[95vw] lg:max-w-[1440px] bg-[#07101A] rounded-[22px] overflow-hidden shadow-[0_28px_90px_rgba(0,0,0,0.62)] ring-1 ring-white/8 [backdrop-filter:blur(22px)_saturate(145%)]';
    const labelClassName = isLight
        ? 'text-[9px] font-bold uppercase tracking-tight text-[#8A99A4]'
        : 'text-[9px] font-bold text-white/30 uppercase tracking-tight';

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
                            <div className={cn('flex-[1.6] p-6 lg:p-7', isLight ? 'border-b border-white/55 lg:border-b-0 lg:border-r' : 'border-r border-white/5')}>
                                <div className="mb-5 flex items-center justify-between">
                                    <h4 className={labelClassName}>
                                        Recovery Coverage
                                    </h4>
                                    <span className={cn(
                                        'rounded px-2 py-0.5 text-[7px] font-bold uppercase tracking-tighter',
                                        isLight
                                            ? 'bg-white/70 text-[#0B74DE] shadow-[inset_0_0_0_1px_rgba(191,216,234,0.65)]'
                                            : 'border border-emerald-500/10 bg-emerald-500/5 text-emerald-500/50'
                                    )}>
                                        Core Coverage
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                    <NavItem
                                        variant={variant}
                                        icon={Search}
                                        title="Inbound Shipments"
                                        description="Short receives and receiving drift"
                                    />
                                    <NavItem
                                        variant={variant}
                                        icon={ShieldCheck}
                                        title="Lost or Damaged Inventory"
                                        description="Recovery across FBA states"
                                    />
                                    <NavItem
                                        variant={variant}
                                        icon={BoxSelect}
                                        title="Fee Discrepancies"
                                        description="Overcharges, reversals, and gaps"
                                    />
                                    <NavItem
                                        variant={variant}
                                        icon={ArrowLeft}
                                        title="Refund Without Return"
                                        description="Refunds not matched to real return outcome"
                                    />
                                    <NavItem
                                        variant={variant}
                                        icon={Truck}
                                        title="Transfer & Operations"
                                        description="Inter-fulfillment discrepancies"
                                    />
                                    <NavItem
                                        variant={variant}
                                        icon={BarChart3}
                                        title="Recovery Workflow"
                                        description="Valid cases, evidence, filing, payout"
                                        highlight
                                    />
                                </div>
                            </div>

                            {/* Column 2: Evidence & Control */}
                            <div className={cn('flex-1 p-6 lg:p-7', isLight ? 'border-b border-white/55 bg-white/28 lg:border-b-0 lg:border-r' : 'border-r border-white/5 bg-white/[0.01]')}>
                                <h4 className={cn(labelClassName, 'mb-5')}>
                                    Evidence & Control
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    <NavItem
                                        variant={variant}
                                        icon={Layers}
                                        title="Evidence Matching"
                                        description="Connect support to the right case"
                                    />
                                    <NavItem
                                        variant={variant}
                                        icon={Briefcase}
                                        title="Filing Readiness"
                                        description="Hold weak or duplicate issues back"
                                    />
                                    <NavItem
                                        variant={variant}
                                        icon={BadgePercent}
                                        title="Recovery Tracking"
                                        description="Approval and payout visibility"
                                    />
                                    <NavItem
                                        variant={variant}
                                        icon={FileText}
                                        title="Connected Sources"
                                        description="Email, storage, and uploaded proof"
                                    />
                                </div>
                            </div>

                            {/* Column 3: By Seller Type */}
                            <div className={cn('flex-[0.8] p-6 lg:p-7', isLight ? 'bg-white/22' : 'bg-white/[0.02]')}>
                                <h4 className={cn(labelClassName, 'mb-5')}>
                                    By Seller Type
                                </h4>
                                <div className="grid grid-cols-1 gap-2.5">
                                    <NavItem
                                        variant={variant}
                                        icon={Activity}
                                        title="Emerging Sellers"
                                        description="Read-only audit and guided recovery"
                                    />
                                    <NavItem
                                        variant={variant}
                                        icon={TrendingUp}
                                        title="Growth Sellers"
                                        description="Ongoing recovery coverage at scale"
                                    />
                                    <NavItem
                                        variant={variant}
                                        icon={Layers}
                                        title="Enterprise Teams"
                                        description="Multi-workspace recovery operations"
                                    />
                                </div>

                                <div className={cn(
                                    'relative mt-6 overflow-hidden rounded-xl border p-5',
                                    isLight
                                        ? 'border-white/60 bg-white/54 shadow-[0_18px_42px_rgba(37,49,58,0.06)] backdrop-blur-xl'
                                        : 'border-transparent bg-emerald-500/[0.02]'
                                )}>
                                    <h5 className={cn('mb-1 text-[9px] font-bold', isLight ? 'text-[#182026]' : 'text-white')}>Enterprise Support</h5>
                                    <p className={cn('mb-3 line-clamp-1 text-[8px] leading-relaxed', isLight ? 'text-[#66737F]' : 'text-white/40')}>
                                        Recovery coverage for larger and more complex operations.
                                    </p>
                                    <div className={cn('flex cursor-default items-center gap-1.5 text-[8px] font-bold uppercase tracking-tight', isLight ? 'text-[#0B74DE]' : 'text-emerald-400')}>
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
                        ? 'border-white/70 bg-white/58 shadow-[0_14px_36px_rgba(11,116,222,0.08)]'
                        : 'border-transparent bg-transparent hover:border-white/70 hover:bg-white/48 hover:shadow-[0_14px_36px_rgba(37,49,58,0.08)]'
                    : highlight
                        ? 'bg-emerald-500/[0.03] border-emerald-500/10'
                        : 'border-transparent bg-transparent'
            )}
        >
            <div className="flex items-center gap-3.5">
                <div className={cn(
                    'shrink-0 rounded-lg border p-2 transition-all',
                    isLight
                        ? highlight
                            ? 'border-white/70 bg-white/76 text-[#0B74DE]'
                            : 'border-white/60 bg-white/40 text-[#0B74DE] group-hover:bg-white/76'
                        : highlight
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'border-transparent bg-white/5 text-white/40'
                )}>
                    <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                    <span className={cn(
                        'block whitespace-nowrap text-[9.5px] font-bold tracking-tight',
                        isLight
                            ? highlight
                                ? 'text-[#0B74DE]'
                                : 'text-[#182026]'
                            : highlight
                                ? 'text-emerald-400'
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
