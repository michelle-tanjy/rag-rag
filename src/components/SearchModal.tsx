import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { MarketSymbol, MarketCategory } from '../types/market';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbols: MarketSymbol[];
  onSelectSymbol: (symbol: MarketSymbol) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  symbols,
  onSelectSymbol,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredSymbols = symbols.filter((s) => {
    const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
    const q = query.toLowerCase().trim();
    if (!q) return matchesCat;
    const matchesQuery =
      s.symbol.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.sector && s.sector.toLowerCase().includes(q)) ||
      s.exchange.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredSymbols.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredSymbols.length) % Math.max(1, filteredSymbols.length));
    } else if (e.key === 'Enter' && filteredSymbols[selectedIndex]) {
      e.preventDefault();
      onSelectSymbol(filteredSymbols[selectedIndex]);
      onClose();
    }
  };

  const categories: { label: string; value: MarketCategory }[] = [
    { label: 'All', value: 'all' },
    { label: 'Stocks', value: 'stocks' },
    { label: 'Crypto', value: 'crypto' },
    { label: 'Forex', value: 'forex' },
    { label: 'Indices', value: 'indices' },
    { label: 'Commodities', value: 'commodities' },
    { label: 'Bonds', value: 'bonds' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-2xl bg-[#1e222d] border border-[#2a2e39] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#2a2e39] gap-3 bg-[#181b24]">
          <Search className="w-5 h-5 text-[#787b86] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search symbol, company, crypto, or forex (e.g. NVDA, BTC, EURUSD)..."
            className="w-full bg-transparent text-sm text-[#f0f3fa] placeholder-[#787b86] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[#787b86] hover:text-[#d1d4dc] p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded bg-[#2a2e39] text-[#787b86] hover:text-[#f0f3fa] transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 bg-[#1e222d] border-b border-[#2a2e39] overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                setSelectedCategory(cat.value);
                setSelectedIndex(0);
              }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.value
                  ? 'bg-[#2962ff] text-white'
                  : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Symbol Results List */}
        <div className="overflow-y-auto flex-1 divide-y divide-[#2a2e39]">
          {filteredSymbols.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#787b86]">
              No financial symbols matching &quot;{query}&quot;
            </div>
          ) : (
            filteredSymbols.map((item, index) => {
              const isSelected = index === selectedIndex;
              const isPositive = item.changePercent >= 0;

              return (
                <div
                  key={item.symbol}
                  onClick={() => {
                    onSelectSymbol(item);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#2a2e39]' : 'hover:bg-[#262b36]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#131722] border border-[#2a2e39] flex items-center justify-center font-bold text-xs text-[#2962ff] shrink-0">
                      {item.symbol.slice(0, 3)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#f0f3fa] truncate">
                          {item.symbol}
                        </span>
                        <span className="text-[11px] text-[#787b86] uppercase font-mono">
                          {item.exchange}
                        </span>
                      </div>
                      <div className="text-xs text-[#787b86] truncate">
                        {item.name} {item.sector && `· ${item.sector}`}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <div className="font-mono tabular-nums text-sm font-semibold text-[#f0f3fa]">
                        ${item.price > 1000 ? item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.price.toFixed(2)}
                      </div>
                      <div
                        className={`font-mono tabular-nums text-xs font-medium flex items-center justify-end gap-0.5 ${
                          isPositive ? 'text-[#089981]' : 'text-[#f23645]'
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {isPositive ? '+' : ''}
                        {item.changePercent.toFixed(2)}%
                      </div>
                    </div>
                    {isSelected && (
                      <ArrowRight className="w-4 h-4 text-[#2962ff] hidden sm:block" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-[#181b24] border-t border-[#2a2e39] text-[11px] text-[#787b86] flex items-center justify-between">
          <span>Use ↑ ↓ to navigate, Enter to select</span>
          <span className="font-mono">{filteredSymbols.length} results</span>
        </div>
      </div>
    </div>
  );
};
