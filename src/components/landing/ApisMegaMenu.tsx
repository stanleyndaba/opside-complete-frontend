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
    Plug,
    ShieldCheck,
    Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const apiMenuGroups = [
    {
        label: 'Core Infrastructure',
        items: [
            { title: 'Amazon FBA Integration', description: 'Connection and authorization layer.', icon: Plug },
            { title: 'Data Pipeline', description: 'Live sync and normalized seller data.', icon: Database },
            { title: 'Multi-tenant Admin', description: 'Workspace, store, and role control.', icon: Users }
        ]
    },
    {
        label: 'Recovery Engine',
        items: [
            { title: 'Autonomous Detection', description: 'Always-on audit logic for recovery signals.', icon: ShieldCheck },
            { title: 'Intelligence & Ingestion', description: 'Evidence capture, parsing, and matching.', icon: FileText },
            { title: 'Refund Filing', description: 'Dispute preparation and submission workflow.', icon: Gavel }
        ]
    },
    {
        label: 'Operations & Billing',
        items: [
            { title: 'Recovery Reconciliation', description: 'Payout matching and recovery ledgering.', icon: BookOpen },
            { title: 'Revenue & Fees', description: 'Billing events, invoices, and fee capture.', icon: CreditCard },
            { title: 'Real-time Ops', description: 'Event streams, alerts, and runtime visibility.', icon: Activity }
        ]
    }
];

type ApisMegaMenuProps = {
    variant?: 'dark' | 'light';
};

export function ApisMegaMenu({ variant = 'dark' }: ApisMegaMenuProps) {
    const triggerClassName = variant === 'light'
        ? 'h-9 rounded-[6px] border border-transparent bg-transparent px-3 text-[10px] font-sans font-bold uppercase tracking-tight text-[#25313A] outline-none ring-0 transition-colors hover:border-transparent hover:bg-[#F3F6F8] hover:text-[#182026] focus:border-transparent focus:bg-transparent focus:text-[#25313A] focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 data-[state=open]:!border-transparent data-[state=open]:!bg-[#F3F6F8] data-[state=open]:!text-[#182026]'
        : 'h-9 rounded-full border border-transparent bg-transparent px-3 text-[11px] font-semibold uppercase tracking-tight text-white/90 outline-none ring-0 transition-colors hover:border-transparent hover:bg-white/10 hover:text-white focus:border-transparent focus:bg-transparent focus:text-white/90 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 data-[state=open]:!border-transparent data-[state=open]:!bg-white/10 data-[state=open]:!text-white';

    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className={triggerClassName}>
                        API
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="relative z-[100] w-[calc(100vw-2rem)] overflow-hidden rounded-[22px] bg-[#FAFAF7] shadow-[0_28px_90px_rgba(37,49,58,0.16)] ring-1 ring-[#D8E3E8] lg:fixed lg:left-1/2 lg:top-[85px] lg:w-[95vw] lg:max-w-[1120px] lg:-translate-x-1/2">
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                <h4 className="px-6 pt-6 text-[10px] font-bold uppercase tracking-tight text-[#66737F] lg:px-7 lg:pt-7">
                                    Scale and Enterprise API
                                </h4>
                                <span className="mr-6 mt-6 inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[8px] font-bold uppercase tracking-tighter text-[#0B74DE] ring-1 ring-[#BFD8EA] bg-[#EAF4FF] lg:mr-7 lg:mt-7">
                                    <BriefcaseBusiness className="h-3 w-3" />
                                    10 Services
                                </span>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3">
                                {apiMenuGroups.map((group, index) => (
                                    <div
                                        key={group.label}
                                        className={cn(
                                            'p-6 lg:p-7',
                                            index === 1 && 'bg-white/45',
                                            index < apiMenuGroups.length - 1 && 'border-b border-[#E4EDF1] lg:border-b-0 lg:border-r'
                                        )}
                                    >
                                        <h5 className="mb-5 text-[10px] font-bold uppercase tracking-tight text-[#66737F]">
                                            {group.label}
                                        </h5>
                                        <div className="grid grid-cols-1 gap-2.5">
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
    icon: any;
    title: string;
    description: string;
    variant?: 'dark' | 'light';
}) {
    const isLight = variant === 'light';

    return (
        <div
            className={cn(
                'group flex cursor-default items-center gap-3.5 rounded-xl border p-4 transition-all duration-200 ease-out hover:-translate-y-0.5',
                isLight
                    ? 'border-transparent bg-transparent hover:border-[#DCE8EE] hover:bg-[#F8FAFC] hover:shadow-[0_14px_36px_rgba(11,102,255,0.09)]'
                    : 'border-transparent bg-transparent hover:bg-white/[0.04]'
            )}
        >
            <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-[#0066FF]',
                isLight
                    ? 'border-[#DCE8EE] bg-[#0066FF]/10 group-hover:border-[#BFD8EA] group-hover:bg-white'
                    : 'border-white/10 bg-[#0066FF]/10'
            )}>
                <Icon className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
                <span className={cn('block text-[13px] font-bold tracking-tight', isLight ? 'text-[#182026]' : 'text-white/90')}>
                    {title}
                </span>
                <p className={cn('mt-1.5 text-[11px] leading-[1.45]', isLight ? 'text-[#66737F]' : 'text-white/25')}>
                    {description}
                </p>
            </div>
        </div>
    );
}
