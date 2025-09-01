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
  return <div className="min-h-screen flex flex-col h-screen overflow-hidden">
      <Navbar />
      
      <div className="flex-1 flex h-full overflow-hidden">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        
        <main className={`flex-1 transition-all duration-300 overflow-y-auto ${isSidebarCollapsed ? 'ml-16' : 'ml-56'}`}>
          <div className="container max-w-full p-4 lg:p-6 bg-white/30">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h1 className="font-montserrat text-zinc-500 text-2xl font-extrabold">Hey Mariana,</h1>
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
                  <h2 className="mb-2 font-montserrat text-sm font-bold text-black">Total Capital Guaranteed</h2>
                  <div className="text-5xl font-bold mb-6 font-montserrat">$12,475.50</div>
                  
                  {/* Upcoming Payments */}
                  <div className="rounded-lg p-4 mb-6 bg-indigo-50">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm font-montserrat text-black font-bold">Upcoming Payments</span>
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
                  <div className="rounded-lg p-4 border border-blue-200 bg-slate-50">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-blue-700 font-montserrat font-bold">Upcoming Claim Disputes</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-montserrat">3 Active</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-montserrat text-gray-700">FBA Fee Dispute - Case #FB123456:</span>
                        <span className="font-semibold text-blue-700 font-montserrat">$485.20</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-montserrat text-gray-900">Storage Fee Challenge - Case #ST789012:</span>
                        <span className="font-semibold text-blue-700 font-montserrat">$297.50</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-montserrat text-gray-900">Return Processing Fee - Case #RP345678:</span>
                        <span className="font-semibold text-blue-700 font-montserrat">$156.75</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section - Stats */}
              
            </div>
          </div>
        </main>
      </div>
    </div>;
}