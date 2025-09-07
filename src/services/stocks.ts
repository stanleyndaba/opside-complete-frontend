import { apiRequest } from "@/lib/api";
import { Stock, StockDto, transformStock } from "@/lib/types";

export async function fetchStocks(): Promise<Stock[]> {
  const data = await apiRequest<StockDto[]>("/stocks");
  return data.map(transformStock);
}

export async function adjustStock(symbol: string, delta: number): Promise<Stock> {
  const dto = await apiRequest<StockDto>(`/stocks/${symbol}/adjust`, { method: 'POST', body: JSON.stringify({ delta }) });
  return transformStock(dto);
}

export async function reconcileStock(symbol: string, price: number): Promise<Stock> {
  const dto = await apiRequest<StockDto>(`/stocks/${symbol}/reconcile`, { method: 'POST', body: JSON.stringify({ price }) });
  return transformStock(dto);
}

