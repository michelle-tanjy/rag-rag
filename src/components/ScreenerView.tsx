import React, { useState, useMemo } from 'react';
import { MarketSymbol, MarketCategory } from '../types/market';
import { Sparkline } from './Sparkline';
import {
  Search,
  Filter,
  Download,
  ArrowUpDown,
  BarChart2,
  TrendingUp,
  TrendingDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface ScreenerViewProps {
  symbols: MarketSymbol[];
  onSelectSymbol: (symbol: MarketSymbol) => void;
  onOpenSuperchart: (symbol: MarketSymbol) => void;
}

type SortField = 'symbol' | 'price' | 'changePercent' | 'volumeNumeric' | 'pe' | 'rating';

export const ScreenerView: React.FC<ScreenerViewProps> = ({
  symbols,
  onSelectSymbol,
  onOpenSuperchart,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<MarketCategory>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('volumeNumeric');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredAndSorted = useMemo(() => {
    return symbols
      .filter((s) => {
        const matchesCat = categoryFilter === 'all' || s.category === categoryFilter;
        const matchesRating = ratingFilter === 'all' || s.rating === ratingFilter;
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          (s.sector && s.sector.toLowerCase().includes(q));
        return matchesCat && matchesRating && matchesQuery;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'pe') {
          valA = a.pe || 0;
          valB = b.pe || 0;
        }

        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [symbols, searchQuery, categoryFilter, ratingFilter, sortField, sortAsc]);

  const exportCSV = () => {
    const headers = ['Symbol', 'Name', 'Category', 'Price', 'Change%', 'Volume', 'MarketCap', 'P/E', 'Rating'];
    const rows = filteredAndSorted.map((s) => [
      s.symbol,
      `"${s.name}"`,
      s.category,
      s.price,
      s.changePercent,
      `"${s.volume}"`,
      `"${s.marketCap || ''}"`,
      s.pe || '',
      s.rating,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tradingview_screener_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Filter Controls */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-[#f0f3fa] tracking-tight">
              Market Multi-Asset Screener
            </h2>
            <p className="text-xs text-[#787b86] mt-0.5">
              Filter securities by valuation metrics, technical momentum, and analyst consensus
            </p>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#131722] hover:bg-[#262b36] text-[#d1d4dc] rounded-md text-xs border border-[#2a2e39] transition-colors cursor-pointer self-start md:self-auto shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-[#2962ff]" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#2a2e39]">
          {/* Search text input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#787b86] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search symbol or name..."
              className="w-full bg-[#131722] border border-[#2a2e39] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#f0f3fa] placeholder-[#787b86] focus:outline-none"
            />
          </div>

          {/* Asset Category */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as MarketCategory)}
              className="w-full bg-[#131722] border border-[#2a2e39] rounded-lg px-3 py-1.5 text-xs text-[#d1d4dc] focus:outline-none cursor-pointer"
            >
              <option value="all">All Asset Classes</option>
              <option value="stocks">Equities (Stocks)</option>
              <option value="crypto">Cryptocurrencies</option>
              <option value="forex">Currencies (Forex)</option>
              <option value="indices">Major Indices</option>
              <option value="commodities">Commodities</option>
            </select>
          </div>

          {/* Technical Rating */}
          <div>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full bg-[#131722] border border-[#2a2e39] rounded-lg px-3 py-1.5 text-xs text-[#d1d4dc] focus:outline-none cursor-pointer"
            >
              <option value="all">All Analyst Ratings</option>
              <option value="Strong Buy">Strong Buy</option>
              <option value="Buy">Buy</option>
              <option value="Neutral">Neutral</option>
              <option value="Sell">Sell</option>
            </select>
          </div>

          {/* Quick Active Count */}
          <div className="flex items-center justify-end text-xs text-[#787b86] font-mono">
            <span>Showing {filteredAndSorted.length} matching instruments</span>
          </div>
        </div>
      </div>

      {/* Screener Data Table */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#181b24] border-b border-[#2a2e39] text-[#787b86] font-medium select-none">
                <th
                  onClick={() => handleSort('symbol')}
                  className="py-3 px-4 cursor-pointer hover:text-[#f0f3fa]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Ticker</span>
                    {sortField === 'symbol' && (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th className="py-3 px-4">Description</th>
                <th
                  onClick={() => handleSort('price')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-[#f0f3fa]"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Price</span>
                    {sortField === 'price' && (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('changePercent')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-[#f0f3fa]"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Change %</span>
                    {sortField === 'changePercent' && (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('volumeNumeric')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-[#f0f3fa]"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>24h Vol</span>
                    {sortField === 'volumeNumeric' && (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th className="py-3 px-4 text-right hidden sm:table-cell">Market Cap</th>
                <th
                  onClick={() => handleSort('pe')}
                  className="py-3 px-4 text-right hidden md:table-cell cursor-pointer hover:text-[#f0f3fa]"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>P/E</span>
                    {sortField === 'pe' && (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('rating')}
                  className="py-3 px-4 text-center hidden lg:table-cell cursor-pointer hover:text-[#f0f3fa]"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Rating</span>
                    {sortField === 'rating' && (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th className="py-3 px-4 text-center hidden xl:table-cell">Sparkline</th>
                <th className="py-3 px-4 text-right">Chart</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2e39]">
              {filteredAndSorted.map((item) => {
                const isPositive = item.changePercent >= 0;

                return (
                  <tr
                    key={item.symbol}
                    onClick={() => onSelectSymbol(item)}
                    className="hover:bg-[#262b36] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#f0f3fa] group-hover:text-[#2962ff] transition-colors">
                          {item.symbol}
                        </span>
                        <span className="text-[10px] text-[#787b86] uppercase font-mono">
                          {item.exchange}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#d1d4dc] max-w-[200px] truncate">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#f0f3fa]">
                      ${item.price > 1000 ? item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <span
                        className={`font-semibold inline-flex items-center gap-0.5 ${
                          isPositive ? 'text-[#089981]' : 'text-[#f23645]'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {item.changePercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#787b86]">
                      {item.volume}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#787b86] hidden sm:table-cell">
                      {item.marketCap || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#787b86] hidden md:table-cell">
                      {item.pe ? item.pe.toFixed(1) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center hidden lg:table-cell">
                      <span
                        className={`text-[11px] font-semibold ${
                          item.rating.includes('Buy')
                            ? 'text-[#089981]'
                            : item.rating.includes('Sell')
                            ? 'text-[#f23645]'
                            : 'text-[#787b86]'
                        }`}
                      >
                        {item.rating}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center hidden xl:table-cell">
                      <div className="flex justify-center">
                        <Sparkline
                          data={item.sparkline}
                          width={60}
                          height={18}
                          isPositive={isPositive}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onOpenSuperchart(item)}
                        className="p-1.5 bg-[#131722] hover:bg-[#2962ff] text-[#787b86] hover:text-white rounded transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] px-2.5"
                        title="Open in Superchart"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline">Chart</span>
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
