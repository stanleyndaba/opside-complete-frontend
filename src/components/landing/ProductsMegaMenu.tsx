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
    ArrowRight,
    BadgePercent,
    ShieldCheck,
    Layers,
    BarChart3,
    Activity,
    Globe2,
    Network
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ProductsMegaMenuProps = {
    variant?: 'dark' | 'light';
};

export function ProductsMegaMenu({ variant = 'dark' }: ProductsMegaMenuProps) {
    const triggerClassName = variant === 'light'
        ? 'h-9 rounded-[6px] border border-transparent bg-transparent px-3 text-[10px] font-sans font-bold uppercase tracking-tight text-[#25313A] outline-none ring-0 transition-colors hover:border-transparent hover:bg-[#F3F6F8] hover:text-[#182026] focus:border-transparent focus:bg-transparent focus:text-[#25313A] focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 data-[state=open]:!border-transparent data-[state=open]:!bg-[#F3F6F8] data-[state=open]:!text-[#182026]'
        : 'h-9 rounded-full border border-transparent bg-transparent px-3 text-[11px] font-semibold uppercase tracking-tight text-white/90 outline-none ring-0 transition-colors hover:border-transparent hover:bg-white/10 hover:text-white focus:border-transparent focus:bg-transparent focus:text-white/90 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 data-[state=open]:!border-transparent data-[state=open]:!bg-white/10 data-[state=open]:!text-white';
    const panelClassName = 'lg:fixed lg:left-1/2 lg:-translate-x-1/2 lg:top-[85px] flex flex-col lg:flex-row w-[calc(100vw-2rem)] lg:w-[95vw] lg:max-w-[1240px] bg-[#FAFAF7] rounded-[22px] overflow-hidden shadow-[0_28px_90px_rgba(37,49,58,0.16)] ring-1 ring-[#D8E3E8]';
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

                            {/* Column 1: Recovery Infrastructure */}
                            <div className="flex-1 border-r border-[#E4EDF1] p-6 lg:p-7">
                                <div className="mb-5 flex items-center justify-between">
                                    <h4 className={labelClassName}>
                                        Recovery Infrastructure
                                    </h4>
                                    <span className={cn(
                                        'rounded px-2 py-0.5 text-[7px] font-bold uppercase tracking-tighter',
                                        'border border-[#D8E3E8] bg-white text-[#66737F]'
                                    )}>
                                        Core Systems
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 gap-2.5">
                                    <NavItem
                                        variant="light"
                                        icon={Activity}
                                        title="Discrepancy Engine"
                                        description="Continuous monitoring of inbound, inventory, and fee states."
                                    />
                                    <NavItem
                                        variant="light"
                                        icon={Layers}
                                        title="Evidence Vault"
                                        description="Automated collection of BOLs, invoices, and shipment logs."
                                    />
                                    <NavItem
                                        variant="light"
                                        icon={FileText}
                                        title="Surgical Case Builder"
                                        description="Policy-aligned claim construction for maximum approval rates."
                                    />
                                    <NavItem
                                        variant="light"
                                        icon={ShieldCheck}
                                        title="Dispute Automation"
                                        description="Autonomous handling of lowball offers and rejections."
                                        highlight
                                    />
                                </div>
                            </div>

                            {/* Column 2: Operational Control */}
                            <div className="flex-1 border-r border-[#E4EDF1] bg-white/45 p-6 lg:p-7">
                                <h4 className={cn(labelClassName, 'mb-5')}>
                                    Operational Control
                                </h4>
                                <div className="grid grid-cols-1 gap-2.5">
                                    <NavItem
                                        variant="light"
                                        icon={BarChart3}
                                        title="Recovery Intelligence"
                                        description="Real-time visibility into claim status, payouts, and ROI."
                                    />
                                    <NavItem
                                        variant="light"
                                        icon={Briefcase}
                                        title="Audit Transparency"
                                        description="Full logs of every agent action and Amazon interaction."
                                    />
                                    <NavItem
                                        variant="light"
                                        icon={Globe2}
                                        title="Global Sync"
                                        description="Unified recovery operations across all international marketplaces."
                                    />
                                    <NavItem
                                        variant="light"
                                        icon={Network}
                                        title="API & Integrations"
                                        description="Connect recovery data to your existing ERP or warehouse stack."
                                    />
                                </div>
                            </div>

                            {/* Column 3: Solutions */}
                            <div className="flex-1 bg-white/70 p-6 lg:p-7">
                                <h4 className={cn(labelClassName, 'mb-5')}>
                                    Solutions
                                </h4>
                                <div className="grid grid-cols-1 gap-2.5">
                                    <NavItem
                                        variant="light"
                                        icon={BadgePercent}
                                        title="Founding 500"
                                        description="Exclusive infrastructure access for early believers."
                                    />
                                    <NavItem
                                        variant="light"
                                        icon={TrendingUp}
                                        title="Enterprise Ops"
                                        description="Multi-workspace recovery for aggregators and 8-figure brands."
                                    />
                                    <NavItem
                                        variant="light"
                                        icon={Briefcase}
                                        title="Managed Recovery"
                                        description="White-glove oversight for complex, high-volume accounts."
                                        highlight
                                    />
                                </div>

                                <div className={cn(
                                    'relative mt-6 overflow-hidden rounded-xl border p-5',
                                    'border-[#D8E3E8] bg-white'
                                )}>
                                    <h5 className="mb-1 text-[9px] font-bold text-[#182026]">Platform Coverage</h5>
                                    <p className="mb-3 text-[8px] leading-relaxed text-[#66737F]">
                                        One recovery system for detection, evidence, filing, disputes, and payout confirmation.
                                    </p>
                                    <div className="flex cursor-default items-center gap-1.5 text-[8px] font-bold uppercase tracking-tight text-[#182026]">
                                        View Infrastructure <ArrowRight className="h-2.5 w-2.5" />
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
                'group block cursor-default rounded-xl border p-3.5 transition-all duration-200 ease-out hover:-translate-y-0.5',
                isLight
                    ? highlight
                        ? 'border-white/70 bg-white/70 shadow-[0_14px_36px_rgba(37,49,58,0.08)]'
                        : 'border-transparent bg-transparent hover:border-white/70 hover:bg-white/60 hover:shadow-[0_14px_36px_rgba(37,49,58,0.08)]'
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
                        'block text-[10px] font-bold tracking-tight',
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
                    <p className={cn('mt-1 text-[8px] leading-[1.35]', isLight ? 'text-[#66737F]' : 'text-white/20')}>
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
}
