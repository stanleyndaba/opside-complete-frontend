export interface StockDto {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  lastUpdated: string | number;
}

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  lastUpdated: Date;
}

export function transformStock(dto: StockDto): Stock {
  return {
    ...dto,
    lastUpdated: new Date(dto.lastUpdated),
  };
}

