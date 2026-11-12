import React from 'react';
import { Search, SlidersHorizontal, Moon, Sun } from 'lucide-react';

export type ActiveTab = 'overview' | 'supercharts' | 'heatmap' | 'screener' | 'calendar';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenSearch: () => void;
  onToggleWatchlist: () => void;
  watchlistOpen: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenTrading: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenSearch,
  onToggleWatchlist,
  watchlistOpen,
  isDarkMode,
  onToggleTheme,
  onOpenTrading,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-[#131722] border-b border-[#2a2e39] select-none shrink-0 sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => onTabChange('overview')}
          className="text-lg font-bold tracking-tight text-[#f0f3fa] hover:text-[#2962ff] transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-6 h-6 text-[#2962ff]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 19h16v2H4zM4 15h4v2H4zm6-6h4v8h-4zm6-6h4v14h-4z" />
          </svg>
          TradingView Markets
        </button>
      </div>

      {/* Zone 2: 4–5 clean single-line navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#787b86]">
        <button
          onClick={() => onTabChange('overview')}
          className={`cursor-pointer whitespace-nowrap shrink-0 transition-colors py-1 ${
            activeTab === 'overview'
              ? 'text-[#f0f3fa] font-semibold border-b-2 border-[#2962ff]'
              : 'hover:text-[#d1d4dc]'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => onTabChange('supercharts')}
          className={`cursor-pointer whitespace-nowrap shrink-0 transition-colors py-1 ${
            activeTab === 'supercharts'
              ? 'text-[#f0f3fa] font-semibold border-b-2 border-[#2962ff]'
              : 'hover:text-[#d1d4dc]'
          }`}
        >
          Supercharts
        </button>
        <button
          onClick={() => onTabChange('heatmap')}
          className={`cursor-pointer whitespace-nowrap shrink-0 transition-colors py-1 ${
            activeTab === 'heatmap'
              ? 'text-[#f0f3fa] font-semibold border-b-2 border-[#2962ff]'
              : 'hover:text-[#d1d4dc]'
          }`}
        >
          Heatmap
        </button>
        <button
          onClick={() => onTabChange('screener')}
          className={`cursor-pointer whitespace-nowrap shrink-0 transition-colors py-1 ${
            activeTab === 'screener'
              ? 'text-[#f0f3fa] font-semibold border-b-2 border-[#2962ff]'
              : 'hover:text-[#d1d4dc]'
          }`}
        >
          Screener
        </button>
        <button
          onClick={() => onTabChange('calendar')}
          className={`cursor-pointer whitespace-nowrap shrink-0 transition-colors py-1 ${
            activeTab === 'calendar'
              ? 'text-[#f0f3fa] font-semibold border-b-2 border-[#2962ff]'
              : 'hover:text-[#d1d4dc]'
          }`}
        >
          Calendar & News
        </button>
      </nav>

      {/* Zone 3: 1 primary action + search affordances */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#1e222d] hover:bg-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc] rounded-md text-xs border border-[#2a2e39] transition-all cursor-pointer whitespace-nowrap shrink-0"
          title="Search markets (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Search markets</span>
          <kbd className="hidden lg:inline-block px-1 py-0.5 bg-[#131722] text-[10px] text-[#787b86] rounded border border-[#2a2e39] font-mono">
            ⌘K
          </kbd>
        </button>

        <button
          onClick={onToggleWatchlist}
          className={`p-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
            watchlistOpen
              ? 'bg-[#2962ff]/10 border-[#2962ff] text-[#2962ff]'
              : 'bg-[#1e222d] border-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc]'
          }`}
          title="Toggle Watchlist Sidebar"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleTheme}
          className="p-1.5 bg-[#1e222d] hover:bg-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc] rounded-md border border-[#2a2e39] transition-colors cursor-pointer"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenTrading}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#2962ff] hover:bg-[#1e53e5] rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
        >
          Paper Trading
        </button>
      </div>
    </header>
  );
};
