import React, { useState } from 'react';
import { MarketSymbol, SectorItem } from '../types/market';
import { Sparkline } from './Sparkline';
import { TrendingUp, TrendingDown, ArrowUpRight, BarChart2, Globe, Clock } from 'lucide-react';

interface OverviewViewProps {
  symbols: MarketSymbol[];
  sectors: SectorItem[];
  onSelectSymbol: (symbol: MarketSymbol) => void;
  onOpenSuperchart: (symbol: MarketSymbol) => void;
}

type MoverTab = 'gainers' | 'losers' | 'active' | 'highs';

export const OverviewView: React.FC<OverviewViewProps> = ({
  symbols,
  sectors,
  onSelectSymbol,
  onOpenSuperchart,
}) => {
  const [moverTab, setMoverTab] = useState<MoverTab>('gainers');
  const [assetCategory, setAssetCategory] = useState<'all' | 'stocks' | 'crypto' | 'forex'>('all');

  // Featured pulse symbols
  const pulseSymbols = symbols.filter((s) =>
    ['SPX', 'NDX', 'BTCUSD', 'NVDA', 'TSLA', 'XAUUSD'].includes(s.symbol)
  );

  // Filtered market movers
  const filteredSymbols = symbols.filter((s) => {
    if (assetCategory === 'all') return true;
    return s.category === assetCategory;
  });

  const getMovers = () => {
    const list = [...filteredSymbols];
    if (moverTab === 'gainers') {
      return list.sort((a, b) => b.changePercent - a.changePercent).slice(0, 6);
    }
    if (moverTab === 'losers') {
      return list.sort((a, b) => a.changePercent - b.changePercent).slice(0, 6);
    }
    if (moverTab === 'active') {
      return list.sort((a, b) => b.volumeNumeric - a.volumeNumeric).slice(0, 6);
    }
    if (moverTab === 'highs') {
      return list
        .sort((a, b) => a.week52High - a.price - (b.week52High - b.price))
        .slice(0, 6);
    }
    return list.slice(0, 6);
  };

  const movers = getMovers();

  return (
    <div className="space-y-6 pb-12">
      {/* Market Status Banner */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#089981]" />
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#f0f3fa]">
              <span>US Markets Regular Trading Session</span>
              <span className="text-[#787b86]">·</span>
              <span className="text-[#787b86]">NYSE & NASDAQ</span>
            </div>
            <div className="text-[11px] text-[#787b86] flex items-center gap-2 mt-0.5">
              <Clock className="w-3 h-3" />
              <span>Closes in 4 hours 22 minutes (16:00 EST)</span>
              <span>·</span>
              <span>Global Advancers: 67% · Decliners: 33%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-[#787b86]">
          <div className="hidden sm:block">
            <span className="text-[11px] block">24h Global Volume</span>
            <span className="font-mono tabular-nums font-semibold text-[#f0f3fa]">
              $248.5 Billion
            </span>
          </div>
          <div className="hidden sm:block">
            <span className="text-[11px] block">Total Market Cap</span>
            <span className="font-mono tabular-nums font-semibold text-[#f0f3fa]">
              $58.2 Trillion
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#131722] rounded-md border border-[#2a2e39]">
            <Globe className="w-3.5 h-3.5 text-[#2962ff]" />
            <span className="text-[11px] text-[#f0f3fa]">Market Mood: </span>
            <span className="text-[11px] font-semibold text-[#089981]">Greed (68)</span>
          </div>
        </div>
      </div>

      {/* Market Pulse Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#f0f3fa] tracking-tight">
            Market Pulse Overview
          </h2>
          <span className="text-xs text-[#787b86]">Live pricing · 15m delay</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {pulseSymbols.map((item) => {
            const isPositive = item.changePercent >= 0;
            const priceFormatted =
              item.price > 1000
                ? item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : item.price.toFixed(2);

            const dayRangePercent = Math.min(
              100,
              Math.max(
                0,
                ((item.price - item.low24h) / (item.high24h - item.low24h || 1)) * 100
              )
            );

            return (
              <div
                key={item.symbol}
                onClick={() => onSelectSymbol(item)}
                className="bg-[#1e222d] hover:bg-[#262b36] border border-[#2a2e39] hover:border-[#363c4e] rounded-xl p-3.5 cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <div className="font-bold text-sm text-[#f0f3fa] group-hover:text-[#2962ff] transition-colors flex items-center gap-1.5">
                        {item.symbol}
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-[11px] text-[#787b86] truncate max-w-[110px]">
                        {item.name}
                      </div>
                    </div>
                    <Sparkline
                      data={item.sparkline}
                      width={64}
                      height={24}
                      isPositive={isPositive}
                    />
                  </div>

                  <div className="my-2">
                    <div className="font-mono tabular-nums text-lg font-bold text-[#f0f3fa]">
                      ${priceFormatted}
                    </div>
                    <div
                      className={`font-mono tabular-nums text-xs font-semibold flex items-center gap-1 ${
                        isPositive ? 'text-[#089981]' : 'text-[#f23645]'
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>
                        {isPositive ? '+' : ''}
                        {item.change > 0 ? `+${item.change.toFixed(2)}` : item.change.toFixed(2)}
                      </span>
                      <span>({isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%)</span>
                    </div>
                  </div>
                </div>

                {/* Day Range Mini Bar */}
                <div className="pt-2 border-t border-[#2a2e39]/60">
                  <div className="flex justify-between text-[10px] text-[#787b86] font-mono tabular-nums mb-1">
                    <span>L: {item.low24h.toFixed(1)}</span>
                    <span>H: {item.high24h.toFixed(1)}</span>
                  </div>
                  <div className="w-full h-1 bg-[#131722] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2962ff] rounded-full"
                      style={{ width: `${dayRangePercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Split: Sector Performance & Market Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): S&P 500 Sector Map */}
        <div className="lg:col-span-7 bg-[#1e222d] border border-[#2a2e39] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#f0f3fa] tracking-tight">
                S&P 500 Sector Performance
              </h3>
              <p className="text-xs text-[#787b86] mt-0.5">
                Daily returns across major US equity industry sectors
              </p>
            </div>
            <div className="text-xs font-mono text-[#787b86]">
              Leader: <span className="text-[#089981] font-semibold">Tech (+2.14%)</span>
            </div>
          </div>

          <div className="space-y-3">
            {sectors.map((sec) => {
              const isPositive = sec.changePercent >= 0;
              const barWidth = Math.min(100, Math.abs(sec.changePercent) * 35);

              return (
                <div key={sec.id} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-[#d1d4dc] truncate max-w-[180px]">
                      {sec.name}
                    </span>
                    <div className="flex items-center gap-3 font-mono tabular-nums">
                      <span className="text-[#787b86] text-[11px]">
                        Leader: {sec.topStock} ({sec.topStockGain > 0 ? '+' : ''}{sec.topStockGain.toFixed(1)}%)
                      </span>
                      <span
                        className={`font-semibold min-w-[50px] text-right ${
                          isPositive ? 'text-[#089981]' : 'text-[#f23645]'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {sec.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Divergent Bi-directional return bar */}
                  <div className="w-full h-2 bg-[#131722] rounded-full flex items-center relative overflow-hidden">
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#2a2e39] z-10" />
                    {isPositive ? (
                      <div
                        className="h-full bg-[#089981] rounded-r-full"
                        style={{
                          marginLeft: '50%',
                          width: `${barWidth / 2}%`,
                        }}
                      />
                    ) : (
                      <div
                        className="h-full bg-[#f23645] rounded-l-full"
                        style={{
                          marginRight: '50%',
                          width: `${barWidth / 2}%`,
                          marginLeft: `calc(50% - ${barWidth / 2}%)`,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (5 cols): Market Sentiment & Fear/Greed Index */}
        <div className="lg:col-span-5 space-y-6">
          {/* Sentiment Gauge Card */}
          <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-5">
            <h3 className="text-base font-bold text-[#f0f3fa] tracking-tight mb-1">
              Market Sentiment & Volatility
            </h3>
            <p className="text-xs text-[#787b86] mb-4">
              Fear & Greed Index calculated from momentum, volatility, and safe-haven demand
            </p>

            {/* Gauge Graphic */}
            <div className="flex flex-col items-center justify-center my-3">
              <div className="relative w-48 h-24 overflow-hidden">
                {/* Semicircle background */}
                <div className="w-48 h-48 rounded-full border-[14px] border-[#2a2e39] border-t-[#089981] border-r-[#089981] border-b-[#f23645] border-l-[#f23645] transform -rotate-45" />
                {/* Needle */}
                <div 
                  className="absolute bottom-0 left-1/2 w-1 h-20 bg-white origin-bottom transform transition-transform duration-700 -translate-x-1/2 shadow-lg"
                  style={{ transform: 'translateX(-50%) rotate(34deg)' }}
                />
                <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-white rounded-full -translate-x-1/2 translate-y-1/2" />
              </div>

              <div className="text-center mt-3">
                <span className="font-mono text-3xl font-extrabold text-[#089981]">68</span>
                <span className="block text-xs font-semibold uppercase tracking-wider text-[#089981] mt-0.5">
                  Greed
                </span>
              </div>
            </div>

            {/* Historical sentiment comparison */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#2a2e39] text-center text-xs">
              <div className="bg-[#131722] p-2 rounded-lg">
                <span className="text-[#787b86] text-[11px] block">Yesterday</span>
                <span className="font-mono tabular-nums font-semibold text-[#f0f3fa]">65 · Greed</span>
              </div>
              <div className="bg-[#131722] p-2 rounded-lg">
                <span className="text-[#787b86] text-[11px] block">Last Week</span>
                <span className="font-mono tabular-nums font-semibold text-[#f0f3fa]">61 · Greed</span>
              </div>
              <div className="bg-[#131722] p-2 rounded-lg">
                <span className="text-[#787b86] text-[11px] block">Last Month</span>
                <span className="font-mono tabular-nums font-semibold text-[#f0f3fa]">52 · Neutral</span>
              </div>
            </div>
          </div>

          {/* Asset Allocation Strip */}
          <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-5">
            <h4 className="text-sm font-bold text-[#f0f3fa] mb-2">
              Macro Asset Performance Today
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-[#131722] rounded-lg">
                <span className="text-[#d1d4dc]">Equities (US Tech)</span>
                <span className="font-mono tabular-nums text-[#089981] font-semibold">+1.09%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#131722] rounded-lg">
                <span className="text-[#d1d4dc]">Crypto (Bitcoin)</span>
                <span className="font-mono tabular-nums text-[#089981] font-semibold">+3.73%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#131722] rounded-lg">
                <span className="text-[#d1d4dc]">Safe Havens (Gold)</span>
                <span className="font-mono tabular-nums text-[#089981] font-semibold">+0.69%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#131722] rounded-lg">
                <span className="text-[#d1d4dc]">Energy (WTI Crude)</span>
                <span className="font-mono tabular-nums text-[#f23645] font-semibold">-1.65%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Movers Leaderboard Table */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-[#f0f3fa] tracking-tight">
              Market Movers Leaderboard
            </h3>
            <p className="text-xs text-[#787b86]">
              Real-time securities driving today&apos;s market volume and momentum
            </p>
          </div>

          {/* Interactive filter tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-1 bg-[#131722] rounded-lg border border-[#2a2e39]">
              {(['gainers', 'losers', 'active', 'highs'] as MoverTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMoverTab(tab)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer capitalize ${
                    moverTab === tab
                      ? 'bg-[#2962ff] text-white shadow-sm'
                      : 'text-[#787b86] hover:text-[#d1d4dc]'
                  }`}
                >
                  {tab === 'gainers' ? 'Top Gainers' : tab === 'losers' ? 'Top Losers' : tab === 'active' ? 'Most Active' : '52W Highs'}
                </button>
              ))}
            </div>

            <div className="flex items-center p-1 bg-[#131722] rounded-lg border border-[#2a2e39]">
              {(['all', 'stocks', 'crypto', 'forex'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setAssetCategory(cat)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer capitalize ${
                    assetCategory === cat
                      ? 'bg-[#2a2e39] text-[#f0f3fa]'
                      : 'text-[#787b86] hover:text-[#d1d4dc]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* High Density Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#2a2e39] text-[#787b86] font-medium">
                <th className="py-2.5 px-3">Symbol</th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3 text-right">Price</th>
                <th className="py-2.5 px-3 text-right">Change %</th>
                <th className="py-2.5 px-3 text-right hidden sm:table-cell">Volume</th>
                <th className="py-2.5 px-3 text-right hidden md:table-cell">Market Cap</th>
                <th className="py-2.5 px-3 text-center hidden lg:table-cell">Rating</th>
                <th className="py-2.5 px-3 text-center hidden md:table-cell">7D Trend</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2e39]">
              {movers.map((item) => {
                const isPositive = item.changePercent >= 0;

                return (
                  <tr
                    key={item.symbol}
                    onClick={() => onSelectSymbol(item)}
                    className="hover:bg-[#262b36] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#f0f3fa] group-hover:text-[#2962ff] transition-colors">
                          {item.symbol}
                        </span>
                        <span className="text-[10px] text-[#787b86] uppercase font-mono">
                          {item.exchange}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[#d1d4dc] max-w-[180px] truncate">
                      {item.name}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-[#f0f3fa]">
                      ${item.price > 1000 ? item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.price.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      <span
                        className={`font-semibold inline-flex items-center gap-0.5 ${
                          isPositive ? 'text-[#089981]' : 'text-[#f23645]'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {item.changePercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#787b86] hidden sm:table-cell">
                      {item.volume}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#787b86] hidden md:table-cell">
                      {item.marketCap || '-'}
                    </td>
                    <td className="py-3 px-3 text-center hidden lg:table-cell">
                      <span className="text-[11px] font-medium text-[#2962ff]">
                        {item.rating}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center hidden md:table-cell">
                      <div className="flex justify-center">
                        <Sparkline
                          data={item.sparkline}
                          width={60}
                          height={20}
                          isPositive={isPositive}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onOpenSuperchart(item)}
                        className="p-1.5 bg-[#131722] hover:bg-[#2962ff] text-[#787b86] hover:text-white rounded transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] px-2.5"
                        title="Open in Superchart"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span className="hidden xl:inline">Chart</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
