import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import AdminOnly from '@/components/routes/AdminOnly';

interface RevenueMetrics {
    totalRecovered: number;
    opsideRevenue: number;
    totalClaims: number;
    approvedClaims: number;
    pendingClaims: number;
    deniedClaims: number;
    approvalRate: number;
    averageClaimValue: number;
    revenueByMonth: { month: string; revenue: number; recovered: number; claims: number }[];
    revenueByCustomer: { seller_id: string; email?: string; revenue: number; recovered: number; claims: number }[];
    revenueByClaimType: { type: string; revenue: number; recovered: number; claims: number }[];
    last30Days: {
        revenue: number;
        recovered: number;
        claims: number;
        approvedClaims: number;
    };
    // Investor metrics
    mrrGrowth?: number;
    currentMrr?: number;
    previousMrr?: number;
    activeCustomers?: number;
    avgRevenuePerCustomer?: number;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

const formatCurrencyPrecise = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

export default function AdminRevenue() {
    const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [feePercentage, setFeePercentage] = useState(20);

    const fetchMetrics = async () => {
        try {
            setLoading(true);
            setError(null);

            const backendUrl = 'https://opside-node-api-woco.onrender.com';
            const response = await fetch(`${backendUrl}/api/admin/revenue`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();

            if (data.ok) {
                setMetrics(data.data);
                setFeePercentage(data.feePercentage || 20);
            } else {
                setError(data.error || 'Failed to fetch revenue metrics');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch revenue metrics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    if (loading && !metrics) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500 text-sm">Loading metrics...</p>
                </div>
            </div>
        );
    }

    if (error && !metrics) {
        return (
            <AdminOnly>
                <PageLayout title="Admin Command Center // Revenue" midnight>
                    <div className="min-h-screen bg-[#050505] flex items-center justify-center -m-4 lg:-m-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />
                        <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
                        <div className="text-center relative z-10">
                            <p className="text-red-500 text-sm mb-4 font-mono uppercase tracking-widest">{error}</p>
                            <Button onClick={fetchMetrics} variant="outline" size="sm" className="border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-emerald-500 font-mono text-[9px] uppercase tracking-widest rounded-lg">
                                <RefreshCw className="w-3 h-3 mr-2" />
                                Retry Connection
                            </Button>
                        </div>
                    </div>
                </PageLayout>
            </AdminOnly>
        );
    }

    const mrrGrowth = metrics?.mrrGrowth || 0;
    const isPositiveGrowth = mrrGrowth >= 0;

    return (
        <AdminOnly>
            <PageLayout title="Admin Command Center // Revenue" midnight>
                <div className="min-h-screen bg-[#050505] relative overflow-hidden -m-4 lg:-m-6">
                    {/* Aesthetic Background Elements */}
                    <div className="absolute top-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />
                    <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

                    <div className="relative z-10 container max-w-7xl mx-auto px-6 py-12 space-y-8">
                        {/* Header section */}
                        <div className="flex flex-col mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-px w-8 bg-emerald-500/50" />
                                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-500/80">FINANCIAL_SYS // REVENUE_ANALYTICS</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-serif text-white mb-4 leading-tight">
                                        Revenue Terminal
                                    </h1>
                                    <p className="text-sm font-mono text-white/40 tracking-widest uppercase">
                                        MARGIN • {feePercentage}% Recovery Fee
                                    </p>
                                </div>
                                <Button
                                    onClick={fetchMetrics}
                                    variant="outline"
                                    size="sm"
                                    disabled={loading}
                                    className="border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-emerald-500 h-9 px-4 font-mono uppercase tracking-widest text-[9px] rounded-lg transition-all"
                                >
                                    <RefreshCw className={`w-3 h-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                    Sync Financials
                                </Button>
                            </div>
                        </div>

                        {/* Investor Metrics Row */}
                        <div className="grid grid-cols-5 gap-4">
                            {/* MRR Growth */}
                            <div className="bg-[#0c0c0c] border border-white/5 backdrop-blur-3xl rounded-xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
                                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-2">MRR Growth</div>
                                <div className={`text-2xl font-serif flex items-center ${isPositiveGrowth ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {isPositiveGrowth ? <TrendingUp className="w-5 h-5 mr-3" /> : <TrendingDown className="w-5 h-5 mr-3" />}
                                    {mrrGrowth >= 0 ? '+' : ''}{mrrGrowth.toFixed(1)}%
                                </div>
                                <div className="text-xs text-white/30 font-serif mt-2 italic">month-over-month</div>
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                    {isPositiveGrowth ? <TrendingUp className="w-16 h-16 text-emerald-500" /> : <TrendingDown className="w-16 h-16 text-red-500" />}
                                </div>
                            </div>

                            {/* Current MRR */}
                            <div className="bg-[#0c0c0c] border border-white/5 backdrop-blur-3xl rounded-xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
                                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-2">Current MRR</div>
                                <div className="text-2xl font-serif text-white/90">
                                    {formatCurrency(metrics?.currentMrr || 0)}
                                </div>
                                <div className="text-xs text-white/30 font-serif mt-2 italic">this month</div>
                            </div>

                            {/* Previous MRR */}
                            <div className="bg-[#0c0c0c] border border-white/5 backdrop-blur-3xl rounded-xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
                                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-2">Previous MRR</div>
                                <div className="text-2xl font-serif text-white/90">
                                    {formatCurrency(metrics?.previousMrr || 0)}
                                </div>
                                <div className="text-xs text-white/30 font-serif mt-2 italic">last month</div>
                            </div>

                            {/* Active Customers */}
                            <div className="bg-[#0c0c0c] border border-white/5 backdrop-blur-3xl rounded-xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
                                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-2">Active Accounts</div>
                                <div className="text-2xl font-serif text-white/90">
                                    {metrics?.activeCustomers || 0}
                                </div>
                                <div className="text-xs text-white/30 font-serif mt-2 italic">total customers</div>
                            </div>

                            {/* Avg Revenue Per Customer */}
                            <div className="bg-[#0c0c0c] border border-white/5 backdrop-blur-3xl rounded-xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
                                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-2">ARPC</div>
                                <div className="text-2xl font-serif text-white/90">
                                    {formatCurrency(metrics?.avgRevenuePerCustomer || 0)}
                                </div>
                                <div className="text-xs text-white/30 font-serif mt-2 italic">avg rev / customer</div>
                            </div>
                        </div>

                        {/* Primary Metrics Row */}
                        <div className="grid grid-cols-4 gap-6">
                            {/* Net Revenue */}
                            <div className="bg-[#0c0c0c] border border-white/5 backdrop-blur-3xl rounded-xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
                                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-2">Total Revenue</div>
                                <div className="text-3xl font-serif text-white/90">
                                    {formatCurrency(metrics?.opsideRevenue || 0)}
                                </div>
                                <div className="text-xs text-white/30 font-serif mt-2 italic">
                                    {feePercentage}% of {formatCurrency(metrics?.totalRecovered || 0)}
                                </div>
                            </div>

                            {/* 30-Day Revenue */}
                            <div className="bg-[#0c0c0c] border border-white/5 backdrop-blur-3xl rounded-xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
                                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-2">30-Day Revenue</div>
                                <div className="text-3xl font-serif text-white/90">
                                    {formatCurrency(metrics?.last30Days?.revenue || 0)}
                                </div>
                                <div className="text-xs text-white/30 font-serif mt-2 italic">
                                    {metrics?.last30Days?.approvedClaims || 0} approved claims
                                </div>
                            </div>

                            {/* Approval Rate */}
                            <div className="bg-[#0c0c0c] border border-white/5 backdrop-blur-3xl rounded-xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
                                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-2">Approval Rate</div>
                                <div className="text-3xl font-serif text-white/90">
                                    {(metrics?.approvalRate || 0).toFixed(1)}%
                                </div>
                                <div className="text-xs text-white/30 font-serif mt-2 italic">
                                    {metrics?.approvedClaims || 0} of {metrics?.totalClaims || 0}
                                </div>
                            </div>

                            {/* Avg Claim Value */}
                            <div className="bg-[#0c0c0c] border border-white/5 backdrop-blur-3xl rounded-xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
                                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-2">Avg Claim Value</div>
                                <div className="text-3xl font-serif text-white/90">
                                    {formatCurrency(metrics?.averageClaimValue || 0)}
                                </div>
                                <div className="text-xs text-white/30 font-serif mt-2 italic">
                                    ≈ {formatCurrency((metrics?.averageClaimValue || 0) * (feePercentage / 100))} fee
                                </div>
                            </div>
                        </div>

                        {/* Status Summary */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-white/[0.01] border border-emerald-500/20 rounded-xl p-6 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-[10px] font-mono text-emerald-500/70 tracking-widest uppercase">Approved Load</div>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                </div>
                                <div className="text-2xl font-serif text-emerald-400">{metrics?.approvedClaims || 0}</div>
                            </div>
                            <div className="bg-white/[0.01] border border-amber-500/20 rounded-xl p-6 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-[10px] font-mono text-amber-500/70 tracking-widest uppercase">Pending Load</div>
                                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                </div>
                                <div className="text-2xl font-serif text-amber-400">{metrics?.pendingClaims || 0}</div>
                            </div>
                            <div className="bg-white/[0.01] border border-red-500/20 rounded-xl p-6 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-[10px] font-mono text-red-500/70 tracking-widest uppercase">Denied Load</div>
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                </div>
                                <div className="text-2xl font-serif text-red-400">{metrics?.deniedClaims || 0}</div>
                            </div>
                        </div>

                        {/* Data Tables */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Monthly Revenue */}
                            <div className="bg-[#0c0c0c] border border-white/5 backdrop-blur-3xl rounded-xl overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                                    <h3 className="text-xs font-mono tracking-[0.2em] uppercase text-emerald-500/80">Monthly Revenue</h3>
                                </div>
                                <div>
                                    {metrics?.revenueByMonth && metrics.revenueByMonth.length > 0 ? (
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/5">
                                                    <th className="px-6 py-4 text-left text-[10px] text-white/40 font-mono tracking-widest uppercase bg-white/[0.01]">Period</th>
                                                    <th className="px-6 py-4 text-right text-[10px] text-white/40 font-mono tracking-widest uppercase bg-white/[0.01]">Revenue</th>
                                                    <th className="px-6 py-4 text-right text-[10px] text-white/40 font-mono tracking-widest uppercase bg-white/[0.01]">Recovered</th>
                                                    <th className="px-6 py-4 text-right text-[10px] text-white/40 font-mono tracking-widest uppercase bg-white/[0.01]">Claims</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {metrics.revenueByMonth.slice(0, 6).map((row, i) => (
                                                    <tr key={row.month} className={`${i < 5 ? 'border-b border-white/5' : ''} hover:bg-white/[0.02] transition-colors`}>
                                                        <td className="px-6 py-4 text-xs text-white/70 font-mono">{row.month}</td>
                                                        <td className="px-6 py-4 text-xs text-emerald-400 text-right font-mono">{formatCurrencyPrecise(row.revenue)}</td>
                                                        <td className="px-6 py-4 text-xs text-white/50 text-right font-mono">{formatCurrencyPrecise(row.recovered)}</td>
                                                        <td className="px-6 py-4 text-xs text-white/50 text-right font-mono">{row.claims}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="px-6 py-12 text-center text-white/20 font-mono text-[10px] uppercase tracking-widest">No data available</div>
                                    )}
                                </div>
                            </div>

                            {/* Top Accounts */}
                            <div className="bg-[#0c0c0c] border border-white/5 backdrop-blur-3xl rounded-xl overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                                    <h3 className="text-xs font-mono tracking-[0.2em] uppercase text-emerald-500/80">Top Accounts</h3>
                                </div>
                                <div>
                                    {metrics?.revenueByCustomer && metrics.revenueByCustomer.length > 0 ? (
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/5">
                                                    <th className="px-6 py-4 text-left text-[10px] text-white/40 font-mono tracking-widest uppercase bg-white/[0.01]">Account</th>
                                                    <th className="px-6 py-4 text-right text-[10px] text-white/40 font-mono tracking-widest uppercase bg-white/[0.01]">Revenue</th>
                                                    <th className="px-6 py-4 text-right text-[10px] text-white/40 font-mono tracking-widest uppercase bg-white/[0.01]">Recovered</th>
                                                    <th className="px-6 py-4 text-right text-[10px] text-white/40 font-mono tracking-widest uppercase bg-white/[0.01]">Claims</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {metrics.revenueByCustomer.slice(0, 6).map((row, i) => (
                                                    <tr key={row.seller_id} className={`${i < 5 ? 'border-b border-white/5' : ''} hover:bg-white/[0.02] transition-colors`}>
                                                        <td className="px-6 py-4 text-xs text-white/70 font-mono">{row.seller_id?.slice(0, 8)}...</td>
                                                        <td className="px-6 py-4 text-xs text-emerald-400 text-right font-mono">{formatCurrencyPrecise(row.revenue)}</td>
                                                        <td className="px-6 py-4 text-xs text-white/50 text-right font-mono">{formatCurrencyPrecise(row.recovered)}</td>
                                                        <td className="px-6 py-4 text-xs text-white/50 text-right font-mono">{row.claims}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="px-6 py-12 text-center text-white/20 font-mono text-[10px] uppercase tracking-widest">No data available</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-8 border-t border-white/5 flex items-center justify-between opacity-50">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-mono tracking-[0.3em] text-white uppercase">Margin Internal System // Authorized access only</span>
                            </div>
                            <span className="text-[9px] font-mono tracking-widest text-emerald-500">v2.0.4-STABLE</span>
                        </div>
                    </div>
                </div>
            </PageLayout>
        </AdminOnly>
    );
}
