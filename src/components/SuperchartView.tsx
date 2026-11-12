import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MarketSymbol,
  ChartTimeframe,
  ChartStyle,
  Candle,
  ChartLayout,
  IndicatorConfig,
  PriceAlert,
} from '../types/market';
import {
  generateOrderBook,
  generateTimeAndSales,
  calculateVolumeProfile,
  calculateBollingerBands,
  calculateVWAP,
} from '../data/mockMarketData';
import { OrderBookDOM } from './OrderBookDOM';
import { IndicatorModal } from './IndicatorModal';
import { AlertsModal } from './AlertsModal';
import {
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Maximize2,
  Share2,
  MousePointer,
  Minus,
  Activity,
  Layers,
  Ruler,
  Trash2,
  Camera,
  Bell,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Grid,
  Columns,
  Rows,
  Square,
  Crosshair,
  TrendingDown as TrendDownIcon,
  Check,
} from 'lucide-react';

interface SuperchartViewProps {
  symbol: MarketSymbol;
  symbols: MarketSymbol[];
  onSelectSymbol: (symbol: MarketSymbol) => void;
  onQuickTrade: (symbol: MarketSymbol, side: 'buy' | 'sell') => void;
  onOpenSearch: () => void;
}

export const SuperchartView: React.FC<SuperchartViewProps> = ({
  symbol,
  symbols,
  onSelectSymbol,
  onQuickTrade,
  onOpenSearch,
}) => {
  // Layout state
  const [layout, setLayout] = useState<ChartLayout>('1x1');
  const [activeCellIndex, setActiveCellIndex] = useState(0);

  // Multi-chart symbols assignment
  const [gridSymbols, setGridSymbols] = useState<MarketSymbol[]>([
    symbol,
    symbols.find((s) => s.symbol === 'NDX') || symbols[1] || symbol,
    symbols.find((s) => s.symbol === 'BTCUSD') || symbols[2] || symbol,
    symbols.find((s) => s.symbol === 'SPX') || symbols[3] || symbol,
  ]);

  // Keep grid symbol 0 in sync with active symbol
  useEffect(() => {
    setGridSymbols((prev) => {
      const next = [...prev];
      next[0] = symbol;
      return next;
    });
  }, [symbol]);

  // Chart preferences
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('1M');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('candle');
  const [showDOM, setShowDOM] = useState(false);
  const [showIndicatorModal, setShowIndicatorModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [snapshotToast, setSnapshotToast] = useState(false);

  // PRO Indicators Configuration
  const [indicators, setIndicators] = useState<IndicatorConfig>({
    showEMA20: true,
    showEMA50: false,
    showEMA200: false,
    showBollinger: false,
    showVWAP: true,
    showSupertrend: false,
    showVolumeProfile: true,
    showVolume: true,
    showRSI: true,
    showMACD: false,
  });

  // Drawing Tools
  const [activeDrawingTool, setActiveDrawingTool] = useState<
    'cursor' | 'line' | 'horizontal' | 'fibonacci' | 'risk-reward' | 'ruler'
  >('cursor');
  const [userDrawings, setUserDrawings] = useState<any[]>([]);

  // Replay Mode Simulation
  const [isReplayActive, setIsReplayActive] = useState(false);
  const [replayIndex, setReplayIndex] = useState<number | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);

  // Alerts
  const [alerts, setAlerts] = useState<PriceAlert[]>([
    {
      id: 'al-1',
      symbol: symbol.symbol,
      targetPrice: Number((symbol.price * 1.05).toFixed(2)),
      condition: 'above',
      active: true,
      createdAt: Date.now(),
      note: 'Resistance breakout target',
    },
  ]);

  // Active chart symbol
  const currentChartSymbol = gridSymbols[activeCellIndex] || symbol;

  // Real-time Level 2 Order Book & Time & Sales
  const [orderBook, setOrderBook] = useState(() => generateOrderBook(currentChartSymbol.price));
  const [timeAndSales, setTimeAndSales] = useState(() => generateTimeAndSales(currentChartSymbol.price));

  useEffect(() => {
    setOrderBook(generateOrderBook(currentChartSymbol.price));
    setTimeAndSales(generateTimeAndSales(currentChartSymbol.price));
  }, [currentChartSymbol.price]);

  // Interactive crosshair state
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Base candles
  const rawCandles = currentChartSymbol.candles || [];
  const baseCandles = useMemo(() => {
    if (timeframe === '1D') return rawCandles.slice(-15);
    if (timeframe === '5D') return rawCandles.slice(-25);
    if (timeframe === '1M') return rawCandles.slice(-45);
    return rawCandles;
  }, [rawCandles, timeframe]);

  // Candles in replay mode or standard mode
  const candles = useMemo(() => {
    if (isReplayActive && replayIndex !== null) {
      return baseCandles.slice(0, Math.max(5, replayIndex));
    }
    return baseCandles;
  }, [baseCandles, isReplayActive, replayIndex]);

  // Replay automated ticker
  useEffect(() => {
    let timer: any;
    if (isReplayActive && isReplaying) {
      timer = setInterval(() => {
        setReplayIndex((prev) => {
          const cur = prev ?? 10;
          if (cur >= baseCandles.length) {
            setIsReplaying(false);
            return baseCandles.length;
          }
          return cur + 1;
        });
      }, 700);
    }
    return () => clearInterval(timer);
  }, [isReplayActive, isReplaying, baseCandles.length]);

  // Mathematical Technical Indicators calculations
  const ema20 = useMemo(() => {
    const k = 2 / (10 + 1);
    let ema = candles[0]?.close || 0;
    return candles.map((c) => {
      ema = c.close * k + ema * (1 - k);
      return ema;
    });
  }, [candles]);

  const ema50 = useMemo(() => {
    const k = 2 / (20 + 1);
    let ema = candles[0]?.close || 0;
    return candles.map((c) => {
      ema = c.close * k + ema * (1 - k);
      return ema;
    });
  }, [candles]);

  const ema200 = useMemo(() => {
    const k = 2 / (50 + 1);
    let ema = candles[0]?.close || 0;
    return candles.map((c) => {
      ema = c.close * k + ema * (1 - k);
      return ema;
    });
  }, [candles]);

  const vwap = useMemo(() => calculateVWAP(candles), [candles]);
  const bollinger = useMemo(() => calculateBollingerBands(candles), [candles]);
  const volumeProfile = useMemo(() => calculateVolumeProfile(candles), [candles]);

  const rsiValues = useMemo(() => {
    const rsi: number[] = [];
    let avgGain = 0;
    let avgLoss = 0;
    for (let i = 0; i < candles.length; i++) {
      if (i === 0) {
        rsi.push(50);
        continue;
      }
      const change = candles[i].close - candles[i - 1].close;
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;
      if (i <= 14) {
        avgGain += gain / 14;
        avgLoss += loss / 14;
        rsi.push(50 + (gain - loss) * 4);
      } else {
        avgGain = (avgGain * 13 + gain) / 14;
        avgLoss = (avgLoss * 13 + loss) / 14;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const val = 100 - 100 / (1 + rs);
        rsi.push(Math.min(95, Math.max(5, val)));
      }
    }
    return rsi;
  }, [candles]);

  // MACD calculation
  const macdValues = useMemo(() => {
    const fastPeriod = 12;
    const slowPeriod = 26;
    const kFast = 2 / (fastPeriod + 1);
    const kSlow = 2 / (slowPeriod + 1);

    let fastEMA = candles[0]?.close || 0;
    let slowEMA = candles[0]?.close || 0;

    const macdLine = candles.map((c) => {
      fastEMA = c.close * kFast + fastEMA * (1 - kFast);
      slowEMA = c.close * kSlow + slowEMA * (1 - kSlow);
      return fastEMA - slowEMA;
    });

    const kSignal = 2 / (9 + 1);
    let signalEMA = macdLine[0] || 0;
    const signalLine = macdLine.map((m) => {
      signalEMA = m * kSignal + signalEMA * (1 - kSignal);
      return signalEMA;
    });

    const histogram = macdLine.map((m, i) => m - signalLine[i]);
    return { macdLine, signalLine, histogram };
  }, [candles]);

  // Scale Geometry
  const priceMin = Math.min(...candles.map((c) => c.low));
  const priceMax = Math.max(...candles.map((c) => c.high));
  const priceRange = priceMax - priceMin || 1;
  const paddingY = priceRange * 0.08;
  const scaleMin = priceMin - paddingY;
  const scaleMax = priceMax + paddingY;
  const scaleRange = scaleMax - scaleMin;

  const maxVolume = Math.max(...candles.map((c) => c.volume)) || 1;

  // Chart SVG Viewport Dimensions
  const chartHeight = 390;
  const rsiHeight = indicators.showRSI ? 85 : 0;
  const macdHeight = indicators.showMACD ? 85 : 0;
  const totalSvgHeight = chartHeight + rsiHeight + macdHeight;
  const chartWidth = 920;
  const priceAxisWidth = 72;
  const mainPlotWidth = chartWidth - priceAxisWidth;

  const candleStep = mainPlotWidth / Math.max(1, candles.length);
  const candleBarWidth = Math.max(3, Math.min(18, candleStep * 0.72));

  const getYForPrice = (p: number) => {
    return chartHeight - ((p - scaleMin) / scaleRange) * chartHeight;
  };

  const activeCandle: Candle =
    hoveredIndex !== null && candles[hoveredIndex]
      ? candles[hoveredIndex]
      : candles[candles.length - 1] || {
          time: '16:00',
          timestamp: Date.now(),
          open: currentChartSymbol.open,
          high: currentChartSymbol.high24h,
          low: currentChartSymbol.low24h,
          close: currentChartSymbol.price,
          volume: currentChartSymbol.volumeNumeric,
        };

  const isCurrentPositive = activeCandle.close >= activeCandle.open;
  const candleChange = activeCandle.close - activeCandle.open;
  const candleChangePct = (candleChange / (activeCandle.open || 1)) * 100;

  // Mouse Crosshair handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartContainerRef.current) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ratioX = (x / rect.width) * chartWidth;
    const ratioY = (y / rect.height) * totalSvgHeight;

    setMousePos({ x: ratioX, y: ratioY });

    const idx = Math.floor(ratioX / candleStep);
    if (idx >= 0 && idx < candles.length) {
      setHoveredIndex(idx);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setMousePos(null);
  };

  const handleChartClick = () => {
    if (!mousePos || mousePos.y > chartHeight) return;
    const clickedPrice = scaleMax - (mousePos.y / chartHeight) * scaleRange;

    if (activeDrawingTool === 'horizontal') {
      setUserDrawings((prev) => [
        ...prev,
        { id: `h-${Date.now()}`, type: 'horizontal', y: mousePos.y, price: clickedPrice },
      ]);
    } else if (activeDrawingTool === 'fibonacci') {
      setUserDrawings((prev) => [
        ...prev,
        {
          id: `fib-${Date.now()}`,
          type: 'fibonacci',
          highY: Math.max(30, mousePos.y - 120),
          lowY: Math.min(chartHeight - 30, mousePos.y + 120),
        },
      ]);
    } else if (activeDrawingTool === 'risk-reward') {
      setUserDrawings((prev) => [
        ...prev,
        {
          id: `rr-${Date.now()}`,
          type: 'risk-reward',
          entryY: mousePos.y,
          targetY: Math.max(20, mousePos.y - 80),
          stopY: Math.min(chartHeight - 20, mousePos.y + 40),
          x: mousePos.x,
        },
      ]);
    }
  };

  const handleCaptureSnapshot = () => {
    setSnapshotToast(true);
    setTimeout(() => setSnapshotToast(false), 2500);
  };

  return (
    <div className="flex flex-col bg-[#131722] border border-[#2a2e39] rounded-xl overflow-hidden shadow-2xl select-none">
      {/* 1. TradingView PRO Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#1e222d] border-b border-[#2a2e39] text-xs">
        {/* Symbol Quick Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#131722] hover:bg-[#262b36] rounded-md border border-[#2a2e39] text-[#f0f3fa] font-bold cursor-pointer transition-colors shadow-sm"
          >
            <span>{currentChartSymbol.symbol}</span>
            <span className="text-[10px] font-normal text-[#787b86] uppercase">
              {currentChartSymbol.exchange}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#787b86]" />
          </button>

          {/* PRO Badge */}
          <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold tracking-wider">
            PRO+
          </span>

          <div className="hidden sm:flex items-center gap-2 font-mono tabular-nums">
            <span className="text-base font-bold text-[#f0f3fa]">
              ${currentChartSymbol.price.toFixed(currentChartSymbol.category === 'forex' ? 4 : 2)}
            </span>
            <span
              className={`font-semibold flex items-center text-xs ${
                currentChartSymbol.changePercent >= 0 ? 'text-[#089981]' : 'text-[#f23645]'
              }`}
            >
              {currentChartSymbol.changePercent >= 0 ? '+' : ''}
              {currentChartSymbol.change.toFixed(2)} ({currentChartSymbol.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Timeframe Presets */}
        <div className="flex items-center bg-[#131722] p-0.5 rounded border border-[#2a2e39]">
          {(['1D', '5D', '1M', '3M', '1Y', 'ALL'] as ChartTimeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                timeframe === tf
                  ? 'bg-[#2962ff] text-white shadow-sm'
                  : 'text-[#787b86] hover:text-[#d1d4dc]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart Style Switcher */}
        <div className="hidden md:flex items-center bg-[#131722] p-0.5 rounded border border-[#2a2e39]">
          {(['candle', 'line', 'area'] as ChartStyle[]).map((style) => (
            <button
              key={style}
              onClick={() => setChartStyle(style)}
              className={`px-2 py-1 text-xs capitalize font-medium rounded cursor-pointer transition-colors ${
                chartStyle === style
                  ? 'bg-[#2a2e39] text-[#f0f3fa]'
                  : 'text-[#787b86] hover:text-[#d1d4dc]'
              }`}
            >
              {style}
            </button>
          ))}
        </div>

        {/* Indicators Trigger Button */}
        <button
          onClick={() => setShowIndicatorModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#131722] hover:bg-[#262b36] border border-[#2a2e39] rounded-md text-[#d1d4dc] font-semibold text-xs cursor-pointer transition-colors"
        >
          <Activity className="w-3.5 h-3.5 text-[#2962ff]" />
          <span>Indicators ({Object.values(indicators).filter(Boolean).length})</span>
        </button>

        {/* Multi-Chart Grid Layout Dropdown */}
        <div className="flex items-center bg-[#131722] p-0.5 rounded border border-[#2a2e39]">
          <button
            onClick={() => setLayout('1x1')}
            className={`p-1.5 rounded cursor-pointer transition-colors ${
              layout === '1x1' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
            title="Single Chart View"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLayout('1x2')}
            className={`p-1.5 rounded cursor-pointer transition-colors ${
              layout === '1x2' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
            title="2 Charts Split Horizontal"
          >
            <Columns className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLayout('2x1')}
            className={`p-1.5 rounded cursor-pointer transition-colors ${
              layout === '2x1' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
            title="2 Charts Split Vertical"
          >
            <Rows className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLayout('2x2')}
            className={`p-1.5 rounded cursor-pointer transition-colors ${
              layout === '2x2' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
            title="Quad 4-Chart Grid (PRO)"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Level 2 DOM & Utility Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowAlertsModal(true)}
            className="p-1.5 bg-[#131722] hover:bg-[#262b36] border border-[#2a2e39] rounded-md text-[#787b86] hover:text-[#f0f3fa] transition-colors cursor-pointer"
            title="Price Alerts"
          >
            <Bell className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={handleCaptureSnapshot}
            className="p-1.5 bg-[#131722] hover:bg-[#262b36] border border-[#2a2e39] rounded-md text-[#787b86] hover:text-[#f0f3fa] transition-colors cursor-pointer"
            title="Take Chart Snapshot"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowDOM(!showDOM)}
            className={`px-2.5 py-1.5 rounded-md border text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
              showDOM
                ? 'bg-[#2962ff] border-[#2962ff] text-white shadow-sm'
                : 'bg-[#131722] border-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc]'
            }`}
            title="Toggle Level 2 Depth of Market"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Level 2 DOM</span>
          </button>

          {/* Quick Buy / Sell */}
          <div className="hidden sm:flex items-center gap-1.5 ml-1">
            <button
              onClick={() => onQuickTrade(currentChartSymbol, 'buy')}
              className="px-3 py-1.5 bg-[#089981] hover:bg-[#067a67] text-white rounded-md font-bold text-xs transition-colors cursor-pointer shadow-sm"
            >
              BUY ${(currentChartSymbol.price + 0.05).toFixed(2)}
            </button>
            <button
              onClick={() => onQuickTrade(currentChartSymbol, 'sell')}
              className="px-3 py-1.5 bg-[#f23645] hover:bg-[#c92534] text-white rounded-md font-bold text-xs transition-colors cursor-pointer shadow-sm"
            >
              SELL ${(currentChartSymbol.price - 0.05).toFixed(2)}
            </button>
          </div>
        </div>
      </div>

      {/* Snapshot Toast notification */}
      {snapshotToast && (
        <div className="bg-[#089981] text-white text-xs px-4 py-2 font-semibold flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4" />
          <span>Chart Snapshot Captured to Clipboard! High-Res PNG Ready</span>
        </div>
      )}

      {/* HUD Info Header */}
      <div className="flex items-center justify-between px-4 py-1 bg-[#181b24] border-b border-[#2a2e39] text-[11px] text-[#787b86] font-mono tabular-nums overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-[#f0f3fa] font-bold">{currentChartSymbol.name}</span>
          <span>Time: <span className="text-[#d1d4dc]">{activeCandle.time}</span></span>
          <span>O: <span className="text-[#d1d4dc]">{activeCandle.open.toFixed(2)}</span></span>
          <span>H: <span className="text-[#d1d4dc]">{activeCandle.high.toFixed(2)}</span></span>
          <span>L: <span className="text-[#d1d4dc]">{activeCandle.low.toFixed(2)}</span></span>
          <span>
            C:{' '}
            <span className={isCurrentPositive ? 'text-[#089981] font-bold' : 'text-[#f23645] font-bold'}>
              {activeCandle.close.toFixed(2)}
            </span>
          </span>
          <span className={isCurrentPositive ? 'text-[#089981]' : 'text-[#f23645]'}>
            {candleChange >= 0 ? '+' : ''}{candleChange.toFixed(2)} ({candleChangePct >= 0 ? '+' : ''}{candleChangePct.toFixed(2)}%)
          </span>
          <span>Vol: <span className="text-[#d1d4dc]">{(activeCandle.volume / 1000).toFixed(1)}K</span></span>
        </div>

        {/* Active Indicators Legend */}
        <div className="hidden xl:flex items-center gap-3 shrink-0 text-[10px]">
          {indicators.showVWAP && <span className="text-purple-400 font-semibold">VWAP: {(vwap[hoveredIndex ?? vwap.length - 1] || currentChartSymbol.price).toFixed(2)}</span>}
          {indicators.showEMA20 && <span className="text-amber-400">EMA 20: {(ema20[hoveredIndex ?? ema20.length - 1] || currentChartSymbol.price).toFixed(2)}</span>}
          {indicators.showEMA50 && <span className="text-blue-400">EMA 50: {(ema50[hoveredIndex ?? ema50.length - 1] || currentChartSymbol.price).toFixed(2)}</span>}
          {indicators.showEMA200 && <span className="text-rose-400">EMA 200: {(ema200[hoveredIndex ?? ema200.length - 1] || currentChartSymbol.price).toFixed(2)}</span>}
          {indicators.showBollinger && <span className="text-sky-400">BB (20,2)</span>}
          {indicators.showVolumeProfile && <span className="text-orange-400">VPVR (POC)</span>}
        </div>
      </div>

      {/* Main Workspace Layout (Left Drawing Tools + Chart Canvas + Right DOM) */}
      <div className="flex flex-1 relative min-h-[490px]">
        {/* Left Drawing Toolbar */}
        <div className="w-11 bg-[#1e222d] border-r border-[#2a2e39] flex flex-col items-center py-2.5 gap-2 shrink-0 z-20">
          <button
            onClick={() => setActiveDrawingTool('cursor')}
            className={`p-2 rounded cursor-pointer transition-colors ${
              activeDrawingTool === 'cursor' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
            }`}
            title="Crosshair Cursor"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveDrawingTool('horizontal')}
            className={`p-2 rounded cursor-pointer transition-colors ${
              activeDrawingTool === 'horizontal' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
            }`}
            title="Horizontal Price Support/Resistance"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveDrawingTool('fibonacci')}
            className={`p-2 rounded cursor-pointer transition-colors ${
              activeDrawingTool === 'fibonacci' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
            }`}
            title="Fibonacci Retracement (0 - 1.0)"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveDrawingTool('risk-reward')}
            className={`p-2 rounded cursor-pointer transition-colors ${
              activeDrawingTool === 'risk-reward' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
            }`}
            title="Long/Short Position Risk-to-Reward Calculator"
          >
            <TrendingUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveDrawingTool('ruler')}
            className={`p-2 rounded cursor-pointer transition-colors ${
              activeDrawingTool === 'ruler' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
            }`}
            title="Measure Price & Bars"
          >
            <Ruler className="w-4 h-4" />
          </button>

          {userDrawings.length > 0 && (
            <button
              onClick={() => setUserDrawings([])}
              className="p-2 rounded text-[#f23645] hover:bg-[#f23645]/10 cursor-pointer mt-auto"
              title="Clear all drawings"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Center Chart Workspace (Supports Multi-Chart Grid Layouts!) */}
        <div className="flex-1 flex flex-col min-w-0">
          {layout === '1x1' ? (
            /* Single Primary Chart View */
            <div
              ref={chartContainerRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={handleChartClick}
              className="flex-1 relative cursor-crosshair overflow-hidden bg-[#131722]"
            >
              <svg
                viewBox={`0 0 ${chartWidth} ${totalSvgHeight}`}
                preserveAspectRatio="none"
                className="w-full h-full block"
              >
                <defs>
                  <linearGradient id="area-gradient-pro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2962ff" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2962ff" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
                  const y = chartHeight * ratio;
                  const gridPrice = scaleMax - ratio * scaleRange;
                  return (
                    <g key={ratio}>
                      <line
                        x1="0"
                        y1={y}
                        x2={mainPlotWidth}
                        y2={y}
                        stroke="#2a2e39"
                        strokeWidth="1"
                        strokeDasharray="2,3"
                      />
                      <text
                        x={mainPlotWidth + 8}
                        y={y + 3}
                        fill="#787b86"
                        fontSize="10"
                        fontFamily="JetBrains Mono"
                      >
                        {gridPrice.toFixed(2)}
                      </text>
                    </g>
                  );
                })}

                {/* Volume Profile (VPVR) Horizontal Histogram */}
                {indicators.showVolumeProfile && (
                  <g opacity="0.45">
                    {volumeProfile.map((vp, idx) => {
                      const y = getYForPrice(vp.price);
                      const barW = (vp.widthPercent / 100) * 110;
                      return (
                        <g key={`vp-${idx}`}>
                          <rect
                            x={mainPlotWidth - barW}
                            y={y - 8}
                            width={barW}
                            height="15"
                            fill={vp.isPOC ? '#f23645' : vp.inValueArea ? '#2962ff' : '#787b86'}
                            opacity={vp.isPOC ? 0.8 : 0.4}
                          />
                          {vp.isPOC && (
                            <line
                              x1="0"
                              y1={y}
                              x2={mainPlotWidth}
                              y2={y}
                              stroke="#f23645"
                              strokeWidth="1.5"
                              strokeDasharray="4,4"
                            />
                          )}
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* Bollinger Bands Shaded Cloud */}
                {indicators.showBollinger && (
                  <g>
                    <path
                      d={`${candles
                        .map((_, i) => {
                          const x = i * candleStep + candleStep / 2;
                          const y = getYForPrice(bollinger.upper[i]);
                          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                        })
                        .join(' ')} ${candles
                        .slice()
                        .reverse()
                        .map((_, i) => {
                          const origIdx = candles.length - 1 - i;
                          const x = origIdx * candleStep + candleStep / 2;
                          const y = getYForPrice(bollinger.lower[origIdx]);
                          return `L ${x} ${y}`;
                        })
                        .join(' ')} Z`}
                      fill="#0284c7"
                      fillOpacity="0.08"
                    />
                    <path
                      d={candles
                        .map((_, i) => {
                          const x = i * candleStep + candleStep / 2;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${getYForPrice(bollinger.upper[i])}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                      opacity={0.6}
                    />
                    <path
                      d={candles
                        .map((_, i) => {
                          const x = i * candleStep + candleStep / 2;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${getYForPrice(bollinger.lower[i])}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                      opacity={0.6}
                    />
                  </g>
                )}

                {/* Bottom Volume Bars */}
                {indicators.showVolume &&
                  candles.map((c, i) => {
                    const x = i * candleStep + candleStep / 2;
                    const volHeight = (c.volume / maxVolume) * 65;
                    const y = chartHeight - volHeight;
                    const isGreen = c.close >= c.open;
                    return (
                      <rect
                        key={`vol-${i}`}
                        x={x - candleBarWidth / 2}
                        y={y}
                        width={candleBarWidth}
                        height={volHeight}
                        fill={isGreen ? '#089981' : '#f23645'}
                        opacity={0.35}
                      />
                    );
                  })}

                {/* Primary Chart Rendering (Candle / Line / Area) */}
                {chartStyle === 'candle' &&
                  candles.map((c, i) => {
                    const x = i * candleStep + candleStep / 2;
                    const isGreen = c.close >= c.open;
                    const color = isGreen ? '#089981' : '#f23645';

                    const yOpen = getYForPrice(c.open);
                    const yClose = getYForPrice(c.close);
                    const yHigh = getYForPrice(c.high);
                    const yLow = getYForPrice(c.low);

                    const bodyTop = Math.min(yOpen, yClose);
                    const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

                    return (
                      <g key={`candle-${i}`}>
                        <line
                          x1={x}
                          y1={yHigh}
                          x2={x}
                          y2={yLow}
                          stroke={color}
                          strokeWidth="1.2"
                        />
                        <rect
                          x={x - candleBarWidth / 2}
                          y={bodyTop}
                          width={candleBarWidth}
                          height={bodyHeight}
                          fill={color}
                          stroke={color}
                          strokeWidth="0.5"
                        />
                      </g>
                    );
                  })}

                {chartStyle === 'line' && (
                  <path
                    d={candles
                      .map((c, i) => {
                        const x = i * candleStep + candleStep / 2;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${getYForPrice(c.close)}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#2962ff"
                    strokeWidth="2"
                  />
                )}

                {chartStyle === 'area' && (
                  <>
                    <path
                      d={`${candles
                        .map((c, i) => {
                          const x = i * candleStep + candleStep / 2;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${getYForPrice(c.close)}`;
                        })
                        .join(' ')} L ${mainPlotWidth} ${chartHeight} L 0 ${chartHeight} Z`}
                      fill="url(#area-gradient-pro)"
                    />
                    <path
                      d={candles
                        .map((c, i) => {
                          const x = i * candleStep + candleStep / 2;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${getYForPrice(c.close)}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke="#2962ff"
                      strokeWidth="2"
                    />
                  </>
                )}

                {/* VWAP Overlay Curve */}
                {indicators.showVWAP && (
                  <path
                    d={vwap
                      .map((val, i) => {
                        const x = i * candleStep + candleStep / 2;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${getYForPrice(val)}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#c084fc"
                    strokeWidth="1.8"
                  />
                )}

                {/* EMA 20 Overlay */}
                {indicators.showEMA20 && (
                  <path
                    d={ema20
                      .map((val, i) => {
                        const x = i * candleStep + candleStep / 2;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${getYForPrice(val)}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                  />
                )}

                {/* EMA 50 Overlay */}
                {indicators.showEMA50 && (
                  <path
                    d={ema50
                      .map((val, i) => {
                        const x = i * candleStep + candleStep / 2;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${getYForPrice(val)}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth="1.5"
                  />
                )}

                {/* EMA 200 Overlay */}
                {indicators.showEMA200 && (
                  <path
                    d={ema200
                      .map((val, i) => {
                        const x = i * candleStep + candleStep / 2;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${getYForPrice(val)}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="1.8"
                  />
                )}

                {/* Interactive Risk:Reward Tool Box */}
                {userDrawings
                  .filter((d) => d.type === 'risk-reward')
                  .map((rr) => {
                    const targetHeight = Math.abs(rr.entryY - rr.targetY);
                    const stopHeight = Math.abs(rr.stopY - rr.entryY);
                    const ratio = (targetHeight / (stopHeight || 1)).toFixed(2);

                    return (
                      <g key={rr.id}>
                        {/* Target Box (Green) */}
                        <rect
                          x={rr.x - 70}
                          y={rr.targetY}
                          width="140"
                          height={targetHeight}
                          fill="#089981"
                          fillOpacity="0.2"
                          stroke="#089981"
                          strokeWidth="1"
                        />
                        {/* Stop Loss Box (Red) */}
                        <rect
                          x={rr.x - 70}
                          y={rr.entryY}
                          width="140"
                          height={stopHeight}
                          fill="#f23645"
                          fillOpacity="0.2"
                          stroke="#f23645"
                          strokeWidth="1"
                        />
                        {/* Entry Line */}
                        <line
                          x1={rr.x - 70}
                          y1={rr.entryY}
                          x2={rr.x + 70}
                          y2={rr.entryY}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <text
                          x={rr.x}
                          y={rr.entryY - 4}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="9"
                          fontFamily="JetBrains Mono"
                          fontWeight="bold"
                        >
                          Target R:R 1 : {ratio}
                        </text>
                      </g>
                    );
                  })}

                {/* Fibonacci Retracement Levels */}
                {userDrawings
                  .filter((d) => d.type === 'fibonacci')
                  .map((fib) => {
                    const diff = fib.lowY - fib.highY;
                    const ratios = [
                      { r: 0.0, label: '0.0% ($)', color: '#94a3b8' },
                      { r: 0.236, label: '23.6%', color: '#38bdf8' },
                      { r: 0.382, label: '38.2%', color: '#4ade80' },
                      { r: 0.5, label: '50.0%', color: '#facc15' },
                      { r: 0.618, label: '61.8% (Golden)', color: '#fb923c' },
                      { r: 0.786, label: '78.6%', color: '#f87171' },
                      { r: 1.0, label: '100.0%', color: '#c084fc' },
                    ];

                    return (
                      <g key={fib.id}>
                        {ratios.map((item) => {
                          const yLevel = fib.highY + diff * item.r;
                          return (
                            <g key={item.r}>
                              <line
                                x1="0"
                                y1={yLevel}
                                x2={mainPlotWidth}
                                y2={yLevel}
                                stroke={item.color}
                                strokeWidth="1"
                                strokeDasharray="3,3"
                              />
                              <text
                                x="10"
                                y={yLevel - 3}
                                fill={item.color}
                                fontSize="9"
                                fontFamily="JetBrains Mono"
                              >
                                Fib {item.label}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}

                {/* Horizontal price level user drawings */}
                {userDrawings
                  .filter((d) => d.type === 'horizontal')
                  .map((draw) => (
                    <g key={draw.id}>
                      <line
                        x1="0"
                        y1={draw.y}
                        x2={mainPlotWidth}
                        y2={draw.y}
                        stroke="#eab308"
                        strokeWidth="1.5"
                        strokeDasharray="4,4"
                      />
                      <rect
                        x={mainPlotWidth}
                        y={draw.y - 8}
                        width={priceAxisWidth}
                        height="16"
                        fill="#eab308"
                        rx="2"
                      />
                      <text
                        x={mainPlotWidth + 4}
                        y={draw.y + 4}
                        fill="#000000"
                        fontSize="9"
                        fontFamily="JetBrains Mono"
                        fontWeight="bold"
                      >
                        {draw.price?.toFixed(2)}
                      </text>
                    </g>
                  ))}

                {/* Current Price Marker */}
                {(() => {
                  const currentY = getYForPrice(currentChartSymbol.price);
                  return (
                    <g>
                      <line
                        x1="0"
                        y1={currentY}
                        x2={mainPlotWidth}
                        y2={currentY}
                        stroke="#2962ff"
                        strokeWidth="1"
                        strokeDasharray="3,3"
                      />
                      <rect
                        x={mainPlotWidth}
                        y={currentY - 10}
                        width={priceAxisWidth}
                        height="20"
                        fill="#2962ff"
                        rx="2"
                      />
                      <text
                        x={mainPlotWidth + 6}
                        y={currentY + 4}
                        fill="#ffffff"
                        fontSize="11"
                        fontFamily="JetBrains Mono"
                        fontWeight="bold"
                      >
                        {currentChartSymbol.price.toFixed(2)}
                      </text>
                    </g>
                  );
                })()}

                {/* Interactive Crosshair & Cursor HUD */}
                {mousePos && mousePos.x <= mainPlotWidth && (
                  <g>
                    <line
                      x1={mousePos.x}
                      y1="0"
                      x2={mousePos.x}
                      y2={totalSvgHeight}
                      stroke="#787b86"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                    {mousePos.y <= chartHeight && (
                      <>
                        <line
                          x1="0"
                          y1={mousePos.y}
                          x2={mainPlotWidth}
                          y2={mousePos.y}
                          stroke="#787b86"
                          strokeWidth="1"
                          strokeDasharray="2,2"
                        />
                        <rect
                          x={mainPlotWidth}
                          y={mousePos.y - 9}
                          width={priceAxisWidth}
                          height="18"
                          fill="#363c4e"
                          rx="2"
                        />
                        <text
                          x={mainPlotWidth + 6}
                          y={mousePos.y + 4}
                          fill="#f0f3fa"
                          fontSize="10"
                          fontFamily="JetBrains Mono"
                        >
                          {(scaleMax - (mousePos.y / chartHeight) * scaleRange).toFixed(2)}
                        </text>
                      </>
                    )}
                  </g>
                )}

                {/* RSI Sub-Panel */}
                {indicators.showRSI && (
                  <g transform={`translate(0, ${chartHeight})`}>
                    <line x1="0" y1="0" x2={chartWidth} y2="0" stroke="#2a2e39" strokeWidth="1" />
                    <rect x="0" y="0" width={chartWidth} height={rsiHeight} fill="#181b24" opacity={0.6} />
                    <line x1="0" y1={rsiHeight * 0.3} x2={mainPlotWidth} y2={rsiHeight * 0.3} stroke="#f23645" strokeWidth="0.8" strokeDasharray="2,2" opacity={0.7} />
                    <line x1="0" y1={rsiHeight * 0.7} x2={mainPlotWidth} y2={rsiHeight * 0.7} stroke="#089981" strokeWidth="0.8" strokeDasharray="2,2" opacity={0.7} />
                    <path
                      d={rsiValues
                        .map((val, i) => {
                          const x = i * candleStep + candleStep / 2;
                          const y = rsiHeight - (val / 100) * rsiHeight;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="1.5"
                    />
                    <text x="12" y="16" fill="#a855f7" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                      RSI (14): {(rsiValues[hoveredIndex ?? rsiValues.length - 1] || 50).toFixed(1)}
                    </text>
                  </g>
                )}

                {/* MACD Sub-Panel */}
                {indicators.showMACD && (
                  <g transform={`translate(0, ${chartHeight + rsiHeight})`}>
                    <line x1="0" y1="0" x2={chartWidth} y2="0" stroke="#2a2e39" strokeWidth="1" />
                    <rect x="0" y="0" width={chartWidth} height={macdHeight} fill="#131722" opacity={0.8} />
                    <line x1="0" y1={macdHeight / 2} x2={mainPlotWidth} y2={macdHeight / 2} stroke="#787b86" strokeWidth="0.5" strokeDasharray="2,2" />

                    {/* MACD Histogram */}
                    {macdValues.histogram.map((val, i) => {
                      const x = i * candleStep + candleStep / 2;
                      const h = Math.min(30, Math.abs(val) * 15);
                      const isPos = val >= 0;
                      const y = isPos ? macdHeight / 2 - h : macdHeight / 2;
                      return (
                        <rect
                          key={`macd-${i}`}
                          x={x - candleBarWidth / 2}
                          y={y}
                          width={candleBarWidth}
                          height={h}
                          fill={isPos ? '#089981' : '#f23645'}
                          opacity={0.7}
                        />
                      );
                    })}

                    {/* Signal Line */}
                    <path
                      d={macdValues.signalLine
                        .map((val, i) => {
                          const x = i * candleStep + candleStep / 2;
                          const y = macdHeight / 2 - val * 8;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="1.2"
                    />
                    <text x="12" y="16" fill="#2dd4bf" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                      MACD (12, 26, 9)
                    </text>
                  </g>
                )}
              </svg>
            </div>
          ) : (
            /* Multi-Chart Grid View (1x2, 2x1, or 2x2) */
            <div
              className={`flex-1 grid gap-1.5 p-1.5 bg-[#181b24] ${
                layout === '1x2'
                  ? 'grid-cols-2'
                  : layout === '2x1'
                  ? 'grid-rows-2'
                  : 'grid-cols-2 grid-rows-2'
              }`}
            >
              {(layout === '2x2' ? [0, 1, 2, 3] : [0, 1]).map((cellIdx) => {
                const cellSymbol = gridSymbols[cellIdx] || symbol;
                const isSelected = activeCellIndex === cellIdx;
                const isCellPos = cellSymbol.changePercent >= 0;

                return (
                  <div
                    key={`cell-${cellIdx}`}
                    onClick={() => {
                      setActiveCellIndex(cellIdx);
                      onSelectSymbol(cellSymbol);
                    }}
                    className={`bg-[#131722] rounded-lg border flex flex-col overflow-hidden relative cursor-pointer transition-all ${
                      isSelected ? 'border-[#2962ff] ring-1 ring-[#2962ff]' : 'border-[#2a2e39]'
                    }`}
                  >
                    {/* Cell Mini Header */}
                    <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e222d] border-b border-[#2a2e39] text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#f0f3fa]">{cellSymbol.symbol}</span>
                        <span className="text-[10px] text-[#787b86] uppercase font-mono">
                          {timeframe}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono tabular-nums">
                        <span className="font-bold text-[#f0f3fa]">
                          ${cellSymbol.price.toFixed(2)}
                        </span>
                        <span className={isCellPos ? 'text-[#089981]' : 'text-[#f23645]'}>
                          {isCellPos ? '+' : ''}{cellSymbol.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {/* Cell Chart Render */}
                    <div className="flex-1 p-2 flex items-center justify-center">
                      <svg viewBox="0 0 400 180" preserveAspectRatio="none" className="w-full h-full">
                        {cellSymbol.candles.slice(-25).map((c, i, arr) => {
                          const step = 400 / arr.length;
                          const x = i * step + step / 2;
                          const minP = Math.min(...arr.map((a) => a.low));
                          const maxP = Math.max(...arr.map((a) => a.high)) || 1;
                          const r = maxP - minP || 1;
                          const yO = 180 - ((c.open - minP) / r) * 160;
                          const yC = 180 - ((c.close - minP) / r) * 160;
                          const yH = 180 - ((c.high - minP) / r) * 160;
                          const yL = 180 - ((c.low - minP) / r) * 160;
                          const isG = c.close >= c.open;
                          const col = isG ? '#089981' : '#f23645';

                          return (
                            <g key={`mc-${i}`}>
                              <line x1={x} y1={yH} x2={x} y2={yL} stroke={col} strokeWidth="1" />
                              <rect
                                x={x - 4}
                                y={Math.min(yO, yC)}
                                width="8"
                                height={Math.max(2, Math.abs(yC - yO))}
                                fill={col}
                              />
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Replay Mode Control Bar */}
          {isReplayActive && (
            <div className="flex items-center justify-between px-4 py-2 bg-[#1e222d] border-t border-[#2a2e39] text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-400">BAR REPLAY MODE:</span>
                <button
                  onClick={() => setIsReplaying(!isReplaying)}
                  className="p-1.5 bg-[#2962ff] text-white rounded cursor-pointer"
                >
                  {isReplaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setReplayIndex((prev) => Math.min(baseCandles.length, (prev ?? 10) + 1))}
                  className="p-1.5 bg-[#131722] hover:bg-[#262b36] text-[#d1d4dc] rounded border border-[#2a2e39] cursor-pointer"
                  title="Step 1 bar forward"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setReplayIndex(10);
                    setIsReplaying(false);
                  }}
                  className="p-1.5 bg-[#131722] hover:bg-[#262b36] text-[#d1d4dc] rounded border border-[#2a2e39] cursor-pointer"
                  title="Reset Replay"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-3 text-[#787b86] font-mono text-[11px]">
                <span>
                  Bar {replayIndex ?? baseCandles.length} of {baseCandles.length}
                </span>
                <button
                  onClick={() => setIsReplayActive(false)}
                  className="text-xs text-[#f23645] hover:underline cursor-pointer"
                >
                  Exit Replay
                </button>
              </div>
            </div>
          )}

          {/* Bottom Bar: Timeline presets & Replay trigger */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#1e222d] border-t border-[#2a2e39] text-xs text-[#787b86]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsReplayActive(!isReplayActive);
                  setReplayIndex(baseCandles.length - 15);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-semibold cursor-pointer transition-colors ${
                  isReplayActive
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-[#131722] border-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc]'
                }`}
              >
                <Play className="w-3 h-3" />
                <span>Bar Replay (Backtest)</span>
              </button>

              <div className="hidden sm:flex items-center gap-1 font-mono text-[11px]">
                <span>Drawings: {userDrawings.length} Active</span>
                <span className="text-[#2a2e39]">|</span>
                <span>Direct Exchange DMA Tape</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-[#089981] font-semibold">● PRO Feeds Active (0.2s)</span>
              <span className="font-mono">UTC-5</span>
            </div>
          </div>
        </div>

        {/* Right Collapsible Level 2 DOM & Time & Sales */}
        {showDOM && (
          <OrderBookDOM
            symbol={currentChartSymbol}
            orderBook={orderBook}
            timeAndSales={timeAndSales}
            onPlaceLimitOrder={(price, side) => {
              onQuickTrade(currentChartSymbol, side);
            }}
          />
        )}
      </div>

      {/* Indicator Suite Modal */}
      <IndicatorModal
        isOpen={showIndicatorModal}
        onClose={() => setShowIndicatorModal(false)}
        config={indicators}
        onChangeConfig={setIndicators}
      />

      {/* Price Alerts Modal */}
      <AlertsModal
        isOpen={showAlertsModal}
        onClose={() => setShowAlertsModal(false)}
        activeSymbol={currentChartSymbol}
        alerts={alerts}
        onAddAlert={(newAl) =>
          setAlerts((prev) => [
            { ...newAl, id: `al-${Date.now()}`, createdAt: Date.now() },
            ...prev,
          ])
        }
        onDeleteAlert={(id) => setAlerts((prev) => prev.filter((a) => a.id !== id))}
        onToggleAlert={(id) =>
          setAlerts((prev) =>
            prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
          )
        }
      />
    </div>
  );
};
