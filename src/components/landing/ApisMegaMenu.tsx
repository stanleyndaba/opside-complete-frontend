import React from 'react';
import { Link } from 'react-router-dom';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuList,
    NavigationMenuTrigger
} from '@/components/ui/navigation-menu';
import {
    Activity,
    ArrowRight,
    BookOpen,
    Box,
    BriefcaseBusiness,
    CalendarClock,
    ClipboardCheck,
    CreditCard,
    Database,
    FileText,
    Network,
    Undo2,
    type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const apiMenuGroups = [
    {
        label: 'Find & Verify',
        items: [
            { title: 'Amazon Discrepancy & Recovery Detection', description: 'Find shipment, inventory, fee, reimbursement and settlement differences that may warrant review.', icon: Box, to: '/amazon-discrepancy-recovery-detection' },
            { title: 'Transaction Reconciliation', description: 'Compare expected, approved and paid values to surface underpayments and valuation differences for review.', icon: CreditCard, to: '/transaction-reconciliation' },
            { title: 'Recovery Eligibility Timing', description: 'Prioritize potential recoveries by value, evidence readiness and remaining recovery eligibility window.', icon: CalendarClock, to: '/recovery-eligibility-timing' }
        ]
    },
    {
        label: 'Build & Control',
        items: [
            { title: 'Recovery Evidence', description: 'Connect invoices, BOLs, PODs, shipment records, quantities and cost basis to the recovery they support.', icon: FileText, to: '/recovery-evidence' },
            { title: 'Evidence-Backed Recovery Case Preparation', description: 'Assemble the evidence, timeline, policy basis and financial value into one review-ready recovery.', icon: ClipboardCheck, to: '/evidence-backed-recovery-case-preparation' },
            { title: 'Seller Approval & Filing', description: 'Review every recovery before it enters the filing workflow. Nothing moves without approval.', icon: BriefcaseBusiness, to: '/seller-approval-filing' }
        ]
    },
    {
        label: 'Close the Loop',
        items: [
            { title: 'Response & Appeal Management', description: 'Keep Amazon requests, rejections, replies and supporting evidence on one recovery timeline.', icon: BookOpen, to: '/response-appeals-management' },
            { title: 'Payout Verification', description: "Compare Amazon's approved value with the reimbursement that actually reached settlement.", icon: Database, to: '/payout-verification' },
            { title: 'Reversal & Accounting Reconciliation', description: 'Track later reversals, unresolved differences and accounting-ready recovery records.', icon: Undo2, to: '/reversal-accounting-reconciliation' },
            { title: 'Integrations and Connectors', description: 'Connect the records your business already relies on to establish the financial picture they cannot show separately.', icon: Network, to: '/integration-connectors' }
        ]
    }
];

type ApisMegaMenuProps = {
    variant?: 'dark' | 'light';
};

export function ApisMegaMenu({ variant = 'dark' }: ApisMegaMenuProps) {
    const triggerClassName = variant === 'light'
        ? 'h-10 rounded-[9px] border border-transparent bg-transparent px-3.5 text-[13px] font-sans font-medium tracking-[-0.01em] text-[#52616C] outline-none ring-0 transition-colors hover:border-transparent hover:bg-[#F7F4EE] hover:text-[var(--margin-text-primary)] focus:border-transparent focus:bg-transparent focus:text-[var(--margin-text-primary)] focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 data-[state=open]:!border-[#E7E3DC] data-[state=open]:!bg-[#F7F4EE] data-[state=open]:!text-[var(--margin-text-primary)] data-[state=open]:!shadow-[0_3px_10px_rgba(24,32,38,0.06)]'
        : 'h-10 rounded-[9px] !border-0 bg-transparent px-3.5 text-[13px] font-medium tracking-[-0.01em] text-white/85 shadow-none outline-none ring-0 transition-colors hover:!border-0 hover:bg-white/10 hover:text-white focus:!border-0 focus:bg-transparent focus:text-white focus-visible:!border-0 focus-visible:outline-none focus-visible:ring-0 data-[state=open]:!border-0 data-[state=open]:!bg-white/10 data-[state=open]:!text-white data-[state=open]:!shadow-[0_4px_16px_rgba(0,0,0,0.12)]';

    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className={cn(triggerClassName, "tracking-tight")}>
                        Workflows
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="relative z-[100] w-[calc(100vw-2rem)] max-h-[calc(100vh-160px)] overflow-y-auto rounded-[16px] border border-[#E7E3DC] bg-[#FFFEFB] shadow-[0_24px_70px_rgba(24,32,38,0.14),0_2px_8px_rgba(24,32,38,0.05)] scrollbar-hide lg:fixed lg:left-1/2 lg:top-[80px] lg:w-[94vw] lg:max-w-[1080px] lg:-translate-x-1/2">
                            <div className="grid grid-cols-1 lg:grid-cols-3">
                                {apiMenuGroups.map((group, index) => (
                                    <div
                                        key={group.label}
                                        className={cn(
                                            'p-5 lg:p-7',
                                            ''
                                        )}
                                    >
                                        <h5 className="mb-2.5 text-[11px] font-lora font-medium tracking-tight text-[#8B857F]">
                                            {group.label}
                                        </h5>
                                        <div className="grid grid-cols-1 gap-0">
                                            {group.items.map((item) => (
                                                <ApiServiceItem
                                                    key={item.title}
                                                    title={item.title}
                                                    description={item.description}
                                                    icon={item.icon}
                                                    to={item.to}
                                                    variant="light"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-[#E7E3DC] bg-[#F7F4EE] px-6 py-4 lg:flex lg:items-center lg:justify-between lg:px-8">
                                <div>
                                    <p className="text-[14px] font-semibold tracking-tight text-[#182026]">From first signal to reconciled payout.</p>
                                    <p className="mt-0.5 text-[11px] font-normal tracking-tight text-[#66737F]">See how Margin controls the complete recovery lifecycle.</p>
                                </div>
                                <Link to="/workflows" className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold tracking-tight text-[#F05A3C] transition-colors hover:text-[#D9472D] lg:mt-0">
                                    Explore the workflow
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
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
    to,
    onClick,
    variant = 'light'
}: {
    icon: LucideIcon;
    title: string;
    description: string;
    to?: string;
    onClick?: () => void;
    variant?: 'dark' | 'light';
}) {
    const item = (
        <div
            className={cn(
                'landing-menu-item group flex cursor-default items-start gap-3 rounded-[9px] border border-transparent px-3 py-3 transition-[background-color,border-color,transform] duration-150 hover:-translate-y-0.5',
            'hover:border-[#E7E0D6] hover:bg-[#F7F4EE] hover:shadow-[0_8px_20px_rgba(24,32,38,0.05)]'
            )}
        >
            <div className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-[#F6F0EC] p-1 transition-colors',
                'text-[#7B8790] group-hover:text-[#F05A3C]'
            )}>
                <Icon className="h-full w-full" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
                <span className={cn(
                    'block text-[12px] font-sans font-semibold leading-snug tracking-tight transition-colors',
                    'text-[#182026] group-hover:text-[#D9472D]'
                )}>
                    {title}
                </span>
                <p className={cn(
                    'mt-1 text-[10px] font-sans font-normal leading-[1.5] tracking-tight',
                    'text-[#66737F]'
                )}>
                    {description}
                </p>
            </div>
        </div>
    );

    return to ? <Link to={to} onClick={onClick} className="block">{item}</Link> : item;
}
