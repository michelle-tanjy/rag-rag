export type MarketCategory = 'all' | 'indices' | 'stocks' | 'crypto' | 'forex' | 'commodities' | 'bonds';

export type ChartTimeframe = '1D' | '5D' | '1M' | '3M' | '1Y' | '5Y' | 'ALL';

export type ChartStyle = 'candle' | 'line' | 'area' | 'heikin-ashi' | 'bars';

export interface Candle {
  time: string; // ISO string or format e.g. '09:30', '10:00'
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketSymbol {
  symbol: string;
  name: string;
  category: 'indices' | 'stocks' | 'crypto' | 'forex' | 'commodities' | 'bonds';
  sector?: string;
  exchange: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high24h: number;
  low24h: number;
  week52High: number;
  week52Low: number;
  volume: string;
  volumeNumeric: number;
  avgVolume: string;
  marketCap?: string;
  marketCapNumeric?: number;
  pe?: number;
  eps?: number;
  dividendYield?: number;
  beta?: number;
  rating: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';
  analystConsensus?: {
    buyCount: number;
    holdCount: number;
    sellCount: number;
    targetPrice: number;
    highTarget: number;
    lowTarget: number;
  };
  sparkline: number[];
  candles: Candle[];
  description: string;
}

export interface SectorItem {
  id: string;
  name: string;
  changePercent: number;
  marketCap: string;
  weight: number;
  topStock: string;
  topStockGain: number;
}

export interface EconomicEvent {
  id: string;
  time: string;
  date: string;
  country: string;
  flag: string;
  event: string;
  impact: 'High' | 'Medium' | 'Low';
  actual: string;
  forecast: string;
  previous: string;
  unit?: string;
}

export interface MarketNewsItem {
  id: string;
  title: string;
  source: string;
  timeAgo: string;
  category: 'Stock' | 'Crypto' | 'Macro' | 'Commodities' | 'Earnings';
  sentiment: 'bullish' | 'neutral' | 'bearish';
  relatedSymbols: string[];
  snippet: string;
  readTime: string;
}

export interface PaperTradePosition {
  id: string;
  symbol: string;
  name: string;
  side: 'buy' | 'sell';
  qty: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  timestamp: number;
}

export interface HeatmapItem {
  symbol: string;
  name: string;
  sector: string;
  marketCap: number; // in billions
  changePercent: number;
  price: number;
  volume: string;
}

export type ChartLayout = '1x1' | '1x2' | '2x1' | '2x2';

export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
  depthPercent: number;
}

export interface TimeAndSale {
  id: string;
  time: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
}

export interface VolumeProfileBar {
  price: number;
  volume: number;
  widthPercent: number;
  isPOC: boolean;
  inValueArea: boolean;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  active: boolean;
  createdAt: number;
  triggeredAt?: string;
  note?: string;
}

export interface IndicatorConfig {
  showEMA20: boolean;
  showEMA50: boolean;
  showEMA200: boolean;
  showBollinger: boolean;
  showVWAP: boolean;
  showSupertrend: boolean;
  showVolumeProfile: boolean;
  showVolume: boolean;
  showRSI: boolean;
  showMACD: boolean;
}

