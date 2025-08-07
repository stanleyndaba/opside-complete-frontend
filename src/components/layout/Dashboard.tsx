import React, { useState } from 'react';
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
              <h1 className="text-4xl font-bold text-muted-foreground">Central Hub</h1>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Last sync: 9:38:37 PM</div>
                <div className="text-sm text-primary font-medium">All systems operational</div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Section - Total Capital Guaranteed */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-sm text-muted-foreground mb-2">Total Capital Guaranteed</h2>
                  <div className="text-5xl font-bold mb-6">$12,475.50</div>
                  
                  {/* Upcoming Payments */}
                  <div className="rounded-lg p-4 bg-white/30">
                    <div className="flex items-center gap-2 mb-4">
                      
                      <span className="text-sm font-medium text-muted-foreground">UPCOMING PAYMENTS</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Expected Next Payment: July 2, 2025:</span>
                        <span className="font-semibold">$3,150.00</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Following Payment: August 3, 2025:</span>
                        <span className="font-semibold">$2,890.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section - Stats */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm text-muted-foreground mb-2">Protected Asset Value</h3>
                  <div className="text-3xl font-bold">$215,000.00</div>
                </div>
                
                <div>
                  <h3 className="text-sm text-muted-foreground mb-2">Total Issues Resolved</h3>
                  <div className="text-3xl font-bold">42</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>;
}