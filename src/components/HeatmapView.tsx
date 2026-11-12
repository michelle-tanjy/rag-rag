import React, { useState } from 'react';
import { HEATMAP_DATA } from '../data/mockMarketData';
import { HeatmapItem, MarketSymbol } from '../types/market';
import { Sparkline } from './Sparkline';
import { ArrowUpRight, BarChart2, Filter, Layers } from 'lucide-react';

interface HeatmapViewProps {
  onSelectSymbolByTicker: (symbol: string) => void;
  onOpenSuperchartByTicker: (symbol: string) => void;
}

export const HeatmapView: React.FC<HeatmapViewProps> = ({
  onSelectSymbolByTicker,
  onOpenSuperchartByTicker,
}) => {
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | 'YTD'>('1D');
  const [hoveredTile, setHoveredTile] = useState<HeatmapItem | null>(null);

  const sectors = Array.from(new Set(HEATMAP_DATA.map((item) => item.sector)));

  const filteredData = selectedSector === 'all'
    ? HEATMAP_DATA
    : HEATMAP_DATA.filter((item) => item.sector === selectedSector);

  // Group by sector
  const groupedBySector: Record<string, HeatmapItem[]> = {};
  filteredData.forEach((item) => {
    if (!groupedBySector[item.sector]) {
      groupedBySector[item.sector] = [];
    }
    groupedBySector[item.sector].push(item);
  });

  // Color generator based on percent change (iconic TradingView color map)
  const getTileColor = (pct: number) => {
    if (pct >= 3) return 'bg-[#089981] text-white';
    if (pct >= 1.5) return 'bg-[#0ea271] text-white';
    if (pct > 0) return 'bg-[#186b52] text-white';
    if (pct === 0) return 'bg-[#2a2e39] text-[#d1d4dc]';
    if (pct > -1.5) return 'bg-[#8c2630] text-white';
    if (pct > -3) return 'bg-[#c92534] text-white';
    return 'bg-[#f23645] text-white';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Heatmap Control Toolbar */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#f0f3fa] tracking-tight">
            S&P 500 Market Heatmap
          </h2>
          <p className="text-xs text-[#787b86] mt-0.5">
            Tile area represents Market Capitalization; color signifies % return
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Timeframe switch */}
          <div className="flex items-center p-1 bg-[#131722] rounded-lg border border-[#2a2e39]">
            {(['1D', '1W', '1M', 'YTD'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  timeframe === tf
                    ? 'bg-[#2962ff] text-white'
                    : 'text-[#787b86] hover:text-[#d1d4dc]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Sector Selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="px-3 py-1.5 bg-[#131722] text-xs text-[#d1d4dc] rounded-lg border border-[#2a2e39] focus:outline-none cursor-pointer"
            >
              <option value="all">All Sectors (Full Market)</option>
              {sectors.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Heatmap Color Scale Legend */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#181b24] border border-[#2a2e39] rounded-lg text-[11px] text-[#787b86]">
        <span>Performance Scale:</span>
        <div className="flex items-center gap-1 font-mono tabular-nums">
          <span className="text-[#f23645] font-semibold">&lt; -3%</span>
          <div className="flex h-3 w-40 rounded overflow-hidden">
            <div className="flex-1 bg-[#f23645]" />
            <div className="flex-1 bg-[#c92534]" />
            <div className="flex-1 bg-[#8c2630]" />
            <div className="flex-1 bg-[#2a2e39]" />
            <div className="flex-1 bg-[#186b52]" />
            <div className="flex-1 bg-[#0ea271]" />
            <div className="flex-1 bg-[#089981]" />
          </div>
          <span className="text-[#089981] font-semibold">&gt; +3%</span>
        </div>
      </div>

      {/* Visual Treemap Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {Object.entries(groupedBySector).map(([sectorName, items]) => {
          // Calculate sector total market cap
          const sectorCap = items.reduce((acc, curr) => acc + curr.marketCap, 0);
          const colSpan =
            sectorCap > 5000
              ? 'lg:col-span-8'
              : sectorCap > 2000
              ? 'lg:col-span-6'
              : 'lg:col-span-4';

          return (
            <div
              key={sectorName}
              className={`${colSpan} bg-[#181b24] border border-[#2a2e39] rounded-xl p-3 flex flex-col`}
            >
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="font-semibold text-[#f0f3fa] truncate">
                  {sectorName}
                </span>
                <span className="text-[11px] font-mono text-[#787b86]">
                  ${(sectorCap / 1000).toFixed(1)}T
                </span>
              </div>

              {/* Flex Grid proportional to market cap */}
              <div className="flex flex-wrap gap-2 flex-1 items-stretch">
                {items.map((stock) => {
                  // Size relative to sector
                  const sizeFlex = Math.max(1, Math.round(stock.marketCap / 180));
                  const isPositive = stock.changePercent >= 0;

                  return (
                    <div
                      key={stock.symbol}
                      onClick={() => onSelectSymbolByTicker(stock.symbol)}
                      onMouseEnter={() => setHoveredTile(stock)}
                      style={{ flex: `${sizeFlex} 1 120px` }}
                      className={`min-h-[85px] p-3 rounded-lg ${getTileColor(
                        stock.changePercent
                      )} transition-transform hover:scale-[1.02] hover:z-20 shadow cursor-pointer flex flex-col justify-between relative group`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-extrabold text-sm tracking-tight">
                          {stock.symbol}
                        </span>
                        <span className="text-[10px] font-mono opacity-80">
                          ${stock.marketCap >= 1000 ? `${(stock.marketCap / 1000).toFixed(1)}T` : `${stock.marketCap}B`}
                        </span>
                      </div>

                      <div>
                        <div className="font-mono tabular-nums text-xs font-bold">
                          ${stock.price.toFixed(2)}
                        </div>
                        <div className="font-mono tabular-nums text-sm font-extrabold">
                          {isPositive ? '+' : ''}
                          {stock.changePercent.toFixed(2)}%
                        </div>
                      </div>

                      {/* Hover action button overlay */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSuperchartByTicker(stock.symbol);
                        }}
                        className="absolute right-2 bottom-2 p-1.5 bg-black/40 hover:bg-black/70 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Open in Superchart"
                      >
                        <BarChart2 className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hovered Tile Details Strip */}
      {hoveredTile && (
        <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#131722] border border-[#2a2e39] flex items-center justify-center font-bold text-sm text-[#2962ff]">
              {hoveredTile.symbol}
            </div>
            <div>
              <div className="font-bold text-sm text-[#f0f3fa]">
                {hoveredTile.name} ({hoveredTile.symbol})
              </div>
              <div className="text-xs text-[#787b86]">
                {hoveredTile.sector} · Daily Vol: {hoveredTile.volume}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-[#787b86] block text-[11px]">Current Price</span>
              <span className="font-mono tabular-nums font-bold text-[#f0f3fa]">
                ${hoveredTile.price.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[#787b86] block text-[11px]">Today&apos;s Return</span>
              <span
                className={`font-mono tabular-nums font-bold ${
                  hoveredTile.changePercent >= 0 ? 'text-[#089981]' : 'text-[#f23645]'
                }`}
              >
                {hoveredTile.changePercent >= 0 ? '+' : ''}
                {hoveredTile.changePercent.toFixed(2)}%
              </span>
            </div>
            <div>
              <span className="text-[#787b86] block text-[11px]">Market Cap</span>
              <span className="font-mono tabular-nums font-bold text-[#f0f3fa]">
                ${hoveredTile.marketCap >= 1000 ? `${(hoveredTile.marketCap / 1000).toFixed(2)}T` : `${hoveredTile.marketCap}B`}
              </span>
            </div>
            <button
              onClick={() => onOpenSuperchartByTicker(hoveredTile.symbol)}
              className="px-3 py-1.5 bg-[#2962ff] hover:bg-[#1e53e5] text-white rounded text-xs font-semibold transition-colors cursor-pointer"
            >
              Launch Superchart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
