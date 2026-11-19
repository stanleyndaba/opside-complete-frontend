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
            { title: 'Established FBA Brands', description: 'Continuous recovery control for brands with recurring shipment volume, meaningful inventory exposure and growing operational complexity.', icon: Store, href: '/established-fba-brands' },
            { title: 'Agencies & Amazon Operators', description: 'Manage recoveries across client accounts while keeping evidence, ownership and seller approvals clear.', icon: Briefcase, href: '/agencies-amazon-operators' },
            { title: 'Aggregators & Multi-Brand Portfolios', description: 'Standardize recovery monitoring, case handling and financial reconciliation across multiple brands and entities.', icon: Building2, href: '/aggregators-multi-brand' },
            { title: 'Enterprise & Multi-Marketplace', description: 'Coordinate recovery control across marketplaces, entities, operating teams and higher-volume financial populations.', icon: Building2, href: '/enterprise-multi-marketplace' }
        ]
    },
    {
        label: 'By Team',
        items: [
            { title: 'Operations Teams', description: 'See evidence readiness, deadlines, ownership, Amazon responses and the next required action.', icon: Layers, href: '/marketplace-operations' },
            { title: 'Finance Teams', description: 'Compare expected, approved, paid, underpaid, reversed and unreconciled values from one recovery record.', icon: WalletCards, href: '/finance-teams' },
            { title: 'Founders & Leadership', description: 'Understand current recovery exposure, unresolved financial risk and the value reaching the business.', icon: Crown, href: '/founder-led' }
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
        ? 'h-10 rounded-[9px] border border-transparent bg-transparent px-3.5 text-[13px] font-sans font-medium tracking-[-0.01em] text-[#52616C] outline-none ring-0 transition-colors hover:border-transparent hover:bg-[#F7F4EE] hover:text-[var(--margin-text-primary)] focus:border-transparent focus:bg-transparent focus:text-[var(--margin-text-primary)] focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 data-[state=open]:!border-[#E7E3DC] data-[state=open]:!bg-[#F7F4EE] data-[state=open]:!text-[var(--margin-text-primary)] data-[state=open]:!shadow-[0_3px_10px_rgba(24,32,38,0.06)]'
        : 'h-10 rounded-[9px] !border-0 bg-transparent px-3.5 text-[13px] font-medium tracking-[-0.01em] text-white/85 shadow-none outline-none ring-0 transition-colors hover:!border-0 hover:bg-white/10 hover:text-white focus:!border-0 focus:bg-transparent focus:text-white focus-visible:!border-0 focus-visible:outline-none focus-visible:ring-0 data-[state=open]:!border-0 data-[state=open]:!bg-white/10 data-[state=open]:!text-white data-[state=open]:!shadow-[0_4px_16px_rgba(0,0,0,0.12)]';

    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className={cn(triggerClassName, "tracking-tight")}>
                        For Teams
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="relative z-[100] w-[calc(100vw-2rem)] max-h-[calc(100vh-160px)] overflow-y-auto rounded-[16px] border border-[#E7E3DC] bg-[#FFFEFB] shadow-[0_24px_70px_rgba(24,32,38,0.14),0_2px_8px_rgba(24,32,38,0.05)] scrollbar-hide lg:fixed lg:left-1/2 lg:top-[80px] lg:w-[94vw] lg:max-w-[1080px] lg:-translate-x-1/2">
                            <div className="grid grid-cols-1 lg:grid-cols-3">
                                {productMenuGroups.map((group, index) => (
                                    <div
                                        key={group.label}
                                        className={cn(
                                            'p-5 lg:p-7',
                                            ''
                                        )}
                                    >
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <h4 className="text-[11px] font-lora font-medium tracking-wide text-[#8B857F]">
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
                                                    href={item.href}
                                                    variant="light"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-[#E7E3DC] bg-[#F7F4EE] px-6 py-4 lg:flex lg:items-center lg:justify-between lg:px-8">
                                <div>
                                    <p className="text-[14px] font-semibold tracking-tight text-[#182026]">Built for serious FBA operations</p>
                                    <p className="mt-0.5 max-w-[680px] text-[11px] font-normal tracking-tight text-[#66737F]">
                                        Margin is designed for businesses where recovery crosses multiple shipments, systems and people, and where missed windows, weak evidence or incorrect payouts materially affect margin.
                                    </p>
                                </div>
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
    href,
    onClick,
    variant = 'light'
}: {
    icon: LucideIcon,
    title: string,
    description: string,
    href?: string,
    onClick?: () => void,
    variant?: 'dark' | 'light'
}) {
    const className = cn(
        'landing-menu-item group flex items-start gap-3 rounded-[9px] border border-transparent px-3 py-3 transition-[background-color,border-color,transform] duration-150 hover:-translate-y-0.5',
            variant === 'dark'
                ? 'hover:border-white/15 hover:bg-white/10 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)]'
                : 'hover:border-[#E7E0D6] hover:bg-[#F7F4EE] hover:shadow-[0_8px_20px_rgba(24,32,38,0.05)]'
    );
    const content = (
        <>
            <div className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] p-1 transition-colors',
                variant === 'dark' ? 'bg-white/10 text-white/70 group-hover:text-white' : 'bg-[#F6F0EC] text-[#7B8790] group-hover:text-[#F05A3C]'
            )}>
                <Icon className="h-full w-full" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
                <span className={cn(
                    'block text-[12px] font-sans font-semibold leading-snug tracking-tight transition-colors',
                    variant === 'dark' ? 'text-white/90 group-hover:text-white' : 'text-[#182026] group-hover:text-[#D9472D]'
                )}>
                    {title}
                </span>
                <p className={cn(
                    'mt-1 text-[10px] font-sans font-normal leading-[1.5] tracking-tight',
                    variant === 'dark' ? 'text-white/65' : 'text-[#66737F]'
                )}>
                    {description}
                </p>
            </div>
        </>
    );
    if (href) {
        return <Link to={href} onClick={onClick} className={className}>{content}</Link>;
    }
    return <div onClick={onClick} className={cn(className, 'cursor-default')}>{content}</div>;
}
