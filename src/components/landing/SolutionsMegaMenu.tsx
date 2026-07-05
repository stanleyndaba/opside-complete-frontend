import React from 'react';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuList,
    NavigationMenuTrigger
} from '@/components/ui/navigation-menu';
import {
    PackageCheck,
    ShoppingBag,
    Store,
    type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const solutionMenuGroups = [
    {
        label: 'E-commerce Marketplaces',
        items: [
            { title: 'Amazon FBA/FBM', description: 'Recovery workflows for fulfillment and merchant-fulfilled sellers.', icon: PackageCheck },
            { title: 'Walmart WFS Recovery (coming Q3)', description: 'Marketplace recovery coverage planned for WFS operators.', icon: Store },
            { title: 'TikTok Shop (Beta prep)', description: 'Recovery infrastructure preparing for social commerce operators.', icon: ShoppingBag }
        ]
    }
];

type SolutionsMegaMenuProps = {
    variant?: 'dark' | 'light';
};

export function SolutionsMegaMenu({ variant = 'dark' }: SolutionsMegaMenuProps) {
    const triggerClassName = variant === 'light'
        ? 'h-9 rounded-[6px] border border-transparent bg-transparent px-3 text-[10px] font-sans font-bold uppercase tracking-tight text-[#25313A] outline-none ring-0 transition-colors hover:border-transparent hover:bg-[#F3F6F8] hover:text-[#182026] focus:border-transparent focus:bg-transparent focus:text-[#25313A] focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 data-[state=open]:!border-transparent data-[state=open]:!bg-[#F3F6F8] data-[state=open]:!text-[#182026]'
        : 'h-9 rounded-full !border-0 bg-transparent px-3 text-[11px] font-semibold uppercase tracking-tight text-white/90 shadow-none outline-none ring-0 transition-colors hover:!border-0 hover:bg-white/10 hover:text-white focus:!border-0 focus:bg-transparent focus:text-white/90 focus-visible:!border-0 focus-visible:outline-none focus-visible:ring-0 data-[state=open]:!border-0 data-[state=open]:!bg-white/10 data-[state=open]:!text-white';

    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className={triggerClassName}>
                        Solutions
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="relative z-[100] w-[calc(100vw-2rem)] overflow-hidden rounded-[22px] bg-[#FAFAF7] shadow-[0_28px_90px_rgba(37,49,58,0.16)] ring-1 ring-[#D8E3E8] lg:fixed lg:left-1/2 lg:top-[85px] lg:w-[95vw] lg:max-w-[820px] lg:-translate-x-1/2">
                            <div className="p-6 lg:p-7">
                                <h4 className="mb-5 text-[10px] font-bold uppercase tracking-tight text-[#66737F]">
                                    E-commerce Marketplaces
                                </h4>
                                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
                                    {solutionMenuGroups[0].items.map((item) => (
                                        <SolutionServiceItem
                                            key={item.title}
                                            icon={item.icon}
                                            title={item.title}
                                            description={item.description}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}

export function SolutionServiceItem({
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
                'group flex min-w-0 cursor-default items-start gap-3.5 rounded-[8px] border p-4 transition-all duration-200 ease-out hover:-translate-y-0.5',
                isLight
                    ? 'border-transparent bg-transparent hover:border-[#DCE3E8] hover:bg-white hover:shadow-[0_16px_34px_rgba(24,32,38,0.08)]'
                    : 'border-transparent bg-transparent hover:bg-white/[0.045] hover:shadow-[0_16px_34px_rgba(255,255,255,0.05)]'
            )}
        >
            <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] transition-all duration-200',
                isLight
                    ? 'border border-[#CDD7DE] bg-[#F9F9FB] text-[#25313A] group-hover:border-[#9EACB6] group-hover:bg-white group-hover:shadow-[0_0_0_3px_rgba(24,32,38,0.04)]'
                    : 'bg-white/[0.055] text-white group-hover:bg-white/[0.075] group-hover:shadow-[0_0_0_3px_rgba(255,255,255,0.055)]'
            )}>
                <Icon className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
                <span className={cn('block text-[13px] font-bold leading-snug tracking-tight', isLight ? 'text-[#182026]' : 'text-white')}>
                    {title}
                </span>
                <p className={cn('mt-1.5 text-[11px] leading-[1.45]', isLight ? 'text-[#66737F]' : 'text-white/55')}>
                    {description}
                </p>
            </div>
        </div>
    );
}
