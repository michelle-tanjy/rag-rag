import React, { useState, useEffect } from 'react';
import { INITIAL_SYMBOLS, SECTORS_DATA } from './data/mockMarketData';
import { MarketSymbol, PaperTradePosition } from './types/market';
import { Header, ActiveTab } from './components/Header';
import { TopTickerMarquee } from './components/TopTickerMarquee';
import { OverviewView } from './components/OverviewView';
import { SuperchartView } from './components/SuperchartView';
import { HeatmapView } from './components/HeatmapView';
import { ScreenerView } from './components/ScreenerView';
import { CalendarNewsView } from './components/CalendarNewsView';
import { WatchlistSidebar } from './components/WatchlistSidebar';
import { SearchModal } from './components/SearchModal';
import { SymbolDetailModal } from './components/SymbolDetailModal';

export default function App() {
  const [symbols, setSymbols] = useState<MarketSymbol[]>(INITIAL_SYMBOLS);
  const [activeSymbol, setActiveSymbol] = useState<MarketSymbol>(
    INITIAL_SYMBOLS.find((s) => s.symbol === 'NVDA') || INITIAL_SYMBOLS[0]
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [inspectSymbol, setInspectSymbol] = useState<MarketSymbol | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Watchlist items (starts with top favorites)
  const [watchlistSymbols, setWatchlistSymbols] = useState<MarketSymbol[]>(() =>
    INITIAL_SYMBOLS.filter((s) =>
      ['SPX', 'NDX', 'BTCUSD', 'NVDA', 'AAPL', 'TSLA', 'XAUUSD', 'EURUSD'].includes(s.symbol)
    )
  );

  // Simulated paper trading portfolio
  const [accountBalance, setAccountBalance] = useState(94250.00);
  const [positions, setPositions] = useState<PaperTradePosition[]>([
    {
      id: 'pos-1',
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      side: 'buy',
      qty: 25,
      entryPrice: 142.20,
      currentPrice: 147.85,
      pnl: 141.25,
      pnlPercent: 3.97,
      timestamp: Date.now() - 3600000,
    },
    {
      id: 'pos-2',
      symbol: 'BTCUSD',
      name: 'Bitcoin / US Dollar',
      side: 'buy',
      qty: 0.15,
      entryPrice: 91400.00,
      currentPrice: 94820.00,
      pnl: 513.00,
      pnlPercent: 3.74,
      timestamp: Date.now() - 7200000,
    },
  ]);

  // Live market price tick simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setSymbols((prev) => {
        // pick 1-2 random symbols to tick
        const randomIndex = Math.floor(Math.random() * prev.length);
        const target = prev[randomIndex];
        const deltaPct = (Math.random() - 0.48) * 0.003; // slight upward bias
        const newPrice = Number((target.price * (1 + deltaPct)).toFixed(target.category === 'forex' ? 4 : 2));
        const newChange = Number((newPrice - target.open).toFixed(2));
        const newChangePct = Number(((newChange / target.open) * 100).toFixed(2));

        // update candle close
        const updatedCandles = [...target.candles];
        if (updatedCandles.length > 0) {
          const lastCandle = { ...updatedCandles[updatedCandles.length - 1] };
          lastCandle.close = newPrice;
          lastCandle.high = Math.max(lastCandle.high, newPrice);
          lastCandle.low = Math.min(lastCandle.low, newPrice);
          updatedCandles[updatedCandles.length - 1] = lastCandle;
        }

        const updatedTarget: MarketSymbol = {
          ...target,
          price: newPrice,
          change: newChange,
          changePercent: newChangePct,
          high24h: Math.max(target.high24h, newPrice),
          low24h: Math.min(target.low24h, newPrice),
          candles: updatedCandles,
          sparkline: updatedCandles.map((c) => c.close),
        };

        const next = [...prev];
        next[randomIndex] = updatedTarget;
        return next;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  // Update positions with current prices
  useEffect(() => {
    setPositions((prev) =>
      prev.map((pos) => {
        const currentSym = symbols.find((s) => s.symbol === pos.symbol);
        if (!currentSym) return pos;
        const currentPrice = currentSym.price;
        const priceDiff = pos.side === 'buy' ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice;
        const pnl = priceDiff * pos.qty;
        const pnlPercent = (priceDiff / pos.entryPrice) * 100;

        return {
          ...pos,
          currentPrice,
          pnl: Number(pnl.toFixed(2)),
          pnlPercent: Number(pnlPercent.toFixed(2)),
        };
      })
    );
  }, [symbols]);

  // Keep activeSymbol updated with latest ticked price
  useEffect(() => {
    const updated = symbols.find((s) => s.symbol === activeSymbol.symbol);
    if (updated) {
      setActiveSymbol(updated);
    }
  }, [symbols, activeSymbol.symbol]);

  // Sync dark class on document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.className = 'bg-[#131722] text-[#d1d4dc] font-sans antialiased';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.className = 'bg-[#f0f3fa] text-[#131722] font-sans antialiased';
    }
  }, [isDarkMode]);

  // Keyboard shortcut Cmd+K or Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectSymbol = (symbol: MarketSymbol) => {
    setActiveSymbol(symbol);
    setInspectSymbol(symbol);
  };

  const handleOpenSuperchart = (symbol: MarketSymbol) => {
    setActiveSymbol(symbol);
    setActiveTab('supercharts');
  };

  const handleSelectSymbolByTicker = (ticker: string) => {
    const found = symbols.find((s) => s.symbol.toUpperCase() === ticker.toUpperCase());
    if (found) {
      handleSelectSymbol(found);
    }
  };

  const handleOpenSuperchartByTicker = (ticker: string) => {
    const found = symbols.find((s) => s.symbol.toUpperCase() === ticker.toUpperCase());
    if (found) {
      handleOpenSuperchart(found);
    }
  };

  const handleAddToWatchlist = (sym: MarketSymbol) => {
    if (!watchlistSymbols.some((s) => s.symbol === sym.symbol)) {
      setWatchlistSymbols((prev) => [...prev, sym]);
    }
  };

  const handleRemoveFromWatchlist = (symbolStr: string) => {
    setWatchlistSymbols((prev) => prev.filter((s) => s.symbol !== symbolStr));
  };

  const handleExecuteTrade = (
    symbol: MarketSymbol,
    side: 'buy' | 'sell',
    qty: number,
    type: 'market' | 'limit'
  ) => {
    const cost = qty * symbol.price;
    if (side === 'buy') {
      setAccountBalance((prev) => prev - cost);
    } else {
      setAccountBalance((prev) => prev + cost);
    }

    const newPos: PaperTradePosition = {
      id: `pos-${Date.now()}`,
      symbol: symbol.symbol,
      name: symbol.name,
      side,
      qty,
      entryPrice: symbol.price,
      currentPrice: symbol.price,
      pnl: 0,
      pnlPercent: 0,
      timestamp: Date.now(),
    };

    setPositions((prev) => [newPos, ...prev]);
  };

  const handleClosePosition = (positionId: string) => {
    const pos = positions.find((p) => p.id === positionId);
    if (pos) {
      const exitValue = pos.qty * pos.currentPrice;
      setAccountBalance((prev) => prev + exitValue);
      setPositions((prev) => prev.filter((p) => p.id !== positionId));
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-[#131722] text-[#d1d4dc]' : 'bg-[#f4f6fa] text-[#131722]'}`}>
      {/* 1. Header (Strict Top Bar Contract) */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleWatchlist={() => setIsWatchlistOpen((prev) => !prev)}
        watchlistOpen={isWatchlistOpen}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        onOpenTrading={() => {
          setIsWatchlistOpen(true);
        }}
      />

      {/* 2. Top Marquee Ticker Tape */}
      <TopTickerMarquee
        symbols={symbols}
        activeSymbol={activeSymbol}
        onSelectSymbol={(sym) => {
          setActiveSymbol(sym);
          if (activeTab !== 'supercharts') {
            setInspectSymbol(sym);
          }
        }}
      />

      {/* 3. Main Content Viewport */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewView
            symbols={symbols}
            sectors={SECTORS_DATA}
            onSelectSymbol={handleSelectSymbol}
            onOpenSuperchart={handleOpenSuperchart}
          />
        )}

        {activeTab === 'supercharts' && (
          <SuperchartView
            symbol={activeSymbol}
            symbols={symbols}
            onSelectSymbol={setActiveSymbol}
            onQuickTrade={(sym, side) => {
              handleExecuteTrade(sym, side, 10, 'market');
              setIsWatchlistOpen(true);
            }}
            onOpenSearch={() => setIsSearchOpen(true)}
          />
        )}

        {activeTab === 'heatmap' && (
          <HeatmapView
            onSelectSymbolByTicker={handleSelectSymbolByTicker}
            onOpenSuperchartByTicker={handleOpenSuperchartByTicker}
          />
        )}

        {activeTab === 'screener' && (
          <ScreenerView
            symbols={symbols}
            onSelectSymbol={handleSelectSymbol}
            onOpenSuperchart={handleOpenSuperchart}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarNewsView
            onSelectSymbolByTicker={handleSelectSymbolByTicker}
          />
        )}
      </main>

      {/* Footer info strip */}
      <footer className="border-t border-[#2a2e39] py-4 px-6 text-xs text-[#787b86] flex flex-wrap items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-[#d1d4dc]">TradingView Markets</span>
          <span>·</span>
          <span>Global Financial Information Terminal</span>
          <span>·</span>
          <span>NASDAQ / NYSE / Cboe Real-time Feeds</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span>Simulation Mode: Paper Trading Active ($100k Virtual Balance)</span>
          <span>·</span>
          <span className="text-[#089981]">Market Tape: Healthy</span>
        </div>
      </footer>

      {/* Search Modal (Cmd+K) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        symbols={symbols}
        onSelectSymbol={(sym) => {
          setActiveSymbol(sym);
          if (activeTab === 'supercharts') {
            setActiveSymbol(sym);
          } else {
            setInspectSymbol(sym);
          }
        }}
      />

      {/* Symbol Detail Modal */}
      <SymbolDetailModal
        symbol={inspectSymbol}
        onClose={() => setInspectSymbol(null)}
        onOpenSuperchart={handleOpenSuperchart}
        onQuickTrade={(sym, side) => {
          handleExecuteTrade(sym, side, 10, 'market');
          setIsWatchlistOpen(true);
        }}
      />

      {/* Collapsible Right Watchlist & Paper Trading Sidebar */}
      <WatchlistSidebar
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        activeSymbol={activeSymbol}
        allSymbols={symbols}
        watchlistSymbols={watchlistSymbols}
        onSelectSymbol={(sym) => {
          setActiveSymbol(sym);
        }}
        onAddToWatchlist={handleAddToWatchlist}
        onRemoveFromWatchlist={handleRemoveFromWatchlist}
        positions={positions}
        accountBalance={accountBalance}
        onExecuteTrade={handleExecuteTrade}
        onClosePosition={handleClosePosition}
      />
    </div>
  );
}
