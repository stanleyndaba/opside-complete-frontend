import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

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
                    <p className="text-gray-500 text-sm tracking-wide">Loading metrics...</p>
                </div>
            </div>
        );
    }

    if (error && !metrics) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 text-sm mb-4">{error}</p>
                    <Button onClick={fetchMetrics} variant="outline" size="sm" className="border-gray-300 text-gray-600 hover:bg-gray-50">
                        <RefreshCw className="w-3 h-3 mr-2" />
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    const mrrGrowth = metrics?.mrrGrowth || 0;
    const isPositiveGrowth = mrrGrowth >= 0;

    return (
        <div className="min-h-screen bg-white">
            {/* Header Bar */}
            <div className="border-b border-gray-200 bg-gray-50">
                <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-medium text-gray-900 tracking-tight">Revenue Analytics</h1>
                        <p className="text-xs text-gray-500 mt-0.5 tracking-wide">
                            MARGIN • {feePercentage}% Recovery Fee
                        </p>
                    </div>
                    <Button
                        onClick={fetchMetrics}
                        variant="ghost"
                        size="sm"
                        disabled={loading}
                        className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 text-xs">
                        <RefreshCw className={`w-3 h-3 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">

                {/* Investor Metrics Row */}
                <div className="grid grid-cols-5 gap-4">
                    {/* MRR Growth */}
                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                        <div className="text-[10px] tracking-[0.2em] text-gray-500 mb-1">MRR Growth</div>
                        <div className={`text-xl font-light tracking-tight flex items-center ${isPositiveGrowth ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isPositiveGrowth ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                            {mrrGrowth >= 0 ? '+' : ''}{mrrGrowth.toFixed(1)}%
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">month-over-month</div>
                    </div>

                    {/* Current MRR */}
                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                        <div className="text-[10px] tracking-[0.2em] text-gray-500 mb-1">Current MRR</div>
                        <div className="text-xl font-light text-gray-900 tracking-tight">
                            {formatCurrency(metrics?.currentMrr || 0)}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">this month</div>
                    </div>

                    {/* Previous MRR */}
                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                        <div className="text-[10px] tracking-[0.2em] text-gray-500 mb-1">Previous MRR</div>
                        <div className="text-xl font-light text-gray-900 tracking-tight">
                            {formatCurrency(metrics?.previousMrr || 0)}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">last month</div>
                    </div>

                    {/* Active Customers */}
                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                        <div className="text-[10px] tracking-[0.2em] text-gray-500 mb-1">Active Accounts</div>
                        <div className="text-xl font-light text-gray-900 tracking-tight">
                            {metrics?.activeCustomers || 0}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">total customers</div>
                    </div>

                    {/* Avg Revenue Per Customer */}
                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                        <div className="text-[10px] tracking-[0.2em] text-gray-500 mb-1">ARPC</div>
                        <div className="text-xl font-light text-gray-900 tracking-tight">
                            {formatCurrency(metrics?.avgRevenuePerCustomer || 0)}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">avg rev / customer</div>
                    </div>
                </div>

                {/* Primary Metrics Row */}
                <div className="grid grid-cols-4 gap-6">
                    {/* Net Revenue */}
                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-5">
                        <div className="text-[10px] tracking-[0.2em] text-gray-500 mb-2">Total Revenue</div>
                        <div className="text-2xl font-light text-gray-900 tracking-tight">
                            {formatCurrency(metrics?.opsideRevenue || 0)}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-2">
                            {feePercentage}% of {formatCurrency(metrics?.totalRecovered || 0)}
                        </div>
                    </div>

                    {/* 30-Day Revenue */}
                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-5">
                        <div className="text-[10px] tracking-[0.2em] text-gray-500 mb-2">30-Day Revenue</div>
                        <div className="text-2xl font-light text-gray-900 tracking-tight">
                            {formatCurrency(metrics?.last30Days?.revenue || 0)}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-2">
                            {metrics?.last30Days?.approvedClaims || 0} approved claims
                        </div>
                    </div>

                    {/* Approval Rate */}
                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-5">
                        <div className="text-[10px] tracking-[0.2em] text-gray-500 mb-2">Approval Rate</div>
                        <div className="text-2xl font-light text-gray-900 tracking-tight">
                            {(metrics?.approvalRate || 0).toFixed(1)}%
                        </div>
                        <div className="text-[10px] text-gray-500 mt-2">
                            {metrics?.approvedClaims || 0} of {metrics?.totalClaims || 0}
                        </div>
                    </div>

                    {/* Avg Claim Value */}
                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-5">
                        <div className="text-[10px] tracking-[0.2em] text-gray-500 mb-2">Avg Claim Value</div>
                        <div className="text-2xl font-light text-gray-900 tracking-tight">
                            {formatCurrency(metrics?.averageClaimValue || 0)}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-2">
                            ≈ {formatCurrency((metrics?.averageClaimValue || 0) * (feePercentage / 100))} fee
                        </div>
                    </div>
                </div>

                {/* Status Summary */}
                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-5 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] tracking-[0.2em] text-gray-500 mb-1">Approved</div>
                            <div className="text-xl font-light text-emerald-600">{metrics?.approvedClaims || 0}</div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-5 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] tracking-[0.2em] text-gray-500 mb-1">Pending</div>
                            <div className="text-xl font-light text-amber-600">{metrics?.pendingClaims || 0}</div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-5 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] tracking-[0.2em] text-gray-500 mb-1">Denied</div>
                            <div className="text-xl font-light text-red-600">{metrics?.deniedClaims || 0}</div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    </div>
                </div>

                {/* Data Tables */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Monthly Revenue */}
                    <div className="bg-white border border-gray-200 rounded-sm">
                        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-xs font-medium text-gray-900 tracking-wide">Monthly Revenue</h3>
                        </div>
                        <div className="overflow-hidden">
                            {metrics?.revenueByMonth && metrics.revenueByMonth.length > 0 ? (
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="px-5 py-3 text-left text-[10px] tracking-[0.15em] text-gray-500 font-medium">Period</th>
                                            <th className="px-5 py-3 text-right text-[10px] tracking-[0.15em] text-gray-500 font-medium">Revenue</th>
                                            <th className="px-5 py-3 text-right text-[10px] tracking-[0.15em] text-gray-500 font-medium">Recovered</th>
                                            <th className="px-5 py-3 text-right text-[10px] tracking-[0.15em] text-gray-500 font-medium">Claims</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {metrics.revenueByMonth.slice(0, 6).map((row, i) => (
                                            <tr key={row.month} className={i < 5 ? 'border-b border-gray-100' : ''}>
                                                <td className="px-5 py-3 text-xs text-gray-700 font-mono">{row.month}</td>
                                                <td className="px-5 py-3 text-xs text-emerald-600 text-right font-mono">{formatCurrencyPrecise(row.revenue)}</td>
                                                <td className="px-5 py-3 text-xs text-gray-500 text-right font-mono">{formatCurrencyPrecise(row.recovered)}</td>
                                                <td className="px-5 py-3 text-xs text-gray-500 text-right font-mono">{row.claims}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="px-5 py-8 text-center text-gray-500 text-xs">No data available</div>
                            )}
                        </div>
                    </div>

                    {/* Top Accounts */}
                    <div className="bg-white border border-gray-200 rounded-sm">
                        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-xs font-medium text-gray-900 tracking-wide">Top Accounts</h3>
                        </div>
                        <div className="overflow-hidden">
                            {metrics?.revenueByCustomer && metrics.revenueByCustomer.length > 0 ? (
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="px-5 py-3 text-left text-[10px] tracking-[0.15em] text-gray-500 font-medium">Account</th>
                                            <th className="px-5 py-3 text-right text-[10px] tracking-[0.15em] text-gray-500 font-medium">Revenue</th>
                                            <th className="px-5 py-3 text-right text-[10px] tracking-[0.15em] text-gray-500 font-medium">Recovered</th>
                                            <th className="px-5 py-3 text-right text-[10px] tracking-[0.15em] text-gray-500 font-medium">Claims</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {metrics.revenueByCustomer.slice(0, 6).map((row, i) => (
                                            <tr key={row.seller_id} className={i < 5 ? 'border-b border-gray-100' : ''}>
                                                <td className="px-5 py-3 text-xs text-gray-700 font-mono">{row.seller_id?.slice(0, 8)}...</td>
                                                <td className="px-5 py-3 text-xs text-emerald-600 text-right font-mono">{formatCurrencyPrecise(row.revenue)}</td>
                                                <td className="px-5 py-3 text-xs text-gray-500 text-right font-mono">{formatCurrencyPrecise(row.recovered)}</td>
                                                <td className="px-5 py-3 text-xs text-gray-500 text-right font-mono">{row.claims}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="px-5 py-8 text-center text-gray-500 text-xs">No data available</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-gray-200">
                    <p className="text-[10px] text-gray-400 tracking-wide">
                        MARGIN AI • CONFIDENTIAL • FOR INTERNAL USE ONLY
                    </p>
                </div>
            </div>
        </div>
    );
}
