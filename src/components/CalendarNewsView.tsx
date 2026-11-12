import React, { useState } from 'react';
import { ECONOMIC_EVENTS, MARKET_NEWS } from '../data/mockMarketData';
import { EconomicEvent, MarketNewsItem, MarketSymbol } from '../types/market';
import {
  Calendar,
  Newspaper,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';

interface CalendarNewsViewProps {
  onSelectSymbolByTicker: (symbol: string) => void;
}

export const CalendarNewsView: React.FC<CalendarNewsViewProps> = ({
  onSelectSymbolByTicker,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'calendar' | 'news'>('calendar');
  const [newsCategory, setNewsCategory] = useState<string>('all');
  const [selectedNews, setSelectedNews] = useState<MarketNewsItem | null>(null);

  const filteredNews = newsCategory === 'all'
    ? MARKET_NEWS
    : MARKET_NEWS.filter((n) => n.category.toLowerCase() === newsCategory.toLowerCase());

  return (
    <div className="space-y-6 pb-12">
      {/* Sub-nav switcher */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('calendar')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'calendar'
                ? 'bg-[#2962ff] text-white shadow'
                : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#262b36]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Economic Calendar</span>
          </button>
          <button
            onClick={() => setActiveSubTab('news')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'news'
                ? 'bg-[#2962ff] text-white shadow'
                : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#262b36]'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>Global Market News</span>
          </button>
        </div>

        {activeSubTab === 'news' && (
          <div className="flex items-center p-1 bg-[#131722] rounded-lg border border-[#2a2e39]">
            {['All', 'Stock', 'Crypto', 'Macro', 'Commodities'].map((cat) => (
              <button
                key={cat}
                onClick={() => setNewsCategory(cat.toLowerCase())}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  newsCategory === cat.toLowerCase()
                    ? 'bg-[#2a2e39] text-[#f0f3fa]'
                    : 'text-[#787b86] hover:text-[#d1d4dc]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeSubTab === 'calendar' ? (
        /* Economic Calendar Section */
        <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#f0f3fa] tracking-tight">
                Global Economic Indicators & Central Bank Schedule
              </h3>
              <p className="text-xs text-[#787b86] mt-0.5">
                Crucial macroeconomic releases driving bond yields and foreign exchange volatility
              </p>
            </div>
            <div className="text-xs text-[#787b86]">
              All times displayed in <span className="font-mono text-[#d1d4dc]">EST (UTC-5)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#2a2e39] text-[#787b86] font-medium">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Country</th>
                  <th className="py-2.5 px-3">Event Name</th>
                  <th className="py-2.5 px-3 text-center">Impact</th>
                  <th className="py-2.5 px-3 text-right">Actual</th>
                  <th className="py-2.5 px-3 text-right">Forecast</th>
                  <th className="py-2.5 px-3 text-right">Previous</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2e39]">
                {ECONOMIC_EVENTS.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#262b36] transition-colors">
                    <td className="py-3 px-3 font-mono tabular-nums text-[#d1d4dc]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-[#787b86]" />
                        <span>{ev.time}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[#f0f3fa]">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{ev.flag}</span>
                        <span className="font-medium">{ev.country}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-[#f0f3fa]">
                      {ev.event}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          ev.impact === 'High'
                            ? 'bg-[#f23645]/20 text-[#f23645] border border-[#f23645]/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {ev.impact}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-[#f0f3fa]">
                      {ev.actual}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#787b86]">
                      {ev.forecast}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#787b86]">
                      {ev.previous}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Market News Section */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-3">
            {filteredNews.map((news) => (
              <div
                key={news.id}
                onClick={() => setSelectedNews(news)}
                className="bg-[#1e222d] hover:bg-[#262b36] border border-[#2a2e39] rounded-xl p-4 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 text-xs text-[#787b86]">
                    <span className="font-semibold text-[#2962ff]">{news.source}</span>
                    <span>·</span>
                    <span>{news.timeAgo}</span>
                    <span>·</span>
                    <span>{news.readTime}</span>
                  </div>

                  <span
                    className={`text-[11px] font-semibold flex items-center gap-1 ${
                      news.sentiment === 'bullish'
                        ? 'text-[#089981]'
                        : news.sentiment === 'bearish'
                        ? 'text-[#f23645]'
                        : 'text-[#787b86]'
                    }`}
                  >
                    {news.sentiment === 'bullish' ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : news.sentiment === 'bearish' ? (
                      <TrendingDown className="w-3.5 h-3.5" />
                    ) : null}
                    <span className="capitalize">{news.sentiment}</span>
                  </span>
                </div>

                <h4 className="text-sm font-bold text-[#f0f3fa] group-hover:text-[#2962ff] transition-colors mb-2">
                  {news.title}
                </h4>

                <p className="text-xs text-[#787b86] line-clamp-2 leading-relaxed mb-3">
                  {news.snippet}
                </p>

                <div className="flex items-center gap-2 pt-2 border-t border-[#2a2e39]/50">
                  <span className="text-[11px] text-[#787b86]">Related:</span>
                  <div className="flex items-center gap-1.5">
                    {news.relatedSymbols.map((sym) => (
                      <button
                        key={sym}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSymbolByTicker(sym);
                        }}
                        className="px-2 py-0.5 bg-[#131722] hover:bg-[#2962ff] hover:text-white rounded text-[11px] font-mono font-semibold text-[#2962ff] transition-colors cursor-pointer"
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Detail Pane */}
          <div className="lg:col-span-4 bg-[#1e222d] border border-[#2a2e39] rounded-xl p-5 self-start">
            {selectedNews ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-[#787b86]">
                  <span className="font-bold text-[#2962ff]">{selectedNews.source}</span>
                  <span>·</span>
                  <span>{selectedNews.timeAgo}</span>
                </div>

                <h3 className="text-base font-bold text-[#f0f3fa] leading-snug">
                  {selectedNews.title}
                </h3>

                <p className="text-xs text-[#d1d4dc] leading-relaxed">
                  {selectedNews.snippet}
                </p>

                <div className="p-3 bg-[#131722] rounded-lg border border-[#2a2e39] text-xs">
                  <span className="font-semibold text-[#f0f3fa] block mb-1">
                    Market Analyst Take:
                  </span>
                  <span className="text-[#787b86] leading-relaxed">
                    This macro catalyst directly impacts index liquidity and sector valuations across corresponding equity baskets.
                  </span>
                </div>

                <div className="pt-2">
                  <span className="text-xs text-[#787b86] block mb-2">Inspect Asset Charters:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedNews.relatedSymbols.map((sym) => (
                      <button
                        key={sym}
                        onClick={() => onSelectSymbolByTicker(sym)}
                        className="px-3 py-1.5 bg-[#2962ff] hover:bg-[#1e53e5] text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                      >
                        View {sym} Chart
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[#787b86]">
                <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Select any news story from the feed to view full analyst synopsis and asset correlation.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
