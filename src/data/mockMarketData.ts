import { MarketSymbol, SectorItem, EconomicEvent, MarketNewsItem, HeatmapItem, Candle } from '../types/market';

// Helper to generate realistic candlestick data
export function generateCandleSeries(basePrice: number, points: number = 60, volatility: number = 0.012): Candle[] {
  const candles: Candle[] = [];
  let currentClose = basePrice * (1 - volatility * (points / 4));
  const now = Date.now();
  const stepMs = 15 * 60 * 1000; // 15-minute bars
  const startTime = now - points * stepMs;

  for (let i = 0; i < points; i++) {
    const timestamp = startTime + i * stepMs;
    const date = new Date(timestamp);
    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    // Deterministic pseudo-random seed to create smooth, natural market waves
    const sinWave = Math.sin(i / 5) * (basePrice * volatility * 0.8);
    const noise = (Math.sin(i * 1.7) * 0.5 + Math.cos(i * 0.9) * 0.5) * (basePrice * volatility);
    const trend = (i / points) * (basePrice * volatility * 1.2);
    
    const open = currentClose;
    let close = open + sinWave * 0.3 + noise * 0.4 + (trend * 0.1);
    close = Math.max(close, basePrice * 0.5);
    
    const high = Math.max(open, close) + Math.abs(noise * 0.5) + (basePrice * volatility * 0.2);
    const low = Math.min(open, close) - Math.abs(noise * 0.4) - (basePrice * volatility * 0.15);
    const volume = Math.floor(100000 + Math.abs(Math.sin(i * 2.3)) * 800000 + Math.abs(close - open) * 20000);

    candles.push({
      time: timeStr,
      timestamp,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    currentClose = close;
  }
  return candles;
}

// Generate Realistic Order Book Depth (Level 2 DOM)
export function generateOrderBook(currentPrice: number, levels: number = 10): {
  bids: { price: number; size: number; total: number; depthPercent: number }[];
  asks: { price: number; size: number; total: number; depthPercent: number }[];
  spread: number;
} {
  const tick = currentPrice > 1000 ? 1 : currentPrice > 100 ? 0.05 : 0.01;
  const spread = tick;
  const bestBid = currentPrice - spread / 2;
  const bestAsk = currentPrice + spread / 2;

  const bids = [];
  let bidTotal = 0;
  for (let i = 0; i < levels; i++) {
    const price = Number((bestBid - i * tick).toFixed(currentPrice > 100 ? 2 : 4));
    const size = Math.floor(50 + Math.random() * 800 + (levels - i) * 80);
    bidTotal += size;
    bids.push({ price, size, total: bidTotal, depthPercent: 0 });
  }

  const asks = [];
  let askTotal = 0;
  for (let i = 0; i < levels; i++) {
    const price = Number((bestAsk + i * tick).toFixed(currentPrice > 100 ? 2 : 4));
    const size = Math.floor(50 + Math.random() * 800 + (levels - i) * 80);
    askTotal += size;
    asks.push({ price, size, total: askTotal, depthPercent: 0 });
  }

  const maxTotal = Math.max(bidTotal, askTotal) || 1;
  bids.forEach((b) => (b.depthPercent = (b.total / maxTotal) * 100));
  asks.forEach((a) => (a.depthPercent = (a.total / maxTotal) * 100));

  return { bids, asks, spread };
}

// Generate Live Time and Sales Tape
export function generateTimeAndSales(currentPrice: number, count: number = 15) {
  const tape = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const time = new Date(now - i * 1800).toTimeString().split(' ')[0];
    const isBuy = Math.random() > 0.45;
    const offset = (Math.random() - 0.5) * (currentPrice * 0.001);
    const price = Number((currentPrice + offset).toFixed(currentPrice > 100 ? 2 : 4));
    const size = Math.floor(10 + Math.random() * 450);
    tape.push({
      id: `trade-${now}-${i}`,
      time,
      price,
      size,
      side: isBuy ? ('buy' as const) : ('sell' as const),
    });
  }
  return tape;
}

// Volume Profile (VPVR - Visible Range Volume Profile)
export function calculateVolumeProfile(candles: Candle[], bins: number = 18) {
  if (!candles.length) return [];
  const minPrice = Math.min(...candles.map((c) => c.low));
  const maxPrice = Math.max(...candles.map((c) => c.high));
  const binSize = (maxPrice - minPrice) / bins || 1;

  const profile = Array.from({ length: bins }, (_, i) => ({
    price: Number((minPrice + (i + 0.5) * binSize).toFixed(2)),
    volume: 0,
    widthPercent: 0,
    isPOC: false,
    inValueArea: false,
  }));

  candles.forEach((c) => {
    const avgPrice = (c.high + c.low + c.close) / 3;
    const binIdx = Math.min(bins - 1, Math.max(0, Math.floor((avgPrice - minPrice) / binSize)));
    profile[binIdx].volume += c.volume;
  });

  const maxVol = Math.max(...profile.map((p) => p.volume)) || 1;
  const totalVol = profile.reduce((sum, p) => sum + p.volume, 0);

  // Find Point of Control (POC - highest volume price)
  let pocIdx = 0;
  profile.forEach((p, i) => {
    p.widthPercent = (p.volume / maxVol) * 100;
    if (p.volume === maxVol) {
      pocIdx = i;
      p.isPOC = true;
    }
  });

  // 70% Value Area
  let accumulatedVol = profile[pocIdx].volume;
  profile[pocIdx].inValueArea = true;
  let upper = pocIdx + 1;
  let lower = pocIdx - 1;

  while (accumulatedVol < totalVol * 0.7 && (upper < bins || lower >= 0)) {
    const upperVol = upper < bins ? profile[upper].volume : -1;
    const lowerVol = lower >= 0 ? profile[lower].volume : -1;

    if (upperVol >= lowerVol && upper < bins) {
      accumulatedVol += profile[upper].volume;
      profile[upper].inValueArea = true;
      upper++;
    } else if (lower >= 0) {
      accumulatedVol += profile[lower].volume;
      profile[lower].inValueArea = true;
      lower--;
    } else {
      break;
    }
  }

  return profile;
}

// Calculate Bollinger Bands
export function calculateBollingerBands(candles: Candle[], period: number = 20, multiplier: number = 2) {
  const upper: number[] = [];
  const middle: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    const slice = candles.slice(Math.max(0, i - period + 1), i + 1);
    const avg = slice.reduce((sum, c) => sum + c.close, 0) / slice.length;
    const variance = slice.reduce((sum, c) => sum + Math.pow(c.close - avg, 2), 0) / slice.length;
    const stdDev = Math.sqrt(variance);

    middle.push(avg);
    upper.push(avg + stdDev * multiplier);
    lower.push(avg - stdDev * multiplier);
  }

  return { upper, middle, lower };
}

// Calculate VWAP (Volume Weighted Average Price)
export function calculateVWAP(candles: Candle[]) {
  let cumTypicalVol = 0;
  let cumVol = 0;
  return candles.map((c) => {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumTypicalVol += typicalPrice * c.volume;
    cumVol += c.volume;
    return cumVol === 0 ? typicalPrice : cumTypicalVol / cumVol;
  });
}


// Sparkline generator from candles
function extractSparkline(candles: Candle[]): number[] {
  return candles.map(c => c.close);
}

export const INITIAL_SYMBOLS: MarketSymbol[] = [
  // --- INDICES ---
  {
    symbol: 'SPX',
    name: 'S&P 500 Index',
    category: 'indices',
    exchange: 'Cboe',
    currency: 'USD',
    price: 5983.25,
    change: 42.80,
    changePercent: 0.72,
    open: 5948.10,
    high24h: 5991.40,
    low24h: 5942.30,
    week52High: 6025.50,
    week52Low: 4953.56,
    volume: '2.41B',
    volumeNumeric: 2410000000,
    avgVolume: '2.25B',
    pe: 27.4,
    rating: 'Strong Buy',
    analystConsensus: {
      buyCount: 38,
      holdCount: 12,
      sellCount: 2,
      targetPrice: 6250.00,
      highTarget: 6500.00,
      lowTarget: 5700.00,
    },
    candles: generateCandleSeries(5950, 60, 0.006),
    sparkline: [],
    description: 'The Standard and Poor\'s 500 is a stock market index tracking the stock performance of 500 of the largest companies listed on stock exchanges in the United States.',
  },
  {
    symbol: 'NDX',
    name: 'Nasdaq 100 Index',
    category: 'indices',
    exchange: 'Nasdaq',
    currency: 'USD',
    price: 21145.80,
    change: 228.60,
    changePercent: 1.09,
    open: 20950.10,
    high24h: 21190.50,
    low24h: 20925.30,
    week52High: 21280.00,
    week52Low: 16973.94,
    volume: '4.85B',
    volumeNumeric: 4850000000,
    avgVolume: '4.30B',
    pe: 31.8,
    rating: 'Strong Buy',
    candles: generateCandleSeries(20950, 60, 0.01),
    sparkline: [],
    description: 'The Nasdaq-100 is a stock market index made up of 101 equity securities issued by 100 of the largest non-financial companies listed on the Nasdaq.',
  },
  {
    symbol: 'DJI',
    name: 'Dow Jones Industrial Average',
    category: 'indices',
    exchange: 'NYSE',
    currency: 'USD',
    price: 43910.98,
    change: 175.40,
    changePercent: 0.40,
    open: 43780.20,
    high24h: 44020.10,
    low24h: 43710.00,
    week52High: 44486.72,
    week52Low: 37122.95,
    volume: '390M',
    volumeNumeric: 390000000,
    avgVolume: '360M',
    pe: 22.1,
    rating: 'Buy',
    candles: generateCandleSeries(43750, 60, 0.005),
    sparkline: [],
    description: 'The Dow Jones Industrial Average is a price-weighted measurement stock market index of 30 prominent companies listed on stock exchanges in the United States.',
  },
  {
    symbol: 'RUT',
    name: 'Russell 2000 Small Cap',
    category: 'indices',
    exchange: 'Russell',
    currency: 'USD',
    price: 2368.40,
    change: -14.20,
    changePercent: -0.60,
    open: 2385.00,
    high24h: 2392.30,
    low24h: 2360.10,
    week52High: 2442.70,
    week52Low: 1932.40,
    volume: '1.10B',
    volumeNumeric: 1100000000,
    avgVolume: '1.05B',
    pe: 29.5,
    rating: 'Neutral',
    candles: generateCandleSeries(2380, 60, 0.012),
    sparkline: [],
    description: 'The Russell 2000 Index is a small-cap stock market index that makes up the smallest 2,000 stocks in the Russell 3000 Index.',
  },

  // --- STOCKS ---
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    category: 'stocks',
    sector: 'Semiconductors',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 147.85,
    change: 4.65,
    changePercent: 3.25,
    open: 143.50,
    high24h: 149.20,
    low24h: 143.10,
    week52High: 149.76,
    week52Low: 45.01,
    volume: '54.2M',
    volumeNumeric: 54200000,
    avgVolume: '48.9M',
    marketCap: '$3.62T',
    marketCapNumeric: 3620,
    pe: 58.2,
    eps: 2.54,
    dividendYield: 0.03,
    beta: 1.68,
    rating: 'Strong Buy',
    analystConsensus: {
      buyCount: 42,
      holdCount: 3,
      sellCount: 1,
      targetPrice: 168.00,
      highTarget: 200.00,
      lowTarget: 135.00,
    },
    candles: generateCandleSeries(144, 60, 0.018),
    sparkline: [],
    description: 'NVIDIA Corporation designs graphics processing units (GPUs) for the gaming and professional markets, as well as system on a chip units (SoCs) for the mobile computing and automotive market. World leader in AI hardware.',
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    category: 'stocks',
    sector: 'Consumer Electronics',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 228.40,
    change: 2.15,
    changePercent: 0.95,
    open: 226.50,
    high24h: 229.10,
    low24h: 225.80,
    week52High: 237.23,
    week52Low: 164.08,
    volume: '42.8M',
    volumeNumeric: 42800000,
    avgVolume: '46.1M',
    marketCap: '$3.45T',
    marketCapNumeric: 3450,
    pe: 34.6,
    eps: 6.60,
    dividendYield: 0.44,
    beta: 1.05,
    rating: 'Buy',
    analystConsensus: {
      buyCount: 34,
      holdCount: 10,
      sellCount: 2,
      targetPrice: 248.00,
      highTarget: 275.00,
      lowTarget: 210.00,
    },
    candles: generateCandleSeries(226, 60, 0.01),
    sparkline: [],
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories, and sells a variety of related services including Apple Intelligence ecosystem.',
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    category: 'stocks',
    sector: 'Software Infrastructure',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 424.10,
    change: 5.30,
    changePercent: 1.27,
    open: 419.80,
    high24h: 426.00,
    low24h: 418.90,
    week52High: 468.35,
    week52Low: 366.50,
    volume: '18.4M',
    volumeNumeric: 18400000,
    avgVolume: '20.1M',
    marketCap: '$3.15T',
    marketCapNumeric: 3150,
    pe: 35.1,
    eps: 12.08,
    dividendYield: 0.78,
    beta: 1.12,
    rating: 'Strong Buy',
    analystConsensus: {
      buyCount: 39,
      holdCount: 4,
      sellCount: 0,
      targetPrice: 485.00,
      highTarget: 520.00,
      lowTarget: 440.00,
    },
    candles: generateCandleSeries(420, 60, 0.011),
    sparkline: [],
    description: 'Microsoft Corporation develops and supports software, services, devices and solutions worldwide. Its Productivity and Business Processes segment includes Office, LinkedIn, and Dynamics.',
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    category: 'stocks',
    sector: 'Automotive',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 342.90,
    change: 18.20,
    changePercent: 5.61,
    open: 326.00,
    high24h: 345.00,
    low24h: 324.50,
    week52High: 358.64,
    week52Low: 138.80,
    volume: '86.4M',
    volumeNumeric: 86400000,
    avgVolume: '72.0M',
    marketCap: '$1.09T',
    marketCapNumeric: 1090,
    pe: 92.4,
    eps: 3.71,
    dividendYield: 0.00,
    beta: 2.34,
    rating: 'Buy',
    analystConsensus: {
      buyCount: 22,
      holdCount: 16,
      sellCount: 9,
      targetPrice: 310.00,
      highTarget: 400.00,
      lowTarget: 185.00,
    },
    candles: generateCandleSeries(328, 60, 0.025),
    sparkline: [],
    description: 'Tesla, Inc. designs, develops, manufactures, sells, and leases electric vehicles, energy generation and storage systems, and offers services related to its products including Autonomous Robotaxi tech.',
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    category: 'stocks',
    sector: 'Internet Retail',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 211.80,
    change: 3.10,
    changePercent: 1.48,
    open: 209.10,
    high24h: 212.90,
    low24h: 208.50,
    week52High: 215.90,
    week52Low: 141.00,
    volume: '34.1M',
    volumeNumeric: 34100000,
    avgVolume: '38.4M',
    marketCap: '$2.22T',
    marketCapNumeric: 2220,
    pe: 43.8,
    eps: 4.83,
    dividendYield: 0.00,
    beta: 1.15,
    rating: 'Strong Buy',
    candles: generateCandleSeries(209, 60, 0.013),
    sparkline: [],
    description: 'Amazon.com, Inc. focuses on retail sale of consumer products and subscriptions through online and physical stores. AWS cloud computing infrastructure is the global enterprise standard.',
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc. (Class A)',
    category: 'stocks',
    sector: 'Internet Content & Info',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 182.20,
    change: -1.40,
    changePercent: -0.76,
    open: 183.80,
    high24h: 184.60,
    low24h: 181.50,
    week52High: 191.75,
    week52Low: 129.40,
    volume: '22.8M',
    volumeNumeric: 22800000,
    avgVolume: '24.5M',
    marketCap: '$2.26T',
    marketCapNumeric: 2260,
    pe: 24.1,
    eps: 7.56,
    dividendYield: 0.44,
    beta: 1.06,
    rating: 'Buy',
    candles: generateCandleSeries(184, 60, 0.012),
    sparkline: [],
    description: 'Alphabet Inc. provides various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America. It operates through Google Services, Google Cloud, and Other Bets.',
  },
  {
    symbol: 'META',
    name: 'Meta Platforms, Inc.',
    category: 'stocks',
    sector: 'Internet Content & Info',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 612.40,
    change: 8.90,
    changePercent: 1.47,
    open: 604.20,
    high24h: 615.80,
    low24h: 602.00,
    week52High: 639.80,
    week52Low: 325.20,
    volume: '14.2M',
    volumeNumeric: 14200000,
    avgVolume: '13.8M',
    marketCap: '$1.55T',
    marketCapNumeric: 1550,
    pe: 28.5,
    eps: 21.48,
    dividendYield: 0.33,
    beta: 1.22,
    rating: 'Strong Buy',
    candles: generateCandleSeries(604, 60, 0.015),
    sparkline: [],
    description: 'Meta Platforms, Inc. engages in the development of products that enable people to connect and share through mobile devices, personal computers, virtual reality headsets, and wearables.',
  },
  {
    symbol: 'AMD',
    name: 'Advanced Micro Devices, Inc.',
    category: 'stocks',
    sector: 'Semiconductors',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 139.60,
    change: 5.80,
    changePercent: 4.33,
    open: 134.10,
    high24h: 141.20,
    low24h: 133.50,
    week52High: 227.30,
    week52Low: 116.10,
    volume: '41.2M',
    volumeNumeric: 41200000,
    avgVolume: '36.5M',
    marketCap: '$226B',
    marketCapNumeric: 226,
    pe: 114.2,
    eps: 1.22,
    dividendYield: 0.00,
    beta: 1.74,
    rating: 'Buy',
    candles: generateCandleSeries(135, 60, 0.022),
    sparkline: [],
    description: 'Advanced Micro Devices, Inc. operates as a semiconductor company worldwide. It operates in four segments: Data Center, Client, Gaming, and Embedded.',
  },

  // --- CRYPTO ---
  {
    symbol: 'BTCUSD',
    name: 'Bitcoin / US Dollar',
    category: 'crypto',
    exchange: 'Coinbase',
    currency: 'USD',
    price: 94820.00,
    change: 3410.00,
    changePercent: 3.73,
    open: 91500.00,
    high24h: 95400.00,
    low24h: 90800.00,
    week52High: 99800.00,
    week52Low: 38500.00,
    volume: '$48.6B',
    volumeNumeric: 48600000000,
    avgVolume: '$42.1B',
    marketCap: '$1.87T',
    marketCapNumeric: 1870,
    rating: 'Strong Buy',
    candles: generateCandleSeries(92000, 60, 0.024),
    sparkline: [],
    description: 'Bitcoin is the first decentralized digital currency, without a central bank or single administrator, that can be sent from user to user on the peer-to-peer bitcoin network.',
  },
  {
    symbol: 'ETHUSD',
    name: 'Ethereum / US Dollar',
    category: 'crypto',
    exchange: 'Coinbase',
    currency: 'USD',
    price: 3440.50,
    change: 142.10,
    changePercent: 4.31,
    open: 3302.00,
    high24h: 3485.00,
    low24h: 3280.00,
    week52High: 4092.00,
    week52Low: 2150.00,
    volume: '$26.4B',
    volumeNumeric: 26400000000,
    avgVolume: '$22.0B',
    marketCap: '$414B',
    marketCapNumeric: 414,
    rating: 'Strong Buy',
    candles: generateCandleSeries(3310, 60, 0.026),
    sparkline: [],
    description: 'Ethereum is a decentralized open-source blockchain system that features smart contract functionality. Ether is the native cryptocurrency of the platform.',
  },
  {
    symbol: 'SOLUSD',
    name: 'Solana / US Dollar',
    category: 'crypto',
    exchange: 'Binance',
    currency: 'USD',
    price: 216.70,
    change: 14.80,
    changePercent: 7.33,
    open: 202.00,
    high24h: 221.40,
    low24h: 201.10,
    week52High: 259.90,
    week52Low: 54.20,
    volume: '$9.8B',
    volumeNumeric: 9800000000,
    avgVolume: '$7.4B',
    marketCap: '$102B',
    marketCapNumeric: 102,
    rating: 'Strong Buy',
    candles: generateCandleSeries(204, 60, 0.035),
    sparkline: [],
    description: 'Solana is a high-performance blockchain supporting builders around the world creating crypto apps that scale today. High throughput and sub-cent fees.',
  },

  // --- FOREX ---
  {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    category: 'forex',
    exchange: 'FXCM',
    currency: 'USD',
    price: 1.0542,
    change: -0.0031,
    changePercent: -0.29,
    open: 1.0573,
    high24h: 1.0588,
    low24h: 1.0520,
    week52High: 1.1214,
    week52Low: 1.0450,
    volume: '$410B',
    volumeNumeric: 410000000000,
    avgVolume: '$390B',
    rating: 'Neutral',
    candles: generateCandleSeries(1.056, 60, 0.003),
    sparkline: [],
    description: 'The EUR/USD currency pair quotes the value of the Euro in terms of the United States Dollar. It is the most heavily traded currency pair in the global foreign exchange market.',
  },
  {
    symbol: 'USDJPY',
    name: 'US Dollar / Japanese Yen',
    category: 'forex',
    exchange: 'FXCM',
    currency: 'JPY',
    price: 154.68,
    change: 0.82,
    changePercent: 0.53,
    open: 153.86,
    high24h: 155.10,
    low24h: 153.70,
    week52High: 161.95,
    week52Low: 140.25,
    volume: '$280B',
    volumeNumeric: 280000000000,
    avgVolume: '$260B',
    rating: 'Buy',
    candles: generateCandleSeries(154.0, 60, 0.004),
    sparkline: [],
    description: 'The USD/JPY currency pair indicates how many Japanese Yen are needed to purchase one U.S. Dollar. Major indicator of risk sentiment and interest rate differentials.',
  },
  {
    symbol: 'GBPUSD',
    name: 'British Pound / US Dollar',
    category: 'forex',
    exchange: 'FXCM',
    currency: 'USD',
    price: 1.2675,
    change: -0.0042,
    changePercent: -0.33,
    open: 1.2717,
    high24h: 1.2730,
    low24h: 1.2650,
    week52High: 1.3434,
    week52Low: 1.2300,
    volume: '$190B',
    volumeNumeric: 190000000000,
    avgVolume: '$180B',
    rating: 'Neutral',
    candles: generateCandleSeries(1.270, 60, 0.003),
    sparkline: [],
    description: 'The British Pound vs US Dollar (Cable) is one of the oldest traded currency pairs in the world.',
  },

  // --- COMMODITIES ---
  {
    symbol: 'XAUUSD',
    name: 'Gold (Spot)',
    category: 'commodities',
    exchange: 'COMEX',
    currency: 'USD',
    price: 2684.50,
    change: 18.30,
    changePercent: 0.69,
    open: 2666.20,
    high24h: 2692.10,
    low24h: 2661.00,
    week52High: 2790.15,
    week52Low: 1984.30,
    volume: '$84B',
    volumeNumeric: 84000000000,
    avgVolume: '$78B',
    rating: 'Strong Buy',
    candles: generateCandleSeries(2668, 60, 0.005),
    sparkline: [],
    description: 'Gold spot price quoted in US Dollars per troy ounce. Universal store of value and safe-haven reserve asset.',
  },
  {
    symbol: 'USOIL',
    name: 'Crude Oil WTI',
    category: 'commodities',
    exchange: 'NYMEX',
    currency: 'USD',
    price: 68.74,
    change: -1.15,
    changePercent: -1.65,
    open: 69.89,
    high24h: 70.40,
    low24h: 68.30,
    week52High: 87.67,
    week52Low: 65.27,
    volume: '$42B',
    volumeNumeric: 42000000000,
    avgVolume: '$46B',
    rating: 'Neutral',
    candles: generateCandleSeries(69.8, 60, 0.015),
    sparkline: [],
    description: 'West Texas Intermediate (WTI) crude oil benchmark price traded on the New York Mercantile Exchange.',
  },

  // --- BONDS ---
  {
    symbol: 'US10Y',
    name: 'US 10-Year Treasury Yield',
    category: 'bonds',
    exchange: 'Cboe',
    currency: '%',
    price: 4.418,
    change: 0.038,
    changePercent: 0.87,
    open: 4.380,
    high24h: 4.432,
    low24h: 4.375,
    week52High: 4.737,
    week52Low: 3.599,
    volume: '$120B',
    volumeNumeric: 120000000000,
    avgVolume: '$115B',
    rating: 'Neutral',
    candles: generateCandleSeries(4.38, 60, 0.008),
    sparkline: [],
    description: 'Yield on 10-year US Treasury notes. Serves as benchmark reference rate for mortgage loans, corporate debt, and equity discount cash flow models worldwide.',
  },
];

// Populate sparklines
INITIAL_SYMBOLS.forEach(s => {
  s.sparkline = extractSparkline(s.candles);
});

export const SECTORS_DATA: SectorItem[] = [
  { id: 'tech', name: 'Information Technology', changePercent: 2.14, marketCap: '$14.2T', weight: 31.4, topStock: 'NVDA', topStockGain: 3.25 },
  { id: 'comm', name: 'Communication Services', changePercent: 1.48, marketCap: '$4.8T', weight: 8.9, topStock: 'META', topStockGain: 1.47 },
  { id: 'disc', name: 'Consumer Discretionary', changePercent: 1.35, marketCap: '$4.9T', weight: 10.2, topStock: 'TSLA', topStockGain: 5.61 },
  { id: 'fin', name: 'Financials', changePercent: 0.62, marketCap: '$5.8T', weight: 13.1, topStock: 'JPM', topStockGain: 0.84 },
  { id: 'health', name: 'Health Care', changePercent: 0.28, marketCap: '$5.2T', weight: 11.8, topStock: 'LLY', topStockGain: 1.10 },
  { id: 'ind', name: 'Industrials', changePercent: -0.15, marketCap: '$3.7T', weight: 8.4, topStock: 'CAT', topStockGain: -0.32 },
  { id: 'staples', name: 'Consumer Staples', changePercent: -0.42, marketCap: '$2.8T', weight: 5.9, topStock: 'PG', topStockGain: -0.55 },
  { id: 'util', name: 'Utilities', changePercent: -0.68, marketCap: '$1.2T', weight: 2.4, topStock: 'NEE', topStockGain: -0.72 },
  { id: 'real', name: 'Real Estate', changePercent: -0.91, marketCap: '$1.0T', weight: 2.1, topStock: 'PLD', topStockGain: -1.14 },
  { id: 'energy', name: 'Energy', changePercent: -1.45, marketCap: '$1.7T', weight: 3.6, topStock: 'XOM', topStockGain: -1.62 },
];

export const HEATMAP_DATA: HeatmapItem[] = [
  // Tech
  { symbol: 'NVDA', name: 'NVIDIA', sector: 'Information Technology', marketCap: 3620, changePercent: 3.25, price: 147.85, volume: '54.2M' },
  { symbol: 'AAPL', name: 'Apple', sector: 'Information Technology', marketCap: 3450, changePercent: 0.95, price: 228.40, volume: '42.8M' },
  { symbol: 'MSFT', name: 'Microsoft', sector: 'Information Technology', marketCap: 3150, changePercent: 1.27, price: 424.10, volume: '18.4M' },
  { symbol: 'AVGO', name: 'Broadcom', sector: 'Information Technology', marketCap: 790, changePercent: 2.45, price: 168.20, volume: '11.2M' },
  { symbol: 'AMD', name: 'AMD', sector: 'Information Technology', marketCap: 226, changePercent: 4.33, price: 139.60, volume: '41.2M' },
  { symbol: 'CRM', name: 'Salesforce', sector: 'Information Technology', marketCap: 312, changePercent: 1.15, price: 326.50, volume: '6.4M' },
  { symbol: 'ORCL', name: 'Oracle', sector: 'Information Technology', marketCap: 480, changePercent: 2.80, price: 174.90, volume: '9.8M' },
  
  // Communication
  { symbol: 'GOOGL', name: 'Alphabet', sector: 'Communication Services', marketCap: 2260, changePercent: -0.76, price: 182.20, volume: '22.8M' },
  { symbol: 'META', name: 'Meta Platforms', sector: 'Communication Services', marketCap: 1550, changePercent: 1.47, price: 612.40, volume: '14.2M' },
  { symbol: 'NFLX', name: 'Netflix', sector: 'Communication Services', marketCap: 375, changePercent: 1.82, price: 868.00, volume: '3.6M' },

  // Consumer Discretionary
  { symbol: 'AMZN', name: 'Amazon', sector: 'Consumer Discretionary', marketCap: 2220, changePercent: 1.48, price: 211.80, volume: '34.1M' },
  { symbol: 'TSLA', name: 'Tesla', sector: 'Consumer Discretionary', marketCap: 1090, changePercent: 5.61, price: 342.90, volume: '86.4M' },
  { symbol: 'HD', name: 'Home Depot', sector: 'Consumer Discretionary', marketCap: 395, changePercent: 0.40, price: 402.10, volume: '4.1M' },

  // Financials
  { symbol: 'BRK.B', name: 'Berkshire', sector: 'Financials', marketCap: 980, changePercent: 0.35, price: 462.80, volume: '2.8M' },
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financials', marketCap: 685, changePercent: 0.84, price: 241.60, volume: '8.4M' },
  { symbol: 'V', name: 'Visa', sector: 'Financials', marketCap: 590, changePercent: 0.52, price: 308.20, volume: '5.2M' },
  { symbol: 'MA', name: 'Mastercard', sector: 'Financials', marketCap: 475, changePercent: 0.65, price: 518.70, volume: '3.1M' },

  // Healthcare
  { symbol: 'LLY', name: 'Eli Lilly', sector: 'Health Care', marketCap: 740, changePercent: 1.10, price: 785.40, volume: '3.2M' },
  { symbol: 'UNH', name: 'UnitedHealth', sector: 'Health Care', marketCap: 520, changePercent: -0.45, price: 568.20, volume: '2.9M' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Health Care', marketCap: 370, changePercent: -0.15, price: 154.30, volume: '6.1M' },

  // Energy & Industrials
  { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy', marketCap: 490, changePercent: -1.62, price: 119.40, volume: '14.5M' },
  { symbol: 'CVX', name: 'Chevron', sector: 'Energy', marketCap: 280, changePercent: -1.30, price: 158.10, volume: '7.8M' },
  { symbol: 'GE', name: 'GE Aerospace', sector: 'Industrials', marketCap: 195, changePercent: 0.85, price: 182.40, volume: '5.5M' },
  { symbol: 'CAT', name: 'Caterpillar', sector: 'Industrials', marketCap: 188, changePercent: -0.32, price: 388.50, volume: '2.4M' },
];

export const ECONOMIC_EVENTS: EconomicEvent[] = [
  {
    id: 'ev-1',
    time: '08:30 EST',
    date: 'Today',
    country: 'United States',
    flag: '🇺🇸',
    event: 'Core CPI Inflation (MoM)',
    impact: 'High',
    actual: '0.3%',
    forecast: '0.3%',
    previous: '0.3%',
    unit: '%',
  },
  {
    id: 'ev-2',
    time: '08:30 EST',
    date: 'Today',
    country: 'United States',
    flag: '🇺🇸',
    event: 'CPI Inflation Rate (YoY)',
    impact: 'High',
    actual: '2.6%',
    forecast: '2.6%',
    previous: '2.4%',
    unit: '%',
  },
  {
    id: 'ev-3',
    time: '14:00 EST',
    date: 'Today',
    country: 'United States',
    flag: '🇺🇸',
    event: 'Federal Reserve FOMC Minutes',
    impact: 'High',
    actual: 'Released',
    forecast: '-',
    previous: '-',
  },
  {
    id: 'ev-4',
    time: '04:00 GMT',
    date: 'Tomorrow',
    country: 'Eurozone',
    flag: '🇪🇺',
    event: 'ECB President Lagarde Speech',
    impact: 'Medium',
    actual: '-',
    forecast: '-',
    previous: '-',
  },
  {
    id: 'ev-5',
    time: '08:30 EST',
    date: 'Tomorrow',
    country: 'United States',
    flag: '🇺🇸',
    event: 'Initial Jobless Claims',
    impact: 'Medium',
    actual: '-',
    forecast: '215K',
    previous: '221K',
  },
  {
    id: 'ev-6',
    time: '23:30 JST',
    date: 'Friday',
    country: 'Japan',
    flag: '🇯🇵',
    event: 'Bank of Japan Policy Rate Decision',
    impact: 'High',
    actual: '-',
    forecast: '0.25%',
    previous: '0.25%',
  },
];

export const MARKET_NEWS: MarketNewsItem[] = [
  {
    id: 'news-1',
    title: 'NVIDIA Surges as AI Data Center Demand Accelerates Into Q4',
    source: 'Bloomberg Markets',
    timeAgo: '12m ago',
    category: 'Stock',
    sentiment: 'bullish',
    relatedSymbols: ['NVDA', 'AMD', 'MSFT'],
    snippet: 'Supply chain checks indicate Blackwell chip production yield is exceeding expectations with major hyperscalers expanding Capex guidance.',
    readTime: '3 min read',
  },
  {
    id: 'news-2',
    title: 'Bitcoin Consolidates Near All-Time Highs as ETF Net Inflows Top $1.2 Billion',
    source: 'CoinDesk',
    timeAgo: '34m ago',
    category: 'Crypto',
    sentiment: 'bullish',
    relatedSymbols: ['BTCUSD', 'ETHUSD', 'SOLUSD'],
    snippet: 'Institutional allocation via spot Bitcoin ETFs shows persistent multi-day positive net flows, sustaining bullish market structure.',
    readTime: '4 min read',
  },
  {
    id: 'news-3',
    title: 'Treasury Yields Stabilize Around 4.42% Following In-Line Consumer Price Index',
    source: 'Financial Times',
    timeAgo: '1h ago',
    category: 'Macro',
    sentiment: 'neutral',
    relatedSymbols: ['US10Y', 'SPX', 'EURUSD'],
    snippet: 'Federal Reserve interest rate swap markets now price in an 82% probability of a 25bps cut at the upcoming policy committee gathering.',
    readTime: '5 min read',
  },
  {
    id: 'news-4',
    title: 'Crude Oil Slumps 1.6% Under Pressure From OPEC+ Production Ramp Discussions',
    source: 'Reuters',
    timeAgo: '2h ago',
    category: 'Commodities',
    sentiment: 'bearish',
    relatedSymbols: ['USOIL', 'XOM', 'CVX'],
    snippet: 'WTI crude oil trades below $69 a barrel as refining margins tighten and global inventory draws moderate ahead of winter delivery contracts.',
    readTime: '3 min read',
  },
  {
    id: 'news-5',
    title: 'Tesla Rallies Past $340 as Autonomous Robotaxi Fleet Roadmap Gains Momentum',
    source: 'Wall Street Journal',
    timeAgo: '3h ago',
    category: 'Stock',
    sentiment: 'bullish',
    relatedSymbols: ['TSLA', 'RUT'],
    snippet: 'Wall Street analysts raise average price targets, citing potential regulatory tailwinds for commercial autonomous vehicle deployment in key metro areas.',
    readTime: '4 min read',
  },
];
