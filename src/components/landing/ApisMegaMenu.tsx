import React from 'react';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuList,
    NavigationMenuTrigger
} from '@/components/ui/navigation-menu';
import {
    Activity,
    BookOpen,
    BriefcaseBusiness,
    CreditCard,
    Database,
    FileText,
    Gavel,
    Timer,
    ShieldCheck,
    type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const apiMenuGroups = [
    {
        label: 'Find & Verify',
        items: [
            { title: 'Recovery Audit', description: 'Find shipment, inventory, fee, reimbursement and settlement exceptions worth investigating.', icon: ShieldCheck },
            { title: 'Value Verification', description: 'Compare expected, approved and paid values to identify underpayments and valuation gaps.', icon: CreditCard },
            { title: 'Deadline Monitoring', description: 'Prioritize recoveries by value, evidence readiness and remaining claim window.', icon: Timer }
        ]
    },
    {
        label: 'Build & Control',
        items: [
            { title: 'Evidence Matching', description: 'Connect invoices, BOLs, PODs, shipment records, quantities and cost basis to the recovery they support.', icon: FileText },
            { title: 'Case Preparation', description: 'Assemble the evidence, timeline, policy basis and financial value into one review-ready recovery.', icon: Gavel },
            { title: 'Seller Approval & Filing', description: 'Review every recovery before it enters the filing workflow. Nothing moves without approval.', icon: BriefcaseBusiness }
        ]
    },
    {
        label: 'Close the Loop',
        items: [
            { title: 'Response & Appeal Management', description: 'Keep Amazon requests, rejections, replies and supporting evidence on one recovery timeline.', icon: BookOpen },
            { title: 'Payout Verification', description: "Compare Amazon's approved value with the reimbursement that actually reached settlement.", icon: Database },
            { title: 'Reversal & Accounting Reconciliation', description: 'Track later reversals, unresolved differences and accounting-ready recovery records.', icon: Activity }
        ]
    }
];

type ApisMegaMenuProps = {
    variant?: 'dark' | 'light';
};

export function ApisMegaMenu({ variant = 'dark' }: ApisMegaMenuProps) {
    const triggerClassName = variant === 'light'
        ? 'h-9 rounded-[6px] border border-transparent bg-transparent px-3 text-[10px] font-sans font-bold uppercase tracking-tight text-[#25313A] outline-none ring-0 transition-colors hover:border-transparent hover:bg-[#F3F6F8] hover:text-[#182026] focus:border-transparent focus:bg-transparent focus:text-[#25313A] focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 data-[state=open]:!border-transparent data-[state=open]:!bg-[#F3F6F8] data-[state=open]:!text-[#182026]'
        : 'h-9 rounded-full !border-0 bg-transparent px-3 text-[11px] font-semibold uppercase tracking-tight text-white/90 shadow-none outline-none ring-0 transition-colors hover:!border-0 hover:bg-white/10 hover:text-white focus:!border-0 focus:bg-transparent focus:text-white/90 focus-visible:!border-0 focus-visible:outline-none focus-visible:ring-0 data-[state=open]:!border-0 data-[state=open]:!bg-white/10 data-[state=open]:!text-white';

    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className={triggerClassName}>
                        Workflows
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="relative z-[100] w-[calc(100vw-2rem)] overflow-hidden rounded-[14px] bg-[#F3F6F8] shadow-[0_22px_70px_rgba(37,49,58,0.14)] ring-1 ring-[#D8E3E8] lg:fixed lg:left-1/2 lg:top-[78px] lg:w-[92vw] lg:max-w-[1040px] lg:-translate-x-1/2">
                            <div className="grid grid-cols-1 lg:grid-cols-3">
                                {apiMenuGroups.map((group, index) => (
                                    <div
                                        key={group.label}
                                        className={cn(
                                            'p-5 lg:p-6',
                                            index === 1 && 'bg-white/45',
                                            index < apiMenuGroups.length - 1 && 'border-b border-[#E4EDF1] lg:border-b-0 lg:border-r'
                                        )}
                                    >
                                        <h5 className="mb-3 text-[10px] font-bold uppercase tracking-tight text-[#66737F]">
                                            {group.label}
                                        </h5>
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {group.items.map((item) => (
                                                <ApiServiceItem
                                                    key={item.title}
                                                    title={item.title}
                                                    description={item.description}
                                                    icon={item.icon}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-[#D8E3E8] bg-white/45 px-5 py-4 lg:flex lg:items-center lg:justify-between lg:px-6">
                                <div>
                                    <p className="text-[12px] font-bold tracking-tight text-[#182026]">From first signal to reconciled payout.</p>
                                    <p className="mt-1 text-[11px] leading-snug text-[#66737F]">See how Margin controls the complete recovery lifecycle.</p>
                                </div>
                                <span className="mt-3 inline-flex text-[10px] font-bold uppercase tracking-tight text-[#0B74DE] lg:mt-0">
                                    Explore the workflow
                                </span>
                            </div>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}

export function ApiServiceItem({
    icon: Icon,
    title,
    description,
    variant = 'light'
}: {
    icon: LucideIcon;
    title: string;
    description: string;
    variant?: 'dark' | 'light';
}) {
    const isLight = variant === 'light';

    return (
        <div
            className={cn(
                'landing-menu-item group flex cursor-default items-center gap-3 rounded-[6px] border p-3 transition-[background-color,border-color,box-shadow] duration-150 ease-out',
                isLight
                    ? 'border-transparent bg-transparent hover:border-[#DCE3E8] hover:bg-white hover:shadow-[0_16px_34px_rgba(24,32,38,0.08)]'
                    : 'border-transparent bg-transparent hover:bg-white/[0.045] hover:shadow-[0_16px_34px_rgba(255,255,255,0.05)]'
            )}
        >
            <div className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] transition-[background-color,border-color,box-shadow,color] duration-150',
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
