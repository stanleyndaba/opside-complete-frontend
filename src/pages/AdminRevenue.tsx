import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw } from 'lucide-react';

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
    const [feePercentage, setFeePercentage] = useState(25);

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
                setFeePercentage(data.feePercentage || 25);
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
            <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-400 mb-3" />
                    <p className="text-slate-400 text-sm tracking-wide">Loading metrics...</p>
                </div>
            </div>
        );
    }

    if (error && !metrics) {
        return (
            <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 text-sm mb-4">{error}</p>
                    <Button onClick={fetchMetrics} variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                        <RefreshCw className="w-3 h-3 mr-2" />
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0f1a]">
            {/* Header Bar */}
            <div className="border-b border-slate-800 bg-[#0d1320]">
                <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-medium text-white tracking-tight">Revenue Analytics</h1>
                        <p className="text-xs text-slate-500 mt-0.5 tracking-wide">
                            OPSIDE • {feePercentage}% Recovery Fee
                        </p>
                    </div>
                    <Button
                        onClick={fetchMetrics}
                        variant="ghost"
                        size="sm"
                        disabled={loading}
                        className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
                    >
                        <RefreshCw className={`w-3 h-3 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
                {/* Primary Metrics Row */}
                <div className="grid grid-cols-4 gap-6">
                    {/* Net Revenue */}
                    <div className="bg-[#0d1320] border border-slate-800 rounded-sm p-5">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Net Revenue</div>
                        <div className="text-2xl font-light text-white tracking-tight">
                            {formatCurrency(metrics?.opsideRevenue || 0)}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-2">
                            {feePercentage}% of {formatCurrency(metrics?.totalRecovered || 0)}
                        </div>
                    </div>

                    {/* 30-Day Revenue */}
                    <div className="bg-[#0d1320] border border-slate-800 rounded-sm p-5">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">30-Day Revenue</div>
                        <div className="text-2xl font-light text-white tracking-tight">
                            {formatCurrency(metrics?.last30Days?.revenue || 0)}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-2">
                            {metrics?.last30Days?.approvedClaims || 0} approved claims
                        </div>
                    </div>

                    {/* Approval Rate */}
                    <div className="bg-[#0d1320] border border-slate-800 rounded-sm p-5">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Approval Rate</div>
                        <div className="text-2xl font-light text-white tracking-tight">
                            {(metrics?.approvalRate || 0).toFixed(1)}%
                        </div>
                        <div className="text-[10px] text-slate-500 mt-2">
                            {metrics?.approvedClaims || 0} of {metrics?.totalClaims || 0}
                        </div>
                    </div>

                    {/* Avg Claim Value */}
                    <div className="bg-[#0d1320] border border-slate-800 rounded-sm p-5">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Avg Claim Value</div>
                        <div className="text-2xl font-light text-white tracking-tight">
                            {formatCurrency(metrics?.averageClaimValue || 0)}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-2">
                            ≈ {formatCurrency((metrics?.averageClaimValue || 0) * (feePercentage / 100))} fee
                        </div>
                    </div>
                </div>

                {/* Status Summary */}
                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-[#0d1320] border border-slate-800 rounded-sm p-5 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">Approved</div>
                            <div className="text-xl font-light text-emerald-400">{metrics?.approvedClaims || 0}</div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    </div>
                    <div className="bg-[#0d1320] border border-slate-800 rounded-sm p-5 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">Pending</div>
                            <div className="text-xl font-light text-amber-400">{metrics?.pendingClaims || 0}</div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    </div>
                    <div className="bg-[#0d1320] border border-slate-800 rounded-sm p-5 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">Denied</div>
                            <div className="text-xl font-light text-red-400">{metrics?.deniedClaims || 0}</div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    </div>
                </div>

                {/* Data Tables */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Monthly Revenue */}
                    <div className="bg-[#0d1320] border border-slate-800 rounded-sm">
                        <div className="px-5 py-4 border-b border-slate-800">
                            <h3 className="text-xs font-medium text-white tracking-wide">Monthly Revenue</h3>
                        </div>
                        <div className="overflow-hidden">
                            {metrics?.revenueByMonth && metrics.revenueByMonth.length > 0 ? (
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-800">
                                            <th className="px-5 py-3 text-left text-[10px] uppercase tracking-[0.15em] text-slate-500 font-medium">Period</th>
                                            <th className="px-5 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-slate-500 font-medium">Revenue</th>
                                            <th className="px-5 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-slate-500 font-medium">Recovered</th>
                                            <th className="px-5 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-slate-500 font-medium">Claims</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {metrics.revenueByMonth.slice(0, 6).map((row, i) => (
                                            <tr key={row.month} className={i < 5 ? 'border-b border-slate-800/50' : ''}>
                                                <td className="px-5 py-3 text-xs text-slate-300 font-mono">{row.month}</td>
                                                <td className="px-5 py-3 text-xs text-emerald-400 text-right font-mono">{formatCurrencyPrecise(row.revenue)}</td>
                                                <td className="px-5 py-3 text-xs text-slate-400 text-right font-mono">{formatCurrencyPrecise(row.recovered)}</td>
                                                <td className="px-5 py-3 text-xs text-slate-400 text-right font-mono">{row.claims}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="px-5 py-8 text-center text-slate-500 text-xs">No data available</div>
                            )}
                        </div>
                    </div>

                    {/* Top Accounts */}
                    <div className="bg-[#0d1320] border border-slate-800 rounded-sm">
                        <div className="px-5 py-4 border-b border-slate-800">
                            <h3 className="text-xs font-medium text-white tracking-wide">Top Accounts</h3>
                        </div>
                        <div className="overflow-hidden">
                            {metrics?.revenueByCustomer && metrics.revenueByCustomer.length > 0 ? (
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-800">
                                            <th className="px-5 py-3 text-left text-[10px] uppercase tracking-[0.15em] text-slate-500 font-medium">Account</th>
                                            <th className="px-5 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-slate-500 font-medium">Revenue</th>
                                            <th className="px-5 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-slate-500 font-medium">Recovered</th>
                                            <th className="px-5 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-slate-500 font-medium">Claims</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {metrics.revenueByCustomer.slice(0, 6).map((row, i) => (
                                            <tr key={row.seller_id} className={i < 5 ? 'border-b border-slate-800/50' : ''}>
                                                <td className="px-5 py-3 text-xs text-slate-300 font-mono">{row.seller_id?.slice(0, 8)}...</td>
                                                <td className="px-5 py-3 text-xs text-emerald-400 text-right font-mono">{formatCurrencyPrecise(row.revenue)}</td>
                                                <td className="px-5 py-3 text-xs text-slate-400 text-right font-mono">{formatCurrencyPrecise(row.recovered)}</td>
                                                <td className="px-5 py-3 text-xs text-slate-400 text-right font-mono">{row.claims}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="px-5 py-8 text-center text-slate-500 text-xs">No data available</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-800">
                    <p className="text-[10px] text-slate-600 tracking-wide">
                        OPSIDE TECHNOLOGIES • CONFIDENTIAL • FOR INTERNAL USE ONLY
                    </p>
                </div>
            </div>
        </div>
    );
}
