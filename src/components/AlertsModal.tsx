import React, { useState } from 'react';
import { MarketSymbol, PriceAlert } from '../types/market';
import { Bell, X, Trash2, CheckCircle2, AlertTriangle, Plus } from 'lucide-react';

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSymbol: MarketSymbol;
  alerts: PriceAlert[];
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt'>) => void;
  onDeleteAlert: (id: string) => void;
  onToggleAlert: (id: string) => void;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({
  isOpen,
  onClose,
  activeSymbol,
  alerts,
  onAddAlert,
  onDeleteAlert,
  onToggleAlert,
}) => {
  const [targetPrice, setTargetPrice] = useState(activeSymbol.price.toString());
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(targetPrice);
    if (isNaN(priceNum)) return;

    onAddAlert({
      symbol: activeSymbol.symbol,
      targetPrice: priceNum,
      condition,
      active: true,
      note: note || `Alert on ${activeSymbol.symbol} crossing ${condition} $${priceNum}`,
    });
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#1e222d] border border-[#2a2e39] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2e39] bg-[#181b24]">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#2962ff]" />
            <h3 className="text-base font-bold text-[#f0f3fa]">
              Price Alert Manager
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#787b86] hover:text-[#f0f3fa] rounded-lg hover:bg-[#2a2e39]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create Alert Form */}
        <form onSubmit={handleSubmit} className="p-4 bg-[#131722] border-b border-[#2a2e39] space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#f0f3fa]">
              New Alert on {activeSymbol.symbol}
            </span>
            <span className="font-mono text-[#787b86]">
              Current: ${activeSymbol.price.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#787b86] block mb-1">Trigger Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as 'above' | 'below')}
                className="w-full bg-[#1e222d] border border-[#2a2e39] rounded-lg px-3 py-1.5 text-xs text-[#f0f3fa] focus:outline-none"
              >
                <option value="above">Crosses Above (≥)</option>
                <option value="below">Crosses Below (≤)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#787b86] block mb-1">Target Price ($)</label>
              <input
                type="number"
                step="any"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="w-full bg-[#1e222d] border border-[#2a2e39] rounded-lg px-3 py-1.5 text-xs font-mono text-[#f0f3fa] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#787b86] block mb-1">Alert Message / Note (Optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Breakout retest confirmed, look for entry..."
              className="w-full bg-[#1e222d] border border-[#2a2e39] rounded-lg px-3 py-1.5 text-xs text-[#f0f3fa] placeholder-[#787b86] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-[#2962ff] hover:bg-[#1e53e5] text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Create Alert</span>
          </button>
        </form>

        {/* Existing Alerts List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#2a2e39] p-2">
          {alerts.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#787b86]">
              No alerts set. Create an alert above to get notified of price milestones!
            </div>
          ) : (
            alerts.map((al) => (
              <div
                key={al.id}
                className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-[#262b36] rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    onClick={() => onToggleAlert(al.id)}
                    className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                      al.active
                        ? 'bg-[#2962ff] border-[#2962ff] text-white'
                        : 'border-[#787b86] text-transparent'
                    }`}
                  >
                    ✓
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#f0f3fa]">{al.symbol}</span>
                      <span className="font-mono text-[#787b86]">
                        {al.condition === 'above' ? '≥' : '≤'} ${al.targetPrice.toFixed(2)}
                      </span>
                    </div>
                    {al.note && (
                      <div className="text-[11px] text-[#787b86] mt-0.5 truncate max-w-[280px]">
                        {al.note}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      al.active
                        ? 'bg-[#089981]/20 text-[#089981]'
                        : 'bg-[#2a2e39] text-[#787b86]'
                    }`}
                  >
                    {al.active ? 'Active' : 'Muted'}
                  </span>
                  <button
                    onClick={() => onDeleteAlert(al.id)}
                    className="p-1 text-[#787b86] hover:text-[#f23645] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
