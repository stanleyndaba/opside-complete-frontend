import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    DollarSign,
    TrendingUp,
    Users,
    FileCheck,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    Percent,
    BarChart3,
    PieChart
} from 'lucide-react';
import { api } from '@/lib/api';
import { format } from 'date-fns';

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
        minimumFractionDigits: 2
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

            // Use the same base URL pattern as api.ts
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
            <PageLayout title="Revenue Dashboard">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600">Loading revenue metrics...</p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    if (error && !metrics) {
        return (
            <PageLayout title="Revenue Dashboard">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button onClick={fetchMetrics} variant="outline">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Revenue Dashboard">
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Opside Revenue</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Internal revenue tracking • {feePercentage}% fee on recovered claims
                        </p>
                    </div>
                    <Button onClick={fetchMetrics} variant="outline" size="sm" disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Opside Revenue */}
                    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-emerald-100 text-sm font-medium">Opside Revenue</p>
                                    <p className="text-3xl font-bold mt-1">{formatCurrency(metrics?.opsideRevenue || 0)}</p>
                                    <p className="text-emerald-100 text-xs mt-2">
                                        {feePercentage}% of {formatCurrency(metrics?.totalRecovered || 0)} recovered
                                    </p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-full">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Last 30 Days Revenue */}
                    <Card className="bg-white border-gray-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Last 30 Days</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(metrics?.last30Days?.revenue || 0)}</p>
                                    <div className="flex items-center mt-2">
                                        <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
                                        <span className="text-xs text-emerald-600 font-medium">
                                            {metrics?.last30Days?.approvedClaims || 0} claims approved
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <TrendingUp className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Approval Rate */}
                    <Card className="bg-white border-gray-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Approval Rate</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{(metrics?.approvalRate || 0).toFixed(1)}%</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {metrics?.approvedClaims || 0} of {metrics?.totalClaims || 0} claims
                                    </p>
                                </div>
                                <div className="bg-amber-100 p-3 rounded-full">
                                    <Percent className="w-6 h-6 text-amber-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Average Claim Value */}
                    <Card className="bg-white border-gray-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Avg Claim Value</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(metrics?.averageClaimValue || 0)}</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        ≈ {formatCurrency((metrics?.averageClaimValue || 0) * (feePercentage / 100))} fee each
                                    </p>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-full">
                                    <FileCheck className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Claim Status Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card className="bg-white border-gray-200">
                        <CardContent className="p-6 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mb-3">
                                <FileCheck className="w-6 h-6 text-emerald-600" />
                            </div>
                            <p className="text-3xl font-bold text-emerald-600">{metrics?.approvedClaims || 0}</p>
                            <p className="text-sm text-gray-600 mt-1">Approved Claims</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-gray-200">
                        <CardContent className="p-6 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mb-3">
                                <RefreshCw className="w-6 h-6 text-amber-600" />
                            </div>
                            <p className="text-3xl font-bold text-amber-600">{metrics?.pendingClaims || 0}</p>
                            <p className="text-sm text-gray-600 mt-1">Pending Claims</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-gray-200">
                        <CardContent className="p-6 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3">
                                <ArrowDownRight className="w-6 h-6 text-red-600" />
                            </div>
                            <p className="text-3xl font-bold text-red-600">{metrics?.deniedClaims || 0}</p>
                            <p className="text-sm text-gray-600 mt-1">Denied Claims</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue by Month */}
                    <Card className="bg-white border-gray-200">
                        <CardHeader className="border-b border-gray-100">
                            <CardTitle className="text-base font-semibold text-gray-900 flex items-center">
                                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                                Revenue by Month
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {metrics?.revenueByMonth && metrics.revenueByMonth.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead className="text-xs font-semibold text-gray-700">Month</TableHead>
                                            <TableHead className="text-xs font-semibold text-gray-700 text-right">Opside Revenue</TableHead>
                                            <TableHead className="text-xs font-semibold text-gray-700 text-right">Recovered</TableHead>
                                            <TableHead className="text-xs font-semibold text-gray-700 text-right">Claims</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {metrics.revenueByMonth.slice(0, 6).map((row) => (
                                            <TableRow key={row.month}>
                                                <TableCell className="text-sm text-gray-900 font-medium">{row.month}</TableCell>
                                                <TableCell className="text-sm text-emerald-600 font-semibold text-right">{formatCurrency(row.revenue)}</TableCell>
                                                <TableCell className="text-sm text-gray-600 text-right">{formatCurrency(row.recovered)}</TableCell>
                                                <TableCell className="text-sm text-gray-600 text-right">{row.claims}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="p-6 text-center text-gray-500 text-sm">No monthly data available</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Revenue by Claim Type */}
                    <Card className="bg-white border-gray-200">
                        <CardHeader className="border-b border-gray-100">
                            <CardTitle className="text-base font-semibold text-gray-900 flex items-center">
                                <PieChart className="w-5 h-5 mr-2 text-purple-600" />
                                Revenue by Claim Type
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {metrics?.revenueByClaimType && metrics.revenueByClaimType.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead className="text-xs font-semibold text-gray-700">Type</TableHead>
                                            <TableHead className="text-xs font-semibold text-gray-700 text-right">Revenue</TableHead>
                                            <TableHead className="text-xs font-semibold text-gray-700 text-right">Claims</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {metrics.revenueByClaimType.slice(0, 8).map((row) => (
                                            <TableRow key={row.type}>
                                                <TableCell className="text-sm text-gray-900">{row.type}</TableCell>
                                                <TableCell className="text-sm text-emerald-600 font-semibold text-right">{formatCurrency(row.revenue)}</TableCell>
                                                <TableCell className="text-sm text-gray-600 text-right">{row.claims}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="p-6 text-center text-gray-500 text-sm">No type data available</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Top Customers */}
                <Card className="bg-white border-gray-200">
                    <CardHeader className="border-b border-gray-100">
                        <CardTitle className="text-base font-semibold text-gray-900 flex items-center">
                            <Users className="w-5 h-5 mr-2 text-blue-600" />
                            Top Revenue by Customer
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {metrics?.revenueByCustomer && metrics.revenueByCustomer.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="text-xs font-semibold text-gray-700">Customer ID</TableHead>
                                        <TableHead className="text-xs font-semibold text-gray-700 text-right">Opside Revenue</TableHead>
                                        <TableHead className="text-xs font-semibold text-gray-700 text-right">Total Recovered</TableHead>
                                        <TableHead className="text-xs font-semibold text-gray-700 text-right">Claims</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {metrics.revenueByCustomer.slice(0, 10).map((row, i) => (
                                        <TableRow key={row.seller_id}>
                                            <TableCell className="text-sm text-gray-900 font-mono">
                                                <div className="flex items-center">
                                                    <Badge variant="outline" className="mr-2 text-xs">#{i + 1}</Badge>
                                                    {row.seller_id?.slice(0, 12)}...
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-emerald-600 font-semibold text-right">{formatCurrency(row.revenue)}</TableCell>
                                            <TableCell className="text-sm text-gray-600 text-right">{formatCurrency(row.recovered)}</TableCell>
                                            <TableCell className="text-sm text-gray-600 text-right">{row.claims}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="p-6 text-center text-gray-500 text-sm">No customer data available</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}
