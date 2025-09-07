import { apiRequest } from "@/lib/api";
import { Stock, StockDto, transformStock } from "@/lib/types";

export async function fetchStocks(): Promise<Stock[]> {
  const data = await apiRequest<StockDto[]>("/stocks");
  return data.map(transformStock);
}

