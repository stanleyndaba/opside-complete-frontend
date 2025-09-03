import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  className?: string;
  valueClassName?: string;
  onClick?: () => void;
}
export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  trendLabel,
  className,
  valueClassName,
  onClick
}: StatsCardProps) {
  const formattedTrend = trend !== undefined ? trend > 0 ? `+${trend.toFixed(2)}%` : `${trend.toFixed(2)}%` : null;
  const isTrendPositive = trend !== undefined ? trend > 0 : null;
  return <Card className={cn("transition-all duration-300 hover:shadow-md overflow-hidden", onClick ? "cursor-pointer" : "", className)} onClick={onClick}>
      
      
    </Card>;
}