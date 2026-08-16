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
                        <div className="relative z-[100] w-[calc(100vw-2rem)] overflow-hidden rounded-[6px] bg-white shadow-[0_32px_80px_rgba(0,0,0,0.18)] ring-1 ring-[#D8E3E8] lg:fixed lg:left-1/2 lg:top-[76px] lg:w-[96vw] lg:max-w-[1080px] lg:-translate-x-1/2">
                            <div className="grid grid-cols-1 lg:grid-cols-3">
                                {apiMenuGroups.map((group, index) => (
                                    <div
                                        key={group.label}
                                        className={cn(
                                            'p-5 lg:p-6',
                                            index < apiMenuGroups.length - 1 && 'border-b border-[#D8E3E8]/60 lg:border-b-0 lg:border-r'
                                        )}
                                    >
                                        <h5 className="mb-4 text-[10px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">
                                            {group.label}
                                        </h5>
                                        <div className="grid grid-cols-1 gap-1">
                                            {group.items.map((item) => (
                                                <ApiServiceItem
                                                    key={item.title}
                                                    title={item.title}
                                                    description={item.description}
                                                    icon={item.icon}
                                                    variant="light"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-[#D8E3E8] bg-[#F8FAFB] px-6 py-5 lg:flex lg:items-center lg:justify-between lg:px-8">
                                <div>
                                    <p className="text-[15px] font-semibold tracking-tight text-[#182026]">From first signal to reconciled payout.</p>
                                    <p className="mt-1 text-[12px] font-normal tracking-tight text-[#66737F]">See how Margin controls the complete recovery lifecycle.</p>
                                </div>
                                <span className="mt-4 inline-flex cursor-pointer items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#0B74DE] transition-colors hover:text-[#0967C8] lg:mt-0">
                                    Explore the workflow
                                    <div className="h-px w-4 bg-[#0B74DE]" />
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
                'landing-menu-item group flex cursor-default items-start gap-4 rounded-[4px] border border-transparent p-3 transition-all duration-200',
                'hover:bg-[#F8FAFB] hover:border-[#D8E3E8]'
            )}
        >
            <div className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center mt-0.5 transition-colors',
                'text-[#6B7280] group-hover:text-[#0B74DE]'
            )}>
                <Icon className="h-full w-full" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
                <span className={cn(
                    'block text-[14px] font-semibold tracking-tight transition-colors',
                    'text-[#182026] group-hover:text-[#0B74DE]'
                )}>
                    {title}
                </span>
                <p className={cn(
                    'mt-1 text-[12px] font-normal leading-relaxed tracking-tight text-[#66737F]'
                )}>
                    {description}
                </p>
            </div>
        </div>
    );
}
