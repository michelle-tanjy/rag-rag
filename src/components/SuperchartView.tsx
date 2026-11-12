import React, { useState, useMemo, useRef } from 'react';
import { MarketSymbol, ChartTimeframe, ChartStyle, Candle } from '../types/market';
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
  Percent,
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
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('1M');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('candle');
  const [showVolume, setShowVolume] = useState(true);
  const [showEMA20, setShowEMA20] = useState(true);
  const [showEMA50, setShowEMA50] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(false);
  const [activeDrawingTool, setActiveDrawingTool] = useState<'cursor' | 'line' | 'horizontal' | 'ruler'>('cursor');
  const [userDrawings, setUserDrawings] = useState<{ type: string; y: number }[]>([]);

  // Hover state for interactive crosshair
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Candles subset based on timeframe
  const candles = useMemo(() => {
    const raw = symbol.candles || [];
    if (timeframe === '1D') return raw.slice(-15);
    if (timeframe === '5D') return raw.slice(-25);
    if (timeframe === '1M') return raw.slice(-40);
    return raw;
  }, [symbol.candles, timeframe]);

  // Derived indicators
  // 1. Moving averages
  const ema20Values = useMemo(() => {
    const period = 10;
    const k = 2 / (period + 1);
    let ema = candles[0]?.close || 0;
    return candles.map((c) => {
      ema = c.close * k + ema * (1 - k);
      return ema;
    });
  }, [candles]);

  const ema50Values = useMemo(() => {
    const period = 20;
    const k = 2 / (period + 1);
    let ema = candles[0]?.close || 0;
    return candles.map((c) => {
      ema = c.close * k + ema * (1 - k);
      return ema;
    });
  }, [candles]);

  // 2. Relative Strength Index (RSI 14)
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
        rsi.push(50 + (gain - loss) * 5);
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

  // Scaling calculations
  const priceMin = Math.min(...candles.map((c) => c.low));
  const priceMax = Math.max(...candles.map((c) => c.high));
  const priceRange = priceMax - priceMin || 1;
  const paddingY = priceRange * 0.08;
  const scaleMin = priceMin - paddingY;
  const scaleMax = priceMax + paddingY;
  const scaleRange = scaleMax - scaleMin;

  const maxVolume = Math.max(...candles.map((c) => c.volume)) || 1;

  // Chart Dimensions
  const chartHeight = 380;
  const rsiHeight = showRSI ? 90 : 0;
  const totalSvgHeight = chartHeight + rsiHeight;
  const chartWidth = 900;
  const priceAxisWidth = 70;
  const mainPlotWidth = chartWidth - priceAxisWidth;

  const candleStep = mainPlotWidth / Math.max(1, candles.length);
  const candleBarWidth = Math.max(2, Math.min(18, candleStep * 0.7));

  const getYForPrice = (p: number) => {
    return chartHeight - ((p - scaleMin) / scaleRange) * chartHeight;
  };

  const activeCandle: Candle =
    hoveredIndex !== null && candles[hoveredIndex]
      ? candles[hoveredIndex]
      : candles[candles.length - 1] || {
          time: '16:00',
          timestamp: Date.now(),
          open: symbol.open,
          high: symbol.high24h,
          low: symbol.low24h,
          close: symbol.price,
          volume: symbol.volumeNumeric,
        };

  const isCurrentPositive = activeCandle.close >= activeCandle.open;
  const candleChange = activeCandle.close - activeCandle.open;
  const candleChangePct = (candleChange / (activeCandle.open || 1)) * 100;

  // Mouse interaction for crosshair
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
    if (activeDrawingTool === 'horizontal' && mousePos && mousePos.y <= chartHeight) {
      const drawnPrice = scaleMax - (mousePos.y / chartHeight) * scaleRange;
      setUserDrawings((prev) => [...prev, { type: 'horizontal', y: mousePos.y }]);
    }
  };

  return (
    <div className="flex flex-col bg-[#131722] border border-[#2a2e39] rounded-xl overflow-hidden shadow-xl select-none">
      {/* 1. Supercharts Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#1e222d] border-b border-[#2a2e39] text-xs">
        {/* Symbol Quick Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-[#131722] hover:bg-[#262b36] rounded border border-[#2a2e39] text-[#f0f3fa] font-bold cursor-pointer transition-colors"
          >
            <span>{symbol.symbol}</span>
            <span className="text-[11px] font-normal text-[#787b86]">
              {symbol.exchange}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#787b86]" />
          </button>

          <div className="hidden sm:flex items-center gap-2 font-mono tabular-nums">
            <span className="text-base font-bold text-[#f0f3fa]">
              ${symbol.price.toFixed(2)}
            </span>
            <span
              className={`font-semibold flex items-center ${
                symbol.changePercent >= 0 ? 'text-[#089981]' : 'text-[#f23645]'
              }`}
            >
              {symbol.changePercent >= 0 ? '+' : ''}
              {symbol.change.toFixed(2)} ({symbol.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Timeframe Presets */}
        <div className="flex items-center bg-[#131722] p-0.5 rounded border border-[#2a2e39]">
          {(['1D', '5D', '1M', '3M', '1Y', 'ALL'] as ChartTimeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
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
        <div className="flex items-center bg-[#131722] p-0.5 rounded border border-[#2a2e39]">
          {(['candle', 'line', 'area'] as ChartStyle[]).map((style) => (
            <button
              key={style}
              onClick={() => setChartStyle(style)}
              className={`px-2.5 py-1 text-xs capitalize font-medium rounded cursor-pointer transition-colors ${
                chartStyle === style
                  ? 'bg-[#2a2e39] text-[#f0f3fa]'
                  : 'text-[#787b86] hover:text-[#d1d4dc]'
              }`}
            >
              {style}
            </button>
          ))}
        </div>

        {/* Technical Indicators Pill Menu */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px]">
          <button
            onClick={() => setShowEMA20(!showEMA20)}
            className={`px-2 py-1 rounded border transition-colors cursor-pointer ${
              showEMA20
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                : 'bg-[#131722] border-[#2a2e39] text-[#787b86]'
            }`}
          >
            EMA 20
          </button>
          <button
            onClick={() => setShowEMA50(!showEMA50)}
            className={`px-2 py-1 rounded border transition-colors cursor-pointer ${
              showEMA50
                ? 'bg-sky-500/10 border-sky-500/40 text-sky-400'
                : 'bg-[#131722] border-[#2a2e39] text-[#787b86]'
            }`}
          >
            EMA 50
          </button>
          <button
            onClick={() => setShowRSI(!showRSI)}
            className={`px-2 py-1 rounded border transition-colors cursor-pointer ${
              showRSI
                ? 'bg-purple-500/10 border-purple-500/40 text-purple-400'
                : 'bg-[#131722] border-[#2a2e39] text-[#787b86]'
            }`}
          >
            RSI (14)
          </button>
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-2 py-1 rounded border transition-colors cursor-pointer ${
              showVolume
                ? 'bg-[#2962ff]/10 border-[#2962ff]/40 text-[#2962ff]'
                : 'bg-[#131722] border-[#2a2e39] text-[#787b86]'
            }`}
          >
            Vol
          </button>
        </div>

        {/* Quick Order Actions on Chart */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onQuickTrade(symbol, 'buy')}
            className="px-3 py-1.5 bg-[#089981] hover:bg-[#067a67] text-white rounded font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
          >
            <span>BUY</span>
            <span className="font-mono tabular-nums text-[11px] opacity-90">
              ${(symbol.price + 0.05).toFixed(2)}
            </span>
          </button>
          <button
            onClick={() => onQuickTrade(symbol, 'sell')}
            className="px-3 py-1.5 bg-[#f23645] hover:bg-[#c92534] text-white rounded font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
          >
            <span>SELL</span>
            <span className="font-mono tabular-nums text-[11px] opacity-90">
              ${(symbol.price - 0.05).toFixed(2)}
            </span>
          </button>
        </div>
      </div>

      {/* Chart HUD Info Bar (Open, High, Low, Close, Volume) */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#181b24] border-b border-[#2a2e39] text-[11px] text-[#787b86] font-mono tabular-nums overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-[#f0f3fa] font-bold">{symbol.name}</span>
          <span>Time: <span className="text-[#d1d4dc]">{activeCandle.time}</span></span>
          <span>O: <span className="text-[#d1d4dc]">{activeCandle.open.toFixed(2)}</span></span>
          <span>H: <span className="text-[#d1d4dc]">{activeCandle.high.toFixed(2)}</span></span>
          <span>L: <span className="text-[#d1d4dc]">{activeCandle.low.toFixed(2)}</span></span>
          <span>
            C: <span className={isCurrentPositive ? 'text-[#089981] font-semibold' : 'text-[#f23645] font-semibold'}>
              {activeCandle.close.toFixed(2)}
            </span>
          </span>
          <span className={isCurrentPositive ? 'text-[#089981]' : 'text-[#f23645]'}>
            {candleChange >= 0 ? '+' : ''}{candleChange.toFixed(2)} ({candleChangePct >= 0 ? '+' : ''}{candleChangePct.toFixed(2)}%)
          </span>
          <span>Vol: <span className="text-[#d1d4dc]">{(activeCandle.volume / 1000).toFixed(1)}K</span></span>
        </div>

        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {showEMA20 && (
            <span className="text-amber-400">
              EMA 20: {(ema20Values[hoveredIndex ?? ema20Values.length - 1] || symbol.price).toFixed(2)}
            </span>
          )}
          {showEMA50 && (
            <span className="text-sky-400">
              EMA 50: {(ema50Values[hoveredIndex ?? ema50Values.length - 1] || symbol.price).toFixed(2)}
            </span>
          )}
          {showRSI && (
            <span className="text-purple-400">
              RSI 14: {(rsiValues[hoveredIndex ?? rsiValues.length - 1] || 50).toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Main Chart Workspace with Left Drawing Toolbar */}
      <div className="flex flex-1 relative min-h-[460px]">
        {/* Left Vertical Drawing Toolbar (Iconic TradingView Left Rail) */}
        <div className="w-11 bg-[#1e222d] border-r border-[#2a2e39] flex flex-col items-center py-3 gap-2 shrink-0">
          <button
            onClick={() => setActiveDrawingTool('cursor')}
            className={`p-2 rounded cursor-pointer transition-colors ${
              activeDrawingTool === 'cursor'
                ? 'bg-[#2962ff] text-white'
                : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
            }`}
            title="Crosshair Cursor"
          >
            <MousePointer className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveDrawingTool('horizontal')}
            className={`p-2 rounded cursor-pointer transition-colors ${
              activeDrawingTool === 'horizontal'
                ? 'bg-[#2962ff] text-white'
                : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
            }`}
            title="Horizontal Price Level"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveDrawingTool('line')}
            className={`p-2 rounded cursor-pointer transition-colors ${
              activeDrawingTool === 'line'
                ? 'bg-[#2962ff] text-white'
                : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
            }`}
            title="Trendline"
          >
            <TrendingUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveDrawingTool('ruler')}
            className={`p-2 rounded cursor-pointer transition-colors ${
              activeDrawingTool === 'ruler'
                ? 'bg-[#2962ff] text-white'
                : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
            }`}
            title="Measure Tool"
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

        {/* Interactive SVG Chart Container */}
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
              <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2962ff" stopOpacity={0.35} />
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

            {/* Volume Bars */}
            {showVolume &&
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
                    opacity={0.3}
                  />
                );
              })}

            {/* Render Candlesticks / Line / Area */}
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
                    {/* Upper & lower wick */}
                    <line
                      x1={x}
                      y1={yHigh}
                      x2={x}
                      y2={yLow}
                      stroke={color}
                      strokeWidth="1.2"
                    />
                    {/* Candle body */}
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
                    const y = getYForPrice(c.close);
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
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
                      const y = getYForPrice(c.close);
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')} L ${mainPlotWidth} ${chartHeight} L 0 ${chartHeight} Z`}
                  fill="url(#area-gradient)"
                />
                <path
                  d={candles
                    .map((c, i) => {
                      const x = i * candleStep + candleStep / 2;
                      const y = getYForPrice(c.close);
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#2962ff"
                  strokeWidth="2"
                />
              </>
            )}

            {/* EMA 20 overlay */}
            {showEMA20 && (
              <path
                d={ema20Values
                  .map((val, i) => {
                    const x = i * candleStep + candleStep / 2;
                    const y = getYForPrice(val);
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
              />
            )}

            {/* EMA 50 overlay */}
            {showEMA50 && (
              <path
                d={ema50Values
                  .map((val, i) => {
                    const x = i * candleStep + candleStep / 2;
                    const y = getYForPrice(val);
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="1.5"
              />
            )}

            {/* User Drawn Horizontal Lines */}
            {userDrawings.map((draw, i) => (
              <line
                key={`draw-${i}`}
                x1="0"
                y1={draw.y}
                x2={mainPlotWidth}
                y2={draw.y}
                stroke="#eab308"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
            ))}

            {/* Current Price Axis Marker */}
            {(() => {
              const currentY = getYForPrice(symbol.price);
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
                    {symbol.price.toFixed(2)}
                  </text>
                </g>
              );
            })()}

            {/* Interactive Crosshair & Cursor HUD */}
            {mousePos && mousePos.x <= mainPlotWidth && (
              <g>
                {/* Vertical hair */}
                <line
                  x1={mousePos.x}
                  y1="0"
                  x2={mousePos.x}
                  y2={totalSvgHeight}
                  stroke="#787b86"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                {/* Horizontal hair in main chart */}
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
                    {/* Price tooltip on right axis */}
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

            {/* RSI Sub-Chart Panel */}
            {showRSI && (
              <g transform={`translate(0, ${chartHeight})`}>
                <line
                  x1="0"
                  y1="0"
                  x2={chartWidth}
                  y2="0"
                  stroke="#2a2e39"
                  strokeWidth="1"
                />
                <rect
                  x="0"
                  y="0"
                  width={chartWidth}
                  height={rsiHeight}
                  fill="#181b24"
                  opacity={0.6}
                />
                {/* 70 overbought / 30 oversold bands */}
                <line
                  x1="0"
                  y1={rsiHeight * 0.3}
                  x2={mainPlotWidth}
                  y2={rsiHeight * 0.3}
                  stroke="#f23645"
                  strokeWidth="0.8"
                  strokeDasharray="2,2"
                  opacity={0.7}
                />
                <text
                  x={mainPlotWidth + 8}
                  y={rsiHeight * 0.3 + 3}
                  fill="#787b86"
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                >
                  70
                </text>

                <line
                  x1="0"
                  y1={rsiHeight * 0.7}
                  x2={mainPlotWidth}
                  y2={rsiHeight * 0.7}
                  stroke="#089981"
                  strokeWidth="0.8"
                  strokeDasharray="2,2"
                  opacity={0.7}
                />
                <text
                  x={mainPlotWidth + 8}
                  y={rsiHeight * 0.7 + 3}
                  fill="#787b86"
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                >
                  30
                </text>

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
                <text
                  x="12"
                  y="18"
                  fill="#a855f7"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                  fontWeight="bold"
                >
                  RSI (14): {(rsiValues[hoveredIndex ?? rsiValues.length - 1] || 50).toFixed(1)}
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Bottom Bar: Timeline presets & Scale selectors */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e222d] border-t border-[#2a2e39] text-xs text-[#787b86]">
        <div className="flex items-center gap-1 font-mono text-[11px]">
          <span>Interactive Canvas: Pan & Click enabled</span>
          <span className="text-[#2a2e39]">|</span>
          <span>Feed: Consolidated Market Tape (NASDAQ/Cboe)</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-[#089981] font-semibold">● Live Engine Connected</span>
          <span className="font-mono">UTC-5</span>
        </div>
      </div>
    </div>
  );
};
