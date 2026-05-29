import React from 'react';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuList,
    NavigationMenuTrigger
} from '@/components/ui/navigation-menu';
import {
    BarChart3,
    BellRing,
    Bot,
    BriefcaseBusiness,
    Building2,
    CloudUpload,
    CreditCard,
    FileSearch,
    Link2,
    Scale,
    ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const apiMenuItems = [
    { title: 'Amazon FBA Integration API', icon: Link2 },
    { title: 'Autonomous Audit API', icon: FileSearch },
    { title: 'Evidence Intelligence API', icon: ShieldCheck },
    { title: 'Refund Filing API', icon: Scale },
    { title: 'Recovery Reconciliation API', icon: BarChart3 },
    { title: 'Billing & Revenue API', icon: CreditCard },
    { title: 'Real-Time Operations API', icon: BellRing },
    { title: 'Multi-Tenant Workspace API', icon: Building2 },
    { title: 'CSV Data Upload API', icon: CloudUpload },
    { title: 'AI Proof API', icon: Bot }
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
                        <div className="relative z-[100] w-[calc(100vw-2rem)] overflow-hidden rounded-[22px] bg-[#FAFAF7] p-5 shadow-[0_28px_90px_rgba(37,49,58,0.16)] ring-1 ring-[#D8E3E8] lg:fixed lg:left-1/2 lg:top-[85px] lg:w-[92vw] lg:max-w-[1040px] lg:-translate-x-1/2 lg:p-7">
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-tight text-[#66737F]">
                                        Enterprise API Surface
                                    </h4>
                                </div>
                                <span className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[8px] font-bold uppercase tracking-tighter text-[#0B74DE] ring-1 ring-[#BFD8EA] bg-[#EAF4FF]">
                                    <BriefcaseBusiness className="h-3 w-3" />
                                    10 Services
                                </span>
                            </div>
                            <div className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                {apiMenuItems.map((item, index) => (
                                    <ApiTile
                                        key={item.title}
                                        title={item.title}
                                        icon={item.icon}
                                        index={index + 1}
                                        highlight={index === 2 || index === 5}
                                    />
                                ))}
                            </div>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}

export function ApiTile({
    icon: Icon,
    title,
    index,
    highlight = false,
    variant = 'light'
}: {
    icon: any;
    title: string;
    index: number;
    highlight?: boolean;
    variant?: 'dark' | 'light';
}) {
    const isLight = variant === 'light';

    return (
        <div
            className={cn(
                'group flex min-h-[116px] cursor-default flex-col justify-between rounded-xl border p-4 transition-all duration-200 ease-out hover:-translate-y-0.5',
                isLight
                    ? highlight
                        ? 'border-[#BFD8EA] bg-[#EAF4FF] shadow-[0_14px_36px_rgba(11,116,222,0.10)]'
                        : 'border-[#E4EDF1] bg-white/70 hover:border-[#BFD8EA] hover:bg-white hover:shadow-[0_14px_36px_rgba(37,49,58,0.08)]'
                    : highlight
                        ? 'border-emerald-500/10 bg-emerald-500/[0.03]'
                        : 'border-white/10 bg-white/[0.03]'
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <div className={cn(
                    'rounded-lg border p-2.5',
                    isLight
                        ? highlight
                            ? 'border-[#BFD8EA] bg-white text-[#0B74DE]'
                            : 'border-[#DCE8EE] bg-[#EEF4F6] text-[#0B74DE]'
                        : highlight
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
                            : 'border-white/10 bg-white/5 text-white/40'
                )}>
                    <Icon className="h-4 w-4" />
                </div>
                <span className={cn('text-[9px] font-bold tabular-nums', isLight ? 'text-[#8A99A4]' : 'text-white/25')}>
                    {String(index).padStart(2, '0')}
                </span>
            </div>
            <span className={cn(
                'mt-5 block text-[12px] font-bold leading-snug tracking-tight',
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
        </div>
    );
}
