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
          {Object.entries(groupedByRegion).map(([region, indices]) => {})}
        </div>
      </CardContent>
    </Card>;
}