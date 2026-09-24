import React from 'react';
import { ArrowLeftRight, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';

export const QueueView = ({ items, activeHighlightId }) => {
  return (
    <div className="w-full flex flex-col items-center justify-center p-6 min-h-[380px]">
      <div className="flex items-center gap-2 mb-6 text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-full">
        <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
        <span>FIFO (First-In, First-Out) Horizontal Queue</span>
        <span className="text-slate-400 ml-1">({items.length} items)</span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700/60 rounded-2xl w-full max-w-lg h-56 p-6 text-center text-slate-500 bg-slate-900/30">
          <AlertCircle className="w-10 h-10 mb-2 text-slate-600 animate-pulse" />
          <p className="font-semibold text-slate-400 text-sm">Queue is Empty</p>
          <p className="text-xs text-slate-500 mt-1">
            Send a <code className="text-emerald-400">{"{\"type\":\"enqueue\",\"id\":\"B1\"}"}</code> event to enqueue.
          </p>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center max-w-5xl">
          {/* Header Indicators for FRONT and REAR */}
          <div className="w-full flex items-center justify-between px-6 mb-3 text-xs font-mono font-bold tracking-wider">
            {/* FRONT Pointer (Dequeue) */}
            <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-xl shadow-sm">
              <ArrowLeft className="w-4 h-4 animate-bounce-x" />
              <span>FRONT (Dequeue / Out)</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-slate-500 text-[11px] uppercase tracking-widest">
              Data Flow Direction ───►
            </div>

            {/* REAR Pointer (Enqueue) */}
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl shadow-sm">
              <span>REAR / BACK (Enqueue / In)</span>
              <ArrowRight className="w-4 h-4 animate-bounce-x" />
            </div>
          </div>

          {/* Horizontal Queue Pipe Container */}
          <div className="w-full overflow-x-auto p-4 border-t-4 border-b-4 border-slate-700 bg-slate-950/40 rounded-xl flex items-center justify-start sm:justify-center gap-3 min-h-[140px]">
            {items.map((item, idx) => {
              const isFront = idx === 0;
              const isRear = idx === items.length - 1;
              const isHighlighted = activeHighlightId === item.id;

              return (
                <div
                  key={item.uid || item.id}
                  className={`
                    relative flex-shrink-0 flex flex-col items-center justify-center w-28 h-24 rounded-2xl font-mono transition-all duration-300
                    ${isFront
                      ? 'bg-gradient-to-br from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-500/25 ring-2 ring-rose-400'
                      : isRear
                      ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400'
                      : 'bg-slate-800 text-slate-100 border border-slate-700 hover:border-slate-600'}
                    ${item.isEntering ? 'animate-slide-in-right ring-4 ring-emerald-400 scale-105' : ''}
                    ${item.isExiting ? 'animate-slide-out-left opacity-0 scale-90 ring-4 ring-rose-500' : ''}
                    ${isHighlighted ? 'ring-4 ring-amber-400 scale-110' : ''}
                  `}
                >
                  {/* Position Badge */}
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-black/30 mb-1">
                    {isFront ? 'FRONT [0]' : isRear ? `REAR [${idx}]` : `[${idx}]`}
                  </span>

                  {/* Node ID */}
                  <span className="text-xl font-bold tracking-wider">{item.id}</span>
                </div>
              );
            })}
          </div>

          {/* Pipe guide labels */}
          <div className="w-full flex justify-between px-6 mt-2 text-[10px] font-mono text-slate-500 uppercase">
            <span>◄ DEQUEUE EXIT</span>
            <span>ENQUEUE ENTRY ◄</span>
          </div>
        </div>
      )}
    </div>
  );
};
