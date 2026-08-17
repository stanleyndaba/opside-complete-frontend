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
        ? 'h-9 rounded-[6px] border border-transparent bg-transparent px-3 text-[10px] font-sans font-bold uppercase tracking-tight text-[var(--margin-text-secondary)] outline-none ring-0 transition-colors hover:border-transparent hover:bg-[var(--margin-surface-alt)] hover:text-[var(--margin-text-primary)] focus:border-transparent focus:bg-transparent focus:text-[var(--margin-text-secondary)] focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 data-[state=open]:!border-transparent data-[state=open]:!bg-[var(--margin-surface-alt)] data-[state=open]:!text-[var(--margin-text-primary)]'
        : 'h-9 rounded-full !border-0 bg-transparent px-3 text-[11px] font-semibold uppercase tracking-tight text-white/90 shadow-none outline-none ring-0 transition-colors hover:!border-0 hover:bg-white/10 hover:text-white focus:!border-0 focus:bg-transparent focus:text-white/90 focus-visible:!border-0 focus-visible:outline-none focus-visible:ring-0 data-[state=open]:!border-0 data-[state=open]:!bg-white/10 data-[state=open]:!text-white';

    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className={cn(triggerClassName, "tracking-tight")}>
                        Workflows
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="relative z-[100] w-[calc(100vw-2rem)] max-h-[calc(100vh-140px)] overflow-y-auto rounded-[6px] bg-white shadow-[0_32px_80px_rgba(0,0,0,0.18)] ring-1 ring-[#D8E3E8] scrollbar-hide lg:fixed lg:left-1/2 lg:top-[76px] lg:w-[96vw] lg:max-w-[1080px] lg:-translate-x-1/2">
                            <div className="grid grid-cols-1 lg:grid-cols-3">
                                {apiMenuGroups.map((group, index) => (
                                    <div
                                        key={group.label}
                                        className={cn(
                                            'p-4 lg:p-5',
                                            index < apiMenuGroups.length - 1 && 'border-b border-[#D8E3E8]/60 lg:border-b-0 lg:border-r'
                                        )}
                                    >
                                        <h5 className="mb-2 text-[11px] font-lora font-medium text-[#94A3B8]">
                                            {group.label}
                                        </h5>
                                        <div className="grid grid-cols-1 gap-0">
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
                            <div className="border-t border-[#D8E3E8] bg-[#F8FAFB] px-6 py-3 lg:flex lg:items-center lg:justify-between lg:px-8">
                                <div>
                                    <p className="text-[14px] font-semibold tracking-tight text-[#182026]">From first signal to reconciled payout.</p>
                                    <p className="mt-0.5 text-[11px] font-normal tracking-tight text-[#66737F]">See how Margin controls the complete recovery lifecycle.</p>
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
                'landing-menu-item group flex cursor-default items-start gap-4 rounded-[4px] border border-transparent p-2 transition-all duration-200',
                isLight
                    ? 'hover:bg-[#F8FAFB] hover:border-[#D8E3E8]'
                    : 'hover:bg-white/[0.03] hover:border-white/10'
            )}
        >
            <div className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center mt-0.5 transition-colors',
                isLight ? 'text-[#6B7280] group-hover:text-[#0B74DE]' : 'text-white/40 group-hover:text-white'
            )}>
                <Icon className="h-full w-full" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
                <span className={cn(
                    'block text-[13px] font-lora font-medium tracking-tight transition-colors',
                    isLight ? 'text-[#182026] group-hover:text-[#0B74DE]' : 'text-white group-hover:text-blue-400'
                )}>
                    {title}
                </span>
                <p className={cn(
                    'mt-0.5 text-[11px] font-normal leading-snug tracking-tight',
                    isLight ? 'text-[#66737F]' : 'text-white/50'
                )}>
                    {description}
                </p>
            </div>
        </div>
    );
}
