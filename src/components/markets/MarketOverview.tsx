import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, GlobeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarketIndex, formatPercentage } from '@/utils/stocksApi';
interface MarketOverviewProps {
  indices: MarketIndex[];
  className?: string;
}
export function MarketOverview({
  indices,
  className
}: MarketOverviewProps) {
  const groupedByRegion = indices.reduce<Record<string, MarketIndex[]>>((acc, index) => {
    if (!acc[index.region]) {
      acc[index.region] = [];
    }
    acc[index.region].push(index);
    return acc;
  }, {});
  return <Card className={cn("overflow-hidden", className)}>
      
      <CardContent className="p-0">
        <div className="grid gap-0.5">
          {Object.entries(groupedByRegion).map(([region, indices]) => (
            <div key={region} className="p-4">
              <h3 className="font-semibold mb-2">{region}</h3>
              {indices.map(index => (
                <div key={index.symbol} className="flex justify-between items-center py-1">
                  <span className="text-sm">{index.name}</span>
                  <span className={cn("text-sm", index.changePercent > 0 ? "text-success" : "text-danger")}>
                    {formatPercentage(index.changePercent)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>;
}