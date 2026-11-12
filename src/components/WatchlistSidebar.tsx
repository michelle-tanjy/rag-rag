import React, { useState } from 'react';
import { MarketSymbol, PaperTradePosition } from '../types/market';
import {
  X,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldAlert,
  Target,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface WatchlistSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSymbol: MarketSymbol;
  allSymbols: MarketSymbol[];
  watchlistSymbols: MarketSymbol[];
  onSelectSymbol: (symbol: MarketSymbol) => void;
  onAddToWatchlist: (symbol: MarketSymbol) => void;
  onRemoveFromWatchlist: (symbolStr: string) => void;
  positions: PaperTradePosition[];
  accountBalance: number;
  onExecuteTrade: (
    symbol: MarketSymbol,
    side: 'buy' | 'sell',
    qty: number,
    type: 'market' | 'limit'
  ) => void;
  onClosePosition: (positionId: string) => void;
}

export const WatchlistSidebar: React.FC<WatchlistSidebarProps> = ({
  isOpen,
  onClose,
  activeSymbol,
  allSymbols,
  watchlistSymbols,
  onSelectSymbol,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  positions,
  accountBalance,
  onExecuteTrade,
  onClosePosition,
}) => {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'details' | 'trade'>('watchlist');
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy');
  const [tradeQty, setTradeQty] = useState(10);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [orderSubmittedMessage, setOrderSubmittedMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOrderSubmit = () => {
    onExecuteTrade(activeSymbol, tradeSide, tradeQty, orderType);
    setOrderSubmittedMessage(
      `Order executed: ${tradeSide.toUpperCase()} ${tradeQty} ${activeSymbol.symbol} @ $${activeSymbol.price.toFixed(2)}`
    );
    setTimeout(() => {
      setOrderSubmittedMessage(null);
    }, 3500);
  };

  const estimatedTotal = tradeQty * activeSymbol.price;

  // Day range slider math
  const dayRangePercent = Math.min(
    100,
    Math.max(
      0,
      ((activeSymbol.price - activeSymbol.low24h) /
        (activeSymbol.high24h - activeSymbol.low24h || 1)) *
        100
    )
  );

  // 52-week range slider math
  const week52RangePercent = Math.min(
    100,
    Math.max(
      0,
      ((activeSymbol.price - activeSymbol.week52Low) /
        (activeSymbol.week52High - activeSymbol.week52Low || 1)) *
        100
    )
  );

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[360px] bg-[#1e222d] border-l border-[#2a2e39] shadow-2xl flex flex-col select-none animate-in slide-in-from-right duration-200">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2e39] bg-[#181b24]">
        <div className="flex items-center gap-1 bg-[#131722] p-1 rounded-lg border border-[#2a2e39] text-xs">
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'watchlist'
                ? 'bg-[#2962ff] text-white shadow-sm'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            Watchlist
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'details'
                ? 'bg-[#2962ff] text-white shadow-sm'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('trade')}
            className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'trade'
                ? 'bg-[#2962ff] text-white shadow-sm'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            Paper Trade
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-[#787b86] hover:text-[#f0f3fa] rounded-md hover:bg-[#2a2e39] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab 1: Watchlist */}
      {activeTab === 'watchlist' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-2 bg-[#181b24] border-b border-[#2a2e39] flex items-center justify-between text-xs text-[#787b86]">
            <span>Symbol</span>
            <div className="flex gap-6">
              <span>Price</span>
              <span>Change</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#2a2e39]">
            {watchlistSymbols.map((item) => {
              const isSelected = activeSymbol.symbol === item.symbol;
              const isPositive = item.changePercent >= 0;

              return (
                <div
                  key={item.symbol}
                  onClick={() => onSelectSymbol(item)}
                  className={`flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer group ${
                    isSelected ? 'bg-[#2a2e39]' : 'hover:bg-[#262b36]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#f0f3fa] group-hover:text-[#2962ff] transition-colors">
                        {item.symbol}
                      </span>
                      <span className="text-[10px] text-[#787b86] font-mono">
                        {item.exchange}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#787b86] truncate max-w-[130px]">
                      {item.name}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right shrink-0">
                    <div>
                      <div className="font-mono tabular-nums text-xs font-semibold text-[#f0f3fa]">
                        ${item.price > 1000 ? item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.price.toFixed(2)}
                      </div>
                      <div
                        className={`font-mono tabular-nums text-[11px] font-semibold ${
                          isPositive ? 'text-[#089981]' : 'text-[#f23645]'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {item.changePercent.toFixed(2)}%
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFromWatchlist(item.symbol);
                      }}
                      className="p-1 text-[#787b86] hover:text-[#f23645] opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Watchlist Footer */}
          <div className="p-3 bg-[#181b24] border-t border-[#2a2e39] text-xs text-center text-[#787b86]">
            Click any symbol to instantly display chart & metrics
          </div>
        </div>
      )}

      {/* Tab 2: Quote Details */}
      {activeTab === 'details' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* Symbol Header */}
          <div className="pb-3 border-b border-[#2a2e39]">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-[#f0f3fa]">
                {activeSymbol.symbol}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#2962ff]/10 text-[#2962ff] text-[11px] font-semibold">
                {activeSymbol.rating}
              </span>
            </div>
            <div className="text-xs text-[#787b86]">
              {activeSymbol.name} · {activeSymbol.exchange}
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-mono tabular-nums text-2xl font-bold text-[#f0f3fa]">
                ${activeSymbol.price.toFixed(2)}
              </span>
              <span
                className={`font-mono tabular-nums text-xs font-semibold ${
                  activeSymbol.changePercent >= 0 ? 'text-[#089981]' : 'text-[#f23645]'
                }`}
              >
                {activeSymbol.changePercent >= 0 ? '+' : ''}
                {activeSymbol.change.toFixed(2)} ({activeSymbol.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Range Sliders */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[11px] text-[#787b86] mb-1">
                <span>Day Range</span>
                <span className="font-mono tabular-nums">
                  ${activeSymbol.low24h.toFixed(2)} - ${activeSymbol.high24h.toFixed(2)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#131722] rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-[#2962ff] rounded-full"
                  style={{ width: `${dayRangePercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-[#787b86] mb-1">
                <span>52-Week Range</span>
                <span className="font-mono tabular-nums">
                  ${activeSymbol.week52Low.toFixed(2)} - ${activeSymbol.week52High.toFixed(2)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#131722] rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-[#089981] rounded-full"
                  style={{ width: `${week52RangePercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Key Fundamentals Grid */}
          <div>
            <h4 className="font-bold text-[#f0f3fa] mb-2">Key Statistics</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-[#131722] rounded border border-[#2a2e39]">
                <span className="text-[#787b86] block">Market Cap</span>
                <span className="font-mono tabular-nums font-semibold text-[#f0f3fa]">
                  {activeSymbol.marketCap || 'N/A'}
                </span>
              </div>
              <div className="p-2 bg-[#131722] rounded border border-[#2a2e39]">
                <span className="text-[#787b86] block">P/E Ratio</span>
                <span className="font-mono tabular-nums font-semibold text-[#f0f3fa]">
                  {activeSymbol.pe ? activeSymbol.pe.toFixed(1) : 'N/A'}
                </span>
              </div>
              <div className="p-2 bg-[#131722] rounded border border-[#2a2e39]">
                <span className="text-[#787b86] block">EPS (TTM)</span>
                <span className="font-mono tabular-nums font-semibold text-[#f0f3fa]">
                  {activeSymbol.eps ? `$${activeSymbol.eps.toFixed(2)}` : 'N/A'}
                </span>
              </div>
              <div className="p-2 bg-[#131722] rounded border border-[#2a2e39]">
                <span className="text-[#787b86] block">24h Volume</span>
                <span className="font-mono tabular-nums font-semibold text-[#f0f3fa]">
                  {activeSymbol.volume}
                </span>
              </div>
              <div className="p-2 bg-[#131722] rounded border border-[#2a2e39]">
                <span className="text-[#787b86] block">Div Yield</span>
                <span className="font-mono tabular-nums font-semibold text-[#f0f3fa]">
                  {activeSymbol.dividendYield ? `${activeSymbol.dividendYield.toFixed(2)}%` : '0.00%'}
                </span>
              </div>
              <div className="p-2 bg-[#131722] rounded border border-[#2a2e39]">
                <span className="text-[#787b86] block">Beta (Volatility)</span>
                <span className="font-mono tabular-nums font-semibold text-[#f0f3fa]">
                  {activeSymbol.beta ? activeSymbol.beta.toFixed(2) : '1.00'}
                </span>
              </div>
            </div>
          </div>

          {/* Analyst Consensus Target */}
          {activeSymbol.analystConsensus && (
            <div className="p-3 bg-[#131722] rounded-lg border border-[#2a2e39]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[#f0f3fa]">Analyst Price Target</span>
                <span className="font-mono tabular-nums text-[#089981] font-bold">
                  ${activeSymbol.analystConsensus.targetPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-[#787b86] font-mono">
                <span>Low: ${activeSymbol.analystConsensus.lowTarget.toFixed(2)}</span>
                <span>Average: ${activeSymbol.analystConsensus.targetPrice.toFixed(2)}</span>
                <span>High: ${activeSymbol.analystConsensus.highTarget.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="font-bold text-[#f0f3fa] mb-1">About Company</h4>
            <p className="text-[#787b86] text-[11px] leading-relaxed">
              {activeSymbol.description}
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Paper Trading */}
      {activeTab === 'trade' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Account Balance Widget */}
          <div className="p-3 bg-[#131722] border border-[#2a2e39] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#787b86] block">Simulated Cash Balance</span>
              <span className="font-mono tabular-nums text-lg font-bold text-[#f0f3fa]">
                ${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#089981]/20 border border-[#089981]/30 flex items-center justify-center text-[#089981]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          {orderSubmittedMessage && (
            <div className="p-3 bg-[#089981]/15 border border-[#089981]/40 rounded-lg flex items-center gap-2 text-[#089981] text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{orderSubmittedMessage}</span>
            </div>
          )}

          {/* Order Ticket */}
          <div className="bg-[#181b24] p-3.5 rounded-xl border border-[#2a2e39] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[#f0f3fa]">
                Trade {activeSymbol.symbol}
              </span>
              <span className="font-mono tabular-nums text-xs text-[#d1d4dc]">
                ${activeSymbol.price.toFixed(2)}
              </span>
            </div>

            {/* Side Tabs (Buy / Sell) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTradeSide('buy')}
                className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  tradeSide === 'buy'
                    ? 'bg-[#089981] text-white shadow-sm'
                    : 'bg-[#131722] text-[#787b86] hover:text-[#d1d4dc]'
                }`}
              >
                BUY / LONG
              </button>
              <button
                onClick={() => setTradeSide('sell')}
                className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  tradeSide === 'sell'
                    ? 'bg-[#f23645] text-white shadow-sm'
                    : 'bg-[#131722] text-[#787b86] hover:text-[#d1d4dc]'
                }`}
              >
                SELL / SHORT
              </button>
            </div>

            {/* Order Type */}
            <div className="flex items-center gap-2">
              <span className="text-[#787b86] w-20">Order Type:</span>
              <div className="flex items-center gap-1 bg-[#131722] p-0.5 rounded border border-[#2a2e39] flex-1">
                <button
                  onClick={() => setOrderType('market')}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded cursor-pointer ${
                    orderType === 'market'
                      ? 'bg-[#2a2e39] text-[#f0f3fa]'
                      : 'text-[#787b86]'
                  }`}
                >
                  Market
                </button>
                <button
                  onClick={() => setOrderType('limit')}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded cursor-pointer ${
                    orderType === 'limit'
                      ? 'bg-[#2a2e39] text-[#f0f3fa]'
                      : 'text-[#787b86]'
                  }`}
                >
                  Limit
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between">
              <span className="text-[#787b86]">Quantity:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTradeQty(Math.max(1, tradeQty - 5))}
                  className="w-7 h-7 bg-[#131722] border border-[#2a2e39] rounded text-[#d1d4dc] font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={tradeQty}
                  onChange={(e) => setTradeQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center bg-[#131722] border border-[#2a2e39] rounded py-1 text-xs font-mono text-[#f0f3fa] focus:outline-none"
                />
                <button
                  onClick={() => setTradeQty(tradeQty + 5)}
                  className="w-7 h-7 bg-[#131722] border border-[#2a2e39] rounded text-[#d1d4dc] font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Cost Summary */}
            <div className="pt-2 border-t border-[#2a2e39] flex justify-between font-mono text-xs">
              <span className="text-[#787b86]">Estimated Total:</span>
              <span className="font-bold text-[#f0f3fa]">
                ${estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <button
              onClick={handleOrderSubmit}
              className={`w-full py-2.5 rounded-lg font-bold text-xs text-white transition-colors cursor-pointer shadow ${
                tradeSide === 'buy' ? 'bg-[#089981] hover:bg-[#067a67]' : 'bg-[#f23645] hover:bg-[#c92534]'
              }`}
            >
              Submit {tradeSide.toUpperCase()} Order
            </button>
          </div>

          {/* Open Positions List */}
          <div>
            <h4 className="font-bold text-[#f0f3fa] mb-2 flex items-center justify-between">
              <span>Open Positions ({positions.length})</span>
            </h4>

            {positions.length === 0 ? (
              <div className="p-4 bg-[#181b24] rounded-lg border border-[#2a2e39] text-center text-[#787b86] text-xs">
                No active simulated trades open. Place an order above to test strategies!
              </div>
            ) : (
              <div className="space-y-2">
                {positions.map((pos) => {
                  const isGain = pos.pnl >= 0;

                  return (
                    <div
                      key={pos.id}
                      className="p-3 bg-[#181b24] border border-[#2a2e39] rounded-lg text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-[#f0f3fa]">
                          <span
                            className={`text-[10px] uppercase px-1.5 py-0.2 rounded font-semibold ${
                              pos.side === 'buy' ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#f23645]/20 text-[#f23645]'
                            }`}
                          >
                            {pos.side}
                          </span>
                          <span>{pos.symbol}</span>
                          <span className="text-[11px] font-mono text-[#787b86]">
                            × {pos.qty}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#787b86] font-mono mt-0.5">
                          Entry: ${pos.entryPrice.toFixed(2)} · Current: ${pos.currentPrice.toFixed(2)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`font-mono tabular-nums font-bold ${
                            isGain ? 'text-[#089981]' : 'text-[#f23645]'
                          }`}
                        >
                          {isGain ? '+' : ''}${pos.pnl.toFixed(2)} ({isGain ? '+' : ''}{pos.pnlPercent.toFixed(2)}%)
                        </div>
                        <button
                          onClick={() => onClosePosition(pos.id)}
                          className="text-[10px] text-[#787b86] hover:text-[#f23645] underline mt-0.5 cursor-pointer"
                        >
                          Close Position
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
