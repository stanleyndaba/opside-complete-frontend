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
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProductsMegaMenu() {
    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent hover:bg-gray-100/50 text-gray-600 hover:text-gray-900 data-[state=open]:bg-gray-100/50 h-auto py-2 px-3 text-sm font-medium">
                        Products
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="flex w-[800px] bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-100">
                            {/* Left Side: Features */}
                            <div className="flex-1 p-6 grid gap-6">

                                {/* Section 1: The "Big Three" Core Products */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">
                                        Core Platform
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <a href="#reimbursements" className="group block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-emerald-50 rounded-md text-emerald-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                                                    <CircleDollarSign className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-gray-900">FBA Reimbursements</span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                                                        Automated recovery for lost & damaged inventory.
                                                    </p>
                                                    <span className="inline-block mt-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                        18-month lookback
                                                    </span>
                                                </div>
                                            </div>
                                        </a>

                                        <a href="#fee-guard" className="group block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-blue-50 rounded-md text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                                                    <ShieldAlert className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span className="text-sm font-bold text-gray-900">2026 Fee Guard</span>
                                                    <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                                                        Audit Inbound Placement & Defect fees in real-time.
                                                    </p>
                                                </div>
                                            </div>
                                        </a>

                                        <a href="#invoice-sync" className="group block p-3 rounded-lg hover:bg-gray-50 transition-colors col-span-2">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-purple-50 rounded-md text-purple-600 group-hover:bg-purple-100 group-hover:text-purple-700 transition-colors">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span className="text-sm font-bold text-gray-900">Agentic Invoice Sync</span>
                                                    <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                                                        Zero-touch Gmail integration for claim evidence matching.
                                                    </p>
                                                    <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium text-purple-600">
                                                        No VAs needed <ArrowRight className="h-2.5 w-2.5" />
                                                    </span>
                                                </div>
                                            </div>
                                        </a>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100 w-full" />

                                {/* Section 2: Trust & Scale */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">
                                        Trust & Scale
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <a href="#forensic-auditor" className="group block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-gray-100 rounded-md text-gray-600 group-hover:bg-gray-200 group-hover:text-gray-900 transition-colors">
                                                    <Search className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span className="text-sm font-bold text-gray-900">Forensic Log Auditor</span>
                                                    <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                                                        Transparent, line-by-line proof for every claim filed.
                                                    </p>
                                                </div>
                                            </div>
                                        </a>

                                        <a href="#portfolio-manager" className="group block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-gray-100 rounded-md text-gray-600 group-hover:bg-gray-200 group-hover:text-gray-900 transition-colors">
                                                    <Briefcase className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span className="text-sm font-bold text-gray-900">Whale Portfolio Mgr</span>
                                                    <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                                                        Multi-account reconciliation for high-volume agencies.
                                                    </p>
                                                </div>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: The "Dopamine" Panel */}
                            <div className="w-[260px] bg-gradient-to-br from-gray-50 to-white border-l border-gray-100 p-6 flex flex-col justify-between">
                                <div>
                                    <h4 className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">
                                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                                        Live Impact
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                                                Recovered this week
                                            </p>
                                            <p className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">
                                                R4.2M
                                            </p>
                                            <p className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                                                +12.5% vs last week
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-gray-900/5 rounded-lg">
                                            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-gray-200 shadow-sm">
                                                <span className="text-xs font-bold">67k</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-medium leading-tight">
                                                    Featured in the
                                                </p>
                                                <p className="text-xs font-bold text-gray-900 leading-tight">
                                                    Amazon Collective
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <a href="/contact" className="block w-full py-2.5 px-3 bg-black text-white text-xs font-bold text-center rounded-lg hover:bg-gray-800 transition-colors">
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
