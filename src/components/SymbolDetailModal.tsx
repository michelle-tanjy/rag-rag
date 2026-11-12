import React from 'react';
import { MarketSymbol } from '../types/market';
import { Sparkline } from './Sparkline';
import {
  X,
  TrendingUp,
  TrendingDown,
  BarChart2,
  DollarSign,
  Globe,
  ExternalLink,
} from 'lucide-react';

interface SymbolDetailModalProps {
  symbol: MarketSymbol | null;
  onClose: () => void;
  onOpenSuperchart: (symbol: MarketSymbol) => void;
  onQuickTrade: (symbol: MarketSymbol, side: 'buy' | 'sell') => void;
}

export const SymbolDetailModal: React.FC<SymbolDetailModalProps> = ({
  symbol,
  onClose,
  onOpenSuperchart,
  onQuickTrade,
}) => {
  if (!symbol) return null;

  const isPositive = symbol.changePercent >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#1e222d] border border-[#2a2e39] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#2a2e39] bg-[#181b24]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#131722] border border-[#2a2e39] flex items-center justify-center font-bold text-base text-[#2962ff]">
              {symbol.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#f0f3fa]">{symbol.symbol}</h3>
                <span className="text-xs font-mono uppercase text-[#787b86]">
                  {symbol.exchange}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#2962ff]/10 text-[#2962ff] font-semibold">
                  {symbol.rating}
                </span>
              </div>
              <div className="text-xs text-[#787b86]">
                {symbol.name} {symbol.sector && `· ${symbol.sector}`}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#787b86] hover:text-[#f0f3fa] rounded-lg hover:bg-[#2a2e39] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Price & Chart Showcase */}
        <div className="p-5 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="font-mono tabular-nums text-3xl font-extrabold text-[#f0f3fa]">
                ${symbol.price > 1000 ? symbol.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : symbol.price.toFixed(2)}
              </div>
              <div
                className={`font-mono tabular-nums text-sm font-bold flex items-center gap-1 mt-0.5 ${
                  isPositive ? 'text-[#089981]' : 'text-[#f23645]'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>
                  {isPositive ? '+' : ''}
                  {symbol.change.toFixed(2)} ({symbol.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenSuperchart(symbol);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#2962ff] hover:bg-[#1e53e5] text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                <BarChart2 className="w-4 h-4" />
                <span>Launch Full Superchart</span>
              </button>
            </div>
          </div>

          {/* Sparkline Canvas */}
          <div className="p-4 bg-[#131722] rounded-xl border border-[#2a2e39] flex items-center justify-center">
            <Sparkline
              data={symbol.sparkline}
              width={560}
              height={90}
              isPositive={isPositive}
              strokeWidth={2.2}
            />
          </div>

          {/* Key Fundamentals Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 bg-[#181b24] rounded-lg border border-[#2a2e39]">
              <span className="text-[#787b86] block text-[11px]">24h High</span>
              <span className="font-mono tabular-nums font-bold text-[#f0f3fa]">
                ${symbol.high24h.toFixed(2)}
              </span>
            </div>
            <div className="p-2.5 bg-[#181b24] rounded-lg border border-[#2a2e39]">
              <span className="text-[#787b86] block text-[11px]">24h Low</span>
              <span className="font-mono tabular-nums font-bold text-[#f0f3fa]">
                ${symbol.low24h.toFixed(2)}
              </span>
            </div>
            <div className="p-2.5 bg-[#181b24] rounded-lg border border-[#2a2e39]">
              <span className="text-[#787b86] block text-[11px]">Volume</span>
              <span className="font-mono tabular-nums font-bold text-[#f0f3fa]">
                {symbol.volume}
              </span>
            </div>
            <div className="p-2.5 bg-[#181b24] rounded-lg border border-[#2a2e39]">
              <span className="text-[#787b86] block text-[11px]">Market Cap</span>
              <span className="font-mono tabular-nums font-bold text-[#f0f3fa]">
                {symbol.marketCap || 'N/A'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-bold text-xs text-[#f0f3fa] mb-1">Company Overview</h4>
            <p className="text-xs text-[#787b86] leading-relaxed">
              {symbol.description}
            </p>
          </div>
        </div>

        {/* Quick Trade Footer */}
        <div className="p-4 bg-[#181b24] border-t border-[#2a2e39] flex items-center justify-between">
          <span className="text-xs text-[#787b86]">Quick Simulated Order:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onQuickTrade(symbol, 'buy');
              }}
              className="px-4 py-1.5 bg-[#089981] hover:bg-[#067a67] text-white rounded-lg font-bold text-xs cursor-pointer transition-colors"
            >
              Buy {symbol.symbol}
            </button>
            <button
              onClick={() => {
                onClose();
                onQuickTrade(symbol, 'sell');
              }}
              className="px-4 py-1.5 bg-[#f23645] hover:bg-[#c92534] text-white rounded-lg font-bold text-xs cursor-pointer transition-colors"
            >
              Sell {symbol.symbol}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
