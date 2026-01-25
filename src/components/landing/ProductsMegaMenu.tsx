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
                    <NavigationMenuTrigger className="bg-transparent hover:bg-gray-100/50 text-gray-600 hover:text-gray-900 data-[state=open]:!bg-gray-100/50 data-[state=open]:!text-gray-900 h-auto py-2 px-3 text-sm font-medium">
                        Products
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="flex flex-col lg:flex-row w-[calc(100vw-2rem)] md:w-[700px] lg:w-[820px] bg-blue-50/95 [backdrop-filter:blur(32px)_saturate(180%)] rounded-xl overflow-hidden shadow-2xl shadow-blue-900/10 border border-blue-100/50 max-h-[85vh] overflow-y-auto">
                            {/* Left Side: Features */}
                            <div className="flex-1 p-6 lg:p-8 grid gap-8">

                                {/* Section 1: The "Big Three" Core Products */}
                                <div className="space-y-5">
                                    <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.15em] px-2">
                                        Core Platform
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <a href="#reimbursements" className="group block p-4 rounded-xl hover:bg-white/60 transition-all duration-300">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2.5 bg-blue-100/30 rounded-lg text-gray-600 border border-blue-100/50 group-hover:border-blue-200 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                    <CircleDollarSign className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[13px] font-semibold text-gray-900 tracking-tight">FBA Reimbursements</span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                                                        Automated recovery for lost & damaged inventory.
                                                    </p>
                                                    <span className="inline-block mt-2 text-[9px] font-bold text-gray-500 bg-gray-100/80 px-2 py-0.5 rounded uppercase tracking-wider border border-gray-200/50">
                                                        18-month lookback
                                                    </span>
                                                </div>
                                            </div>
                                        </a>

                                        <a href="#fee-guard" className="group block p-4 rounded-xl hover:bg-white/60 transition-all duration-300">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2.5 bg-blue-100/30 rounded-lg text-gray-600 border border-blue-100/50 group-hover:border-blue-200 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                    <ShieldAlert className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span className="text-[13px] font-semibold text-gray-900 tracking-tight">Inbound Variance Monitor</span>
                                                    <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                                                        Audit Inbound Placement & Defect fees in real-time.
                                                    </p>
                                                </div>
                                            </div>
                                        </a>

                                        <a href="#dimension-auditor" className="group block p-4 rounded-xl hover:bg-white/60 transition-all duration-300">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2.5 bg-blue-100/30 rounded-lg text-gray-600 border border-blue-100/50 group-hover:border-blue-200 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                    <BoxSelect className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span className="text-[13px] font-semibold text-gray-900 tracking-tight">Dimension & Weight Auditor</span>
                                                    <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                                                        Auto-detect storage tier overcharges and trigger re-measurements.
                                                    </p>
                                                </div>
                                            </div>
                                        </a>

                                        <a href="#invoice-sync" className="group block p-4 rounded-xl hover:bg-white/60 transition-all duration-300">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2.5 bg-blue-100/30 rounded-lg text-gray-600 border border-blue-100/50 group-hover:border-blue-200 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span className="text-[13px] font-semibold text-gray-900 tracking-tight">Auto-Invoice Sync</span>
                                                    <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                                                        Zero-touch Gmail integration for claim evidence matching.
                                                    </p>
                                                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-medium text-gray-500 group-hover:text-gray-900 transition-colors">
                                                        No VAs needed <ArrowRight className="h-2.5 w-2.5 ml-0.5" />
                                                    </span>
                                                </div>
                                            </div>
                                        </a>
                                    </div>
                                </div>

                                <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent w-full" />

                                {/* Section 2: Trust & Scale */}
                                <div className="space-y-5">
                                    <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.15em] px-2">
                                        Trust & Scale
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <a href="#forensic-auditor" className="group block p-4 rounded-xl hover:bg-white/60 transition-all duration-300">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2.5 bg-blue-100/30 rounded-lg text-gray-600 border border-blue-100/50 group-hover:border-blue-200 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                    <Search className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span className="text-[13px] font-semibold text-gray-900 tracking-tight">Inbound Fee Governance</span>
                                                    <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                                                        Transparent, line-by-line proof for every claim filed.
                                                    </p>
                                                </div>
                                            </div>
                                        </a>

                                        <a href="#portfolio-manager" className="group block p-4 rounded-xl hover:bg-white/60 transition-all duration-300">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2.5 bg-blue-100/30 rounded-lg text-gray-600 border border-blue-100/50 group-hover:border-blue-200 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                    <Briefcase className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span className="text-[13px] font-semibold text-gray-900 tracking-tight">Agency Portfolio Manager</span>
                                                    <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                                                        Multi-account reconciliation for high-volume agencies.
                                                    </p>
                                                </div>
                                            </div>
                                        </a>

                                        <a href="#commission-governance" className="group block p-4 rounded-xl hover:bg-white/60 transition-all duration-300">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2.5 bg-blue-100/30 rounded-lg text-gray-600 border border-blue-100/50 group-hover:border-blue-200 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                    <BadgePercent className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span className="text-[13px] font-semibold text-gray-900 tracking-tight">Commission Rate Governance</span>
                                                    <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                                                        Detect category misclassifications and referral fee overcharges.
                                                    </p>
                                                </div>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Impact Panel */}
                            <div className="w-full lg:w-[280px] bg-gray-50/30 border-t lg:border-t-0 lg:border-l border-gray-200/80 p-6 lg:p-8 flex flex-col justify-between shrink-0">
                                <div>
                                    <h4 className="flex items-center gap-2 text-[11px] font-semibold text-gray-900 uppercase tracking-widest mb-6">
                                        <TrendingUp className="h-3.5 w-3.5" />
                                        Live Impact
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-white/40 rounded-xl border border-blue-100/50 shadow-sm backdrop-blur-sm">
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.1em]">
                                                Recovered this week
                                            </p>
                                            <p className="text-xl font-bold text-gray-900 mt-1 tracking-tight">
                                                R4.2M
                                            </p>
                                            <p className="text-[9px] text-gray-500 font-semibold mt-1.5 flex items-center gap-1">
                                                <span className="text-emerald-500 font-bold">↑</span> 12.5% vs last week
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 p-3.5 bg-gray-50/50 rounded-xl border border-gray-200/50">
                                            <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center border border-gray-100 shadow-sm shrink-0">
                                                <span className="text-[11px] font-bold text-gray-900">67k</span>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide leading-tight">
                                                    Trusted by
                                                </p>
                                                <p className="text-[11px] font-bold text-gray-900 leading-tight">
                                                    67k+ Sellers
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <a href="/contact" className="block w-full py-3 px-4 bg-gray-900 text-white text-[11px] font-bold text-center rounded-xl hover:bg-gray-800 transition-all shadow-sm ring-1 ring-gray-900/10 active:scale-[0.98]">
                                        Get a Forensic Audit
                                    </a>
                                </div>
                            </div>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}
