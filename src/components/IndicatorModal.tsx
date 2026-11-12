import React, { useState } from 'react';
import { IndicatorConfig } from '../types/market';
import { Search, X, Check, Activity, BarChart2, Zap } from 'lucide-react';

interface IndicatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: IndicatorConfig;
  onChangeConfig: (newConfig: IndicatorConfig) => void;
}

export const IndicatorModal: React.FC<IndicatorModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const toggleIndicator = (key: keyof IndicatorConfig) => {
    onChangeConfig({
      ...config,
      [key]: !config[key],
    });
  };

  const indicatorList = [
    {
      key: 'showVWAP' as keyof IndicatorConfig,
      name: 'VWAP (Volume Weighted Average Price)',
      type: 'Volume & Trend',
      description: 'Institutional benchmark calculating ratio of value traded to total volume over session.',
      badge: 'PRO',
      color: 'text-purple-400',
    },
    {
      key: 'showVolumeProfile' as keyof IndicatorConfig,
      name: 'Volume Profile (VPVR)',
      type: 'Volume & Structure',
      description: 'Horizontal distribution of volume at price levels, calculating Point of Control (POC) and 70% Value Area.',
      badge: 'PRO',
      color: 'text-amber-400',
    },
    {
      key: 'showSupertrend' as keyof IndicatorConfig,
      name: 'Supertrend Trend Follower',
      type: 'Momentum',
      description: 'ATR-based adaptive channel signaling clear bullish and bearish regime switches.',
      badge: 'POPULAR',
      color: 'text-emerald-400',
    },
    {
      key: 'showBollinger' as keyof IndicatorConfig,
      name: 'Bollinger Bands (20, 2)',
      type: 'Volatility',
      description: 'Standard deviation envelopes plotted around a 20-period simple moving average.',
      badge: 'STANDARD',
      color: 'text-sky-400',
    },
    {
      key: 'showEMA20' as keyof IndicatorConfig,
      name: 'EMA 20 (Exponential Moving Average)',
      type: 'Trend',
      description: 'Short-term dynamic support and resistance line.',
      badge: 'TREND',
      color: 'text-amber-400',
    },
    {
      key: 'showEMA50' as keyof IndicatorConfig,
      name: 'EMA 50 (Exponential Moving Average)',
      type: 'Trend',
      description: 'Medium-term institutional trend direction baseline.',
      badge: 'TREND',
      color: 'text-blue-400',
    },
    {
      key: 'showEMA200' as keyof IndicatorConfig,
      name: 'EMA 200 (Long-Term Moving Average)',
      type: 'Trend',
      description: 'Key macro regime divider defining bull and bear markets.',
      badge: 'MACRO',
      color: 'text-rose-400',
    },
    {
      key: 'showRSI' as keyof IndicatorConfig,
      name: 'RSI 14 (Relative Strength Index)',
      type: 'Oscillator',
      description: 'Momentum oscillator measuring speed and change of price moves between 0 and 100.',
      badge: 'OSCILLATOR',
      color: 'text-purple-400',
    },
    {
      key: 'showMACD' as keyof IndicatorConfig,
      name: 'MACD (12, 26, 9)',
      type: 'Oscillator',
      description: 'Relationship between two moving averages of price with histogram oscillator.',
      badge: 'OSCILLATOR',
      color: 'text-teal-400',
    },
    {
      key: 'showVolume' as keyof IndicatorConfig,
      name: 'Volume Bars',
      type: 'Volume',
      description: 'Histogram of total contracts or shares transacted per candle bar.',
      badge: 'STANDARD',
      color: 'text-blue-400',
    },
  ];

  const filtered = indicatorList.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.type.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#1e222d] border border-[#2a2e39] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2e39] bg-[#181b24]">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#2962ff]" />
            <h3 className="text-base font-bold text-[#f0f3fa]">
              Indicators, Metrics & Strategies (PRO)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#787b86] hover:text-[#f0f3fa] rounded-lg hover:bg-[#2a2e39]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 bg-[#131722] border-b border-[#2a2e39]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#787b86] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search indicators (e.g. VWAP, Volume Profile, RSI)..."
              className="w-full bg-[#1e222d] border border-[#2a2e39] rounded-lg pl-9 pr-4 py-2 text-xs text-[#f0f3fa] placeholder-[#787b86] focus:outline-none"
            />
          </div>
        </div>

        {/* List of Indicators */}
        <div className="overflow-y-auto divide-y divide-[#2a2e39] flex-1">
          {filtered.map((item) => {
            const isActive = config[item.key];

            return (
              <div
                key={item.key}
                onClick={() => toggleIndicator(item.key)}
                className={`p-3.5 flex items-start justify-between gap-4 cursor-pointer transition-colors ${
                  isActive ? 'bg-[#2962ff]/10' : 'hover:bg-[#262b36]'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-bold text-sm ${item.color}`}>
                      {item.name}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#131722] text-[#787b86] border border-[#2a2e39]">
                      {item.badge}
                    </span>
                    <span className="text-[11px] text-[#787b86]">· {item.type}</span>
                  </div>
                  <p className="text-xs text-[#787b86] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border transition-all mt-1 ${
                    isActive
                      ? 'bg-[#2962ff] border-[#2962ff] text-white shadow'
                      : 'border-[#2a2e39] bg-[#131722] text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#181b24] border-t border-[#2a2e39] flex items-center justify-between text-xs">
          <span className="text-[#787b86]">
            Active Indicators:{' '}
            <span className="font-mono text-[#f0f3fa] font-bold">
              {Object.values(config).filter(Boolean).length}
            </span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2962ff] hover:bg-[#1e53e5] text-white font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
