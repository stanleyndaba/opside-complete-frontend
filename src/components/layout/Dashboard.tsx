import React, { useState, useEffect } from 'react';
import { useStockData, useMarketIndices, useCurrencyPairs, mockStocks, mockIndices, mockCurrencies, mockNews, generatePriceHistory } from '@/utils/stocksApi';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { StockCard } from '@/components/stocks/StockCard';
import { StockChart } from '@/components/stocks/StockChart';
import { MarketOverview } from '@/components/markets/MarketOverview';
import { CurrencyExchange } from '@/components/currencies/CurrencyExchange';
import { NewsCard } from '@/components/news/NewsCard';
import { StatsCard } from '@/components/ui/StatsCard';
import { BarChart3, TrendingDown, TrendingUp, Wallet2 } from 'lucide-react';
export function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedStock, setSelectedStock] = useState(mockStocks[0]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Use our hooks to get real-time mock data
  const stocks = useStockData(mockStocks);
  const indices = useMarketIndices(mockIndices);
  const currencies = useCurrencyPairs(mockCurrencies);

  // Generate chart data for the selected stock
  const selectedStockHistory = generatePriceHistory(30, selectedStock.price, 2);

  // Generate chart data for stock cards
  const stocksWithHistory = stocks.map(stock => {
    return {
      ...stock,
      priceHistory: generatePriceHistory(30, stock.price, 2)
    };
  });

  // Calculate market statistics
  const gainers = stocks.filter(stock => stock.changePercent > 0);
  const losers = stocks.filter(stock => stock.changePercent < 0);
  const topGainer = [...stocks].sort((a, b) => b.changePercent - a.changePercent)[0];
  const topLoser = [...stocks].sort((a, b) => a.changePercent - b.changePercent)[0];
  const totalMarketCap = stocks.reduce((sum, stock) => sum + stock.marketCap, 0);
  const totalVolume = stocks.reduce((sum, stock) => sum + stock.volume, 0);
  // Real-time clock for last sync
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: 'numeric', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };
  return <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        
        <main className="flex-1 transition-all duration-300">
          <div className="container max-w-full p-4 lg:p-6 bg-white/30">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold text-blue-500 font-montserrat">Central Hub</h1>
              <div className="text-right">
                <div className="text-sm text-muted-foreground font-montserrat">Last sync: {formatTime(currentTime)}</div>
                <div className="text-sm text-primary font-medium font-montserrat">All systems operational</div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Section - Total Capital Guaranteed */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-sm text-muted-foreground mb-2 font-montserrat">Total Capital Guaranteed</h2>
                  <div className="text-5xl font-bold mb-6 font-montserrat">$12,475.50</div>
                  
                  {/* Upcoming Payments */}
                  <div className="rounded-lg p-4 bg-white/30 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm font-medium text-muted-foreground font-montserrat">📅 UPCOMING PAYMENTS</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground font-montserrat">Expected Next Payment: July 2, 2025:</span>
                        <span className="font-semibold font-montserrat">$3,150.00</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground font-montserrat">Following Payment: August 3, 2025:</span>
                        <span className="font-semibold font-montserrat">$2,890.00</span>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Claim Disputes */}
                  <div className="rounded-lg p-4 bg-blue-50 border border-blue-200">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-medium text-blue-700 font-montserrat">⚡ UPCOMING CLAIM DISPUTES</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-montserrat">3 Active</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-600 font-montserrat">FBA Fee Dispute - Case #FB123456:</span>
                        <span className="font-semibold text-blue-700 font-montserrat">$485.20</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-600 font-montserrat">Storage Fee Challenge - Case #ST789012:</span>
                        <span className="font-semibold text-blue-700 font-montserrat">$297.50</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-600 font-montserrat">Return Processing Fee - Case #RP345678:</span>
                        <span className="font-semibold text-blue-700 font-montserrat">$156.75</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section - Stats */}
              <div className="space-y-6">
                <div className="bg-white/50 rounded-lg p-4">
                  <h3 className="text-sm text-muted-foreground mb-2 font-montserrat">Protected Asset Value</h3>
                  <div className="text-3xl font-bold font-montserrat">$215,000.00</div>
                </div>
                
                <div className="bg-white/50 rounded-lg p-4">
                  <h3 className="text-sm text-muted-foreground mb-2 font-montserrat">Total Issues Resolved</h3>
                  <div className="text-3xl font-bold font-montserrat">42</div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-sm text-green-700 mb-2 font-montserrat">Money Recovered This Month</h3>
                  <div className="text-2xl font-bold text-green-800 font-montserrat">$8,425.30</div>
                  <div className="text-xs text-green-600 mt-1 font-montserrat">↑ 23% from last month</div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="text-sm text-orange-700 mb-2 font-montserrat">Pending Claims</h3>
                  <div className="text-2xl font-bold text-orange-800 font-montserrat">$2,185.45</div>
                  <div className="text-xs text-orange-600 mt-1 font-montserrat">Est. 5-7 days resolution</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>;
}