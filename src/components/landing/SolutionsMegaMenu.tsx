import React from 'react';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger
} from '@/components/ui/navigation-menu';
import {
    Search,
    ShieldCheck,
    BoxSelect,
    ArrowLeft,
    Truck,
    Sparkles,
    Briefcase,
    TrendingUp,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export function SolutionsMegaMenu() {
    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent hover:bg-white/5 text-white/60 hover:text-white data-[state=open]:!bg-white/5 data-[state=open]:!text-white h-auto py-2 px-3 text-[10px] font-mono font-bold uppercase tracking-widest outline-none">
                        Solutions
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="flex flex-col lg:flex-row w-[calc(100vw-2rem)] md:w-[600px] lg:w-[720px] bg-[#050505]/95 [backdrop-filter:blur(32px)_saturate(180%)] rounded-xl overflow-hidden shadow-2xl shadow-black/80 max-h-[85vh] overflow-y-auto scrollbar-hide border border-white/10">
                            {/* Left Side: Recovery Vectors */}
                            <div className="flex-[1.2] p-6 lg:p-8 border-r border-white/5">
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-2 mb-4">
                                        By Recovery Vector
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <NavItem
                                            icon={Search}
                                            title="Inbound Variance"
                                            description="Reconcile shipping plan vs. ledger receipts"
                                            href="/products/inbound-variance-monitor"
                                        />
                                        <NavItem
                                            icon={ShieldCheck}
                                            title="Inventory Reconciliation"
                                            description="Lost, damaged, and destroyed unit recovery"
                                            href="/products/fba-reimbursements"
                                        />
                                        <NavItem
                                            icon={BoxSelect}
                                            title="Dimensional Weight Audit"
                                            description="Correct Cubiscan errors & fee overcharges"
                                            href="/products/fee-forensics"
                                        />
                                        <NavItem
                                            icon={ArrowLeft}
                                            title="Return Logistics"
                                            description="Unreturned inventory & customer concession"
                                            href="/products/return-audits"
                                        />
                                        <NavItem
                                            icon={Truck}
                                            title="Transfer & Operations"
                                            description="Inter-fulfillment center loss tracking"
                                            href="/products/transfer-audits"
                                        />
                                        <NavItem
                                            icon={Sparkles}
                                            title="Full Forensic Audit"
                                            description="Deploy all 26 agents for total recovery"
                                            href="/ultra-beta"
                                            highlight
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Profiles */}
                            <div className="flex-1 p-6 lg:p-8 bg-white/[0.02]">
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-2 mb-4">
                                        By Profile
                                    </h4>
                                    <div className="flex flex-col gap-2">
                                        <NavItem
                                            icon={Briefcase}
                                            title="Private Label ($1M - $10M)"
                                            description="Automated recovery for growth brands"
                                            href="/contact"
                                        />
                                        <NavItem
                                            icon={TrendingUp}
                                            title="Institutional ($10M+)"
                                            description="Aggregators, Thrasio-style, & PE Firms"
                                            href="/contact"
                                        />
                                        <NavItem
                                            icon={Zap}
                                            title="Enterprise"
                                            description="Vendor Central (1P) & Custom API Access"
                                            href="/sales"
                                        />
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
    href,
    highlight = false
}: {
    icon: any,
    title: string,
    description: string,
    href: string,
    highlight?: boolean
}) {
    return (
        <Link
            to={href}
            className={cn(
                "group block p-3 rounded-lg transition-all duration-300",
                highlight ? "bg-emerald-500/[0.03] border border-emerald-500/10 hover:bg-emerald-500/10 hover:border-emerald-500/20" : "hover:bg-white/5"
            )}
        >
            <div className="flex items-start gap-3">
                <div className={cn(
                    "p-2 rounded-lg border transition-all",
                    highlight
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        : "bg-white/5 text-white/40 border-white/10 group-hover:border-white/20 group-hover:bg-white/10 group-hover:text-white"
                )}>
                    <Icon className="h-4 w-4" />
                </div>
                <div>
                    <span className={cn(
                        "text-[11px] font-bold tracking-tight block",
                        highlight ? "text-emerald-400 group-hover:text-emerald-300" : "text-white/90 group-hover:text-white"
                    )}>
                        {title}
                    </span>
                    <p className="text-[9px] text-white/30 mt-0.5 leading-tight group-hover:text-white/50 transition-colors">
                        {description}
                    </p>
                </div>
            </div>
        </Link>
    );
}
