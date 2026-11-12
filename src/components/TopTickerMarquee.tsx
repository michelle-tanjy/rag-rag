import React from 'react';
import { MarketSymbol } from '../types/market';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TopTickerMarqueeProps {
  symbols: MarketSymbol[];
  activeSymbol: MarketSymbol;
  onSelectSymbol: (symbol: MarketSymbol) => void;
}

export const TopTickerMarquee: React.FC<TopTickerMarqueeProps> = ({
  symbols,
  activeSymbol,
  onSelectSymbol,
}) => {
  // Take a curated selection of global benchmarks
  const marqueeSymbols = symbols.filter(s => 
    ['SPX', 'NDX', 'DJI', 'BTCUSD', 'ETHUSD', 'NVDA', 'AAPL', 'TSLA', 'XAUUSD', 'USOIL', 'EURUSD', 'US10Y'].includes(s.symbol)
  );

  return (
    <div className="w-full bg-[#1e222d] border-b border-[#2a2e39] text-xs select-none overflow-x-auto scrollbar-none py-1.5 px-4 flex items-center gap-6">
      <div className="flex items-center gap-6 shrink-0">
        {marqueeSymbols.map((s) => {
          const isPositive = s.changePercent >= 0;
          const isSelected = activeSymbol.symbol === s.symbol;

          return (
            <button
              key={s.symbol}
              onClick={() => onSelectSymbol(s)}
              className={`flex items-center gap-2 px-2 py-0.5 rounded transition-all shrink-0 cursor-pointer text-left ${
                isSelected
                  ? 'bg-[#2a2e39] ring-1 ring-[#2962ff]'
                  : 'hover:bg-[#262b36]'
              }`}
            >
              <span className="font-semibold text-[#f0f3fa]">{s.symbol}</span>
              <span className="font-mono tabular-nums text-[#d1d4dc]">
                {s.category === 'bonds' ? `${s.price.toFixed(3)}%` : s.price > 1000 ? s.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : s.price.toFixed(2)}
              </span>
              <span
                className={`flex items-center gap-0.5 font-mono tabular-nums font-medium ${
                  isPositive ? 'text-[#089981]' : 'text-[#f23645]'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3 shrink-0" />
                ) : (
                  <TrendingDown className="w-3 h-3 shrink-0" />
                )}
                {isPositive ? '+' : ''}
                {s.changePercent.toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
