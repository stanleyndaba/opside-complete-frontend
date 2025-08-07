import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon, ArrowRightIcon, DollarSignIcon } from 'lucide-react';
import { CurrencyPair, formatDate } from '@/utils/stocksApi';
import { cn } from '@/lib/utils';
interface CurrencyExchangeProps {
  currencies: CurrencyPair[];
  className?: string;
}
export function CurrencyExchange({
  currencies,
  className
}: CurrencyExchangeProps) {
  return <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          <DollarSignIcon className="h-5 w-5 mr-2" />
          Currency Exchange
        </CardTitle>
      </CardHeader>
      
    </Card>;
}