import React from 'react';
import { StackView } from './StackView';
import { QueueView } from './QueueView';
import { LinkedListView } from './LinkedListView';
import { Activity, Clock } from 'lucide-react';

export const VisualizerContainer = ({
  structure,
  items,
  activeHighlightId,
  lastAction
}) => {
  return (
    <div className="flex flex-col bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
      {/* Top Status Bar: Live State & Action Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-3.5 bg-slate-950/70 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Active Structure:
          </span>
          <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full uppercase ${
            structure === 'stack'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              : structure === 'queue'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
          }`}>
            {structure}
          </span>
        </div>

        {/* Last Action Notification Badge */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500 text-[11px]">{lastAction.timestamp}:</span>
          <span
            className={`font-semibold ${
              lastAction.isError ? 'text-rose-400' : 'text-slate-200'
            }`}
          >
            {lastAction.description}
          </span>
        </div>
      </div>

      {/* Render Area with subtle grid pattern */}
      <div className="relative w-full flex-1 flex items-center justify-center bg-grid-pattern bg-[#070b14]/50 overflow-hidden">
        {structure === 'stack' && (
          <StackView items={items} activeHighlightId={activeHighlightId} />
        )}
        {structure === 'queue' && (
          <QueueView items={items} activeHighlightId={activeHighlightId} />
        )}
        {structure === 'list' && (
          <LinkedListView items={items} activeHighlightId={activeHighlightId} />
        )}
      </div>

      {/* Bottom Summary Bar */}
      <div className="px-6 py-2.5 bg-slate-950/90 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
        <div>
          <span>Total Nodes: </span>
          <strong className="text-white">{items.length}</strong>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <span>Animation: Enabled (CSS keyframes)</span>
          <span>•</span>
          <span>Source: ESP32 WebSocket Relay</span>
        </div>
      </div>
    </div>
  );
};
