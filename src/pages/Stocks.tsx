
import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { mockStocks, generatePriceHistory } from '@/utils/stocksApi';
import { StockCard } from '@/components/stocks/StockCard';
import { StockChart } from '@/components/stocks/StockChart';
import { useQuery } from '@tanstack/react-query';
import { fetchStocks, adjustStock, reconcileStock } from '@/services/stocks';
import { Skeleton } from '@/components/ui/skeleton';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notify } from '@/lib/notify';

const Stocks = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['stocks'],
    queryFn: fetchStocks,
    retry: 2,
  });
  
  const adjust = useMutation({
    mutationFn: ({ symbol, delta }: { symbol: string; delta: number }) => adjustStock(symbol, delta),
    onMutate: async ({ symbol, delta }) => {
      await queryClient.cancelQueries({ queryKey: ['stocks'] });
      const previous = queryClient.getQueryData<any[]>(['stocks']);
      if (previous) {
        queryClient.setQueryData<any[]>(['stocks'], previous.map(s => s.symbol === symbol ? { ...s, price: Number((s.price + delta).toFixed(2)) } : s));
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['stocks'], ctx.previous);
      notify.error('Adjustment failed');
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<any[]>(['stocks'], (prev) => (prev || []).map(s => s.symbol === updated.symbol ? updated : s));
      notify.success('Adjusted');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['stocks'] })
  });

  const reconcile = useMutation({
    mutationFn: ({ symbol, price }: { symbol: string; price: number }) => reconcileStock(symbol, price),
    onMutate: async ({ symbol, price }) => {
      await queryClient.cancelQueries({ queryKey: ['stocks'] });
      const previous = queryClient.getQueryData<any[]>(['stocks']);
      if (previous) {
        queryClient.setQueryData<any[]>(['stocks'], previous.map(s => s.symbol === symbol ? { ...s, price } : s));
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['stocks'], ctx.previous);
      notify.error('Reconcile failed');
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<any[]>(['stocks'], (prev) => (prev || []).map(s => s.symbol === updated.symbol ? updated : s));
      notify.success('Reconciled');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['stocks'] })
  });

  const stocks = (isError || !data || data.length === 0) ? mockStocks : data;
  const [selectedStock, setSelectedStock] = React.useState(stocks[0]);

  React.useEffect(() => {
    if (!selectedStock && stocks.length > 0) {
      setSelectedStock(stocks[0]);
    } else if (selectedStock && !stocks.find(s => s.symbol === selectedStock.symbol)) {
      setSelectedStock(stocks[0]);
    }
  }, [stocks, selectedStock]);

  const stocksWithHistory = stocks.map(stock => {
    return {
      ...stock,
      priceHistory: generatePriceHistory(30, stock.price, 2)
    };
  });

  return (
    <PageLayout title="Stocks">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold">All Stocks</h2>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {stocksWithHistory.map((stock) => (
                <StockCard 
                  key={stock.symbol} 
                  stock={stock} 
                  priceHistory={stock.priceHistory}
                  onClick={() => setSelectedStock(stock)}
                  className={selectedStock && selectedStock.symbol === stock.symbol ? "ring-2 ring-primary" : ""}
                />
              ))}
            </div>
          )}
          {isError && (
            <div className="text-xs text-yellow-600">Showing mock data due to API error.</div>
          )}
        </div>
        
        <div className="lg:col-span-2 space-y-4">
          {selectedStock ? (
            <StockChart 
              symbol={selectedStock.symbol} 
              name={selectedStock.name} 
              currentPrice={selectedStock.price}
              volatility={2.5}
            />
          ) : (
            <div className="bg-card rounded-lg p-6 shadow text-sm text-muted-foreground">No stock selected.</div>
          )}
          {selectedStock && (
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs border rounded" onClick={() => adjust.mutate({ symbol: selectedStock.symbol, delta: 1 })}>+ $1</button>
              <button className="px-3 py-1 text-xs border rounded" onClick={() => adjust.mutate({ symbol: selectedStock.symbol, delta: -1 })}>- $1</button>
              <button className="px-3 py-1 text-xs border rounded" onClick={() => reconcile.mutate({ symbol: selectedStock.symbol, price: Number(selectedStock.price.toFixed(2)) })}>Reconcile</button>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-card rounded-lg p-4 shadow">
              <h3 className="font-medium text-sm text-muted-foreground">Market Cap</h3>
              <p className="text-xl font-semibold mt-1">
                ${(selectedStock.marketCap / 1000000000).toFixed(2)}B
              </p>
            </div>
            <div className="bg-card rounded-lg p-4 shadow">
              <h3 className="font-medium text-sm text-muted-foreground">Volume</h3>
              <p className="text-xl font-semibold mt-1">
                {(selectedStock.volume / 1000000).toFixed(2)}M
              </p>
            </div>
            <div className="bg-card rounded-lg p-4 shadow">
              <h3 className="font-medium text-sm text-muted-foreground">52W Range</h3>
              <p className="text-xl font-semibold mt-1">
                ${(selectedStock.price * 0.8).toFixed(2)} - ${(selectedStock.price * 1.2).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Stocks;
