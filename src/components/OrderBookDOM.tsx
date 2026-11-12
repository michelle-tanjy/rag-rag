import React, { useState } from 'react';
import { MarketSymbol, OrderBookLevel, TimeAndSale } from '../types/market';
import { Layers, Clock, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface OrderBookDOMProps {
  symbol: MarketSymbol;
  orderBook: { bids: OrderBookLevel[]; asks: OrderBookLevel[]; spread: number };
  timeAndSales: TimeAndSale[];
  onPlaceLimitOrder: (price: number, side: 'buy' | 'sell') => void;
}

export const OrderBookDOM: React.FC<OrderBookDOMProps> = ({
  symbol,
  orderBook,
  timeAndSales,
  onPlaceLimitOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'dom' | 'trades'>('dom');

  return (
    <div className="w-72 bg-[#181b24] border-l border-[#2a2e39] flex flex-col text-xs select-none shrink-0 h-full">
      {/* Panel Tab Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1e222d] border-b border-[#2a2e39]">
        <div className="flex items-center gap-1 bg-[#131722] p-0.5 rounded border border-[#2a2e39]">
          <button
            onClick={() => setActiveTab('dom')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded cursor-pointer transition-colors ${
              activeTab === 'dom'
                ? 'bg-[#2962ff] text-white shadow-sm'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            Level 2 DOM
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded cursor-pointer transition-colors ${
              activeTab === 'trades'
                ? 'bg-[#2962ff] text-white shadow-sm'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            Time & Sales
          </button>
        </div>

        <span className="text-[10px] text-[#787b86] font-mono">
          Spread: {orderBook.spread.toFixed(2)}
        </span>
      </div>

      {activeTab === 'dom' ? (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-3 px-3 py-1.5 text-[10px] text-[#787b86] font-mono border-b border-[#2a2e39]">
            <span>Price</span>
            <span className="text-right">Size</span>
            <span className="text-right">Total</span>
          </div>

          {/* Asks (Red - selling orders, displayed in reverse order) */}
          <div className="flex-1 flex flex-col-reverse justify-end overflow-hidden divide-y divide-[#2a2e39]/30">
            {orderBook.asks.slice(0, 7).map((ask, idx) => (
              <div
                key={`ask-${idx}`}
                onClick={() => onPlaceLimitOrder(ask.price, 'sell')}
                className="relative grid grid-cols-3 px-3 py-1 font-mono text-[11px] hover:bg-[#262b36] cursor-pointer group"
                title={`Click to place SELL Limit @ $${ask.price}`}
              >
                {/* Visual red depth bar */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-[#f23645]/15 pointer-events-none transition-all"
                  style={{ width: `${ask.depthPercent}%` }}
                />
                <span className="text-[#f23645] font-semibold tabular-nums z-10">
                  {ask.price.toFixed(symbol.category === 'forex' ? 4 : 2)}
                </span>
                <span className="text-right text-[#d1d4dc] tabular-nums z-10">
                  {ask.size}
                </span>
                <span className="text-right text-[#787b86] tabular-nums z-10">
                  {ask.total}
                </span>
              </div>
            ))}
          </div>

          {/* Current Market Price Spread Bar */}
          <div className="py-1.5 px-3 bg-[#131722] border-y border-[#2a2e39] flex items-center justify-between font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-[#f0f3fa] tabular-nums">
                ${symbol.price.toFixed(symbol.category === 'forex' ? 4 : 2)}
              </span>
              <span
                className={`text-[10px] font-semibold ${
                  symbol.changePercent >= 0 ? 'text-[#089981]' : 'text-[#f23645]'
                }`}
              >
                {symbol.changePercent >= 0 ? '▲' : '▼'}{' '}
                {Math.abs(symbol.changePercent).toFixed(2)}%
              </span>
            </div>
            <span className="text-[10px] text-[#787b86]">MID</span>
          </div>

          {/* Bids (Green - buying orders) */}
          <div className="flex-1 overflow-hidden divide-y divide-[#2a2e39]/30">
            {orderBook.bids.slice(0, 7).map((bid, idx) => (
              <div
                key={`bid-${idx}`}
                onClick={() => onPlaceLimitOrder(bid.price, 'buy')}
                className="relative grid grid-cols-3 px-3 py-1 font-mono text-[11px] hover:bg-[#262b36] cursor-pointer group"
                title={`Click to place BUY Limit @ $${bid.price}`}
              >
                {/* Visual green depth bar */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-[#089981]/15 pointer-events-none transition-all"
                  style={{ width: `${bid.depthPercent}%` }}
                />
                <span className="text-[#089981] font-semibold tabular-nums z-10">
                  {bid.price.toFixed(symbol.category === 'forex' ? 4 : 2)}
                </span>
                <span className="text-right text-[#d1d4dc] tabular-nums z-10">
                  {bid.size}
                </span>
                <span className="text-right text-[#787b86] tabular-nums z-10">
                  {bid.total}
                </span>
              </div>
            ))}
          </div>

          {/* DOM Footer quick hint */}
          <div className="p-2 bg-[#1e222d] border-t border-[#2a2e39] text-[10px] text-center text-[#787b86]">
            Click any price to load into Order Ticket
          </div>
        </div>
      ) : (
        /* Time & Sales Tape */
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="grid grid-cols-3 px-3 py-1.5 text-[10px] text-[#787b86] font-mono border-b border-[#2a2e39]">
            <span>Time</span>
            <span className="text-right">Price</span>
            <span className="text-right">Shares</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#2a2e39]/30">
            {timeAndSales.map((trade) => {
              const isBuy = trade.side === 'buy';

              return (
                <div
                  key={trade.id}
                  className="grid grid-cols-3 px-3 py-1 font-mono text-[11px] hover:bg-[#262b36] transition-colors"
                >
                  <span className="text-[#787b86] tabular-nums">{trade.time}</span>
                  <span
                    className={`text-right font-semibold tabular-nums ${
                      isBuy ? 'text-[#089981]' : 'text-[#f23645]'
                    }`}
                  >
                    ${trade.price.toFixed(symbol.category === 'forex' ? 4 : 2)}
                  </span>
                  <span className="text-right text-[#d1d4dc] tabular-nums">
                    {trade.size}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="p-2 bg-[#1e222d] border-t border-[#2a2e39] text-[10px] text-center text-[#787b86]">
            Real-time Direct Market Access (DMA) Tape
          </div>
        </div>
      )}
    </div>
  );
};
