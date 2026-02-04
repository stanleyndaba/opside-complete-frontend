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
    CircleDollarSign,
    ShieldAlert,
    FileText,
    Search,
    Briefcase,
    TrendingUp,
    ArrowRight,
    BoxSelect,
    BadgePercent
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProductsMegaMenu() {
    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent hover:bg-white/5 text-white/60 hover:text-white data-[state=open]:!bg-white/5 data-[state=open]:!text-white h-auto py-2 px-3 text-sm font-medium">
                        Products
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="flex flex-col lg:flex-row w-[calc(100vw-2rem)] md:w-[500px] lg:w-[580px] bg-[#050505]/95 [backdrop-filter:blur(32px)_saturate(180%)] rounded-xl overflow-hidden shadow-2xl shadow-black/80 max-h-[85vh] overflow-y-auto scrollbar-hide">
                            {/* Left Side: Features */}
                            <div className="flex-1 p-6 lg:p-8 grid gap-8">

                                {/* Section 1: Trust & Scale */}
                                <div className="space-y-5">
                                    <h4 className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.15em] px-2">
                                        Trust & Scale
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="group block p-4 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-default">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2.5 bg-white/5 rounded-lg text-white/50 border border-white/10 group-hover:border-white/20 group-hover:bg-white/10 group-hover:shadow-sm transition-all">
                                                    <Search className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span className="text-[13px] font-semibold text-white/90 tracking-tight">Inbound Fee Governance</span>
                                                    <p className="text-[11px] text-white/30 mt-1 leading-snug">
                                                        Transparent, line-by-line proof for every claim filed.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="group block p-4 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-default">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2.5 bg-white/5 rounded-lg text-white/50 border border-white/10 group-hover:border-white/20 group-hover:bg-white/10 group-hover:shadow-sm transition-all">
                                                    <Briefcase className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span className="text-[13px] font-semibold text-white/90 tracking-tight">Agency Portfolio Manager</span>
                                                    <p className="text-[11px] text-white/30 mt-1 leading-snug">
                                                        Multi-account reconciliation for high-volume agencies.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="group block p-4 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-default">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2.5 bg-white/5 rounded-lg text-white/50 border border-white/10 group-hover:border-white/20 group-hover:bg-white/10 group-hover:shadow-sm transition-all">
                                                    <BadgePercent className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span className="text-[13px] font-semibold text-white/90 tracking-tight">Commission Rate Governance</span>
                                                    <p className="text-[11px] text-white/30 mt-1 leading-snug">
                                                        Detect category misclassifications and referral fee overcharges.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent w-full" />

                                {/* Section 2: The "Big Three" Core Products */}
                                <div className="space-y-5">
                                    <h4 className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.15em] px-2">
                                        Core Platform
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="group block p-4 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-default">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2.5 bg-white/5 rounded-lg text-white/50 border border-white/10 group-hover:border-white/20 group-hover:bg-white/10 group-hover:shadow-sm transition-all">
                                                    <CircleDollarSign className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[13px] font-semibold text-white/90 tracking-tight">FBA Reimbursements</span>
                                                    </div>
                                                    <p className="text-[11px] text-white/30 mt-1 leading-snug">
                                                        Automated recovery for lost & damaged inventory.
                                                    </p>
                                                    <span className="inline-block mt-2 text-[9px] font-bold text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-500/10">
                                                        18-month lookback
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="group block p-4 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-default">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2.5 bg-white/5 rounded-lg text-white/50 border border-white/10 group-hover:border-white/20 group-hover:bg-white/10 group-hover:shadow-sm transition-all">
                                                    <ShieldAlert className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span className="text-[13px] font-semibold text-white/90 tracking-tight">Inbound Variance Monitor</span>
                                                    <p className="text-[11px] text-white/30 mt-1 leading-snug">
                                                        Audit Inbound Placement & Defect fees in real-time.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="group block p-4 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-default">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2.5 bg-white/5 rounded-lg text-white/50 border border-white/10 group-hover:border-white/20 group-hover:bg-white/10 group-hover:shadow-sm transition-all">
                                                    <BoxSelect className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span className="text-[13px] font-semibold text-white/90 tracking-tight">Dimension & Weight Auditor</span>
                                                    <p className="text-[11px] text-white/30 mt-1 leading-snug">
                                                        Auto-detect storage tier overcharges and trigger re-measurements.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="group block p-4 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-default">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2.5 bg-white/5 rounded-lg text-white/50 border border-white/10 group-hover:border-white/20 group-hover:bg-white/10 group-hover:shadow-sm transition-all">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span className="text-[13px] font-semibold text-white/90 tracking-tight">Auto-Invoice Sync</span>
                                                    <p className="text-[11px] text-white/30 mt-1 leading-snug">
                                                        Zero-touch Gmail integration for claim evidence matching.
                                                    </p>
                                                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-medium text-emerald-500/70 group-hover:text-emerald-500 transition-colors">
                                                        No VAs needed
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
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
