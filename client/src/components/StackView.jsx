import React from 'react';
import { Layers, ArrowUp, AlertCircle } from 'lucide-react';

export const StackView = ({ items, activeHighlightId }) => {
  // Items in stack: bottom is index 0, top is index items.length - 1
  // We display top items at the top visually: reversed order
  const displayItems = [...items].map((it, originalIdx) => ({
    ...it,
    index: originalIdx,
    isTop: originalIdx === items.length - 1
  })).reverse();

  return (
    <div className="w-full flex flex-col items-center justify-center p-6 min-h-[380px]">
      <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-sky-400 bg-sky-950/60 border border-sky-800/60 px-3 py-1.5 rounded-full">
        <Layers className="w-4 h-4 text-sky-400" />
        <span>LIFO (Last-In, First-Out) Vertical Stack</span>
        <span className="text-slate-400 ml-1">({items.length} items)</span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700/60 rounded-2xl w-full max-w-sm h-64 p-6 text-center text-slate-500 bg-slate-900/30">
          <AlertCircle className="w-10 h-10 mb-2 text-slate-600 animate-pulse" />
          <p className="font-semibold text-slate-400 text-sm">Stack is Empty</p>
          <p className="text-xs text-slate-500 mt-1">
            Send a <code className="text-sky-400">{"{\"type\":\"push\",\"id\":\"A1\"}"}</code> event to push onto the stack.
          </p>
        </div>
      ) : (
        <div className="w-full max-w-md flex flex-col items-center">
          {/* Top of Stack Pointer */}
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full mb-3 shadow-lg shadow-amber-500/5 animate-pulse">
            <ArrowUp className="w-3.5 h-3.5" />
            <span>TOP OF STACK (Push / Pop Pointer)</span>
          </div>

          {/* Stack Container Container with side borders resembling a bucket */}
          <div className="w-full relative px-6 pt-3 pb-4 border-l-4 border-r-4 border-b-4 border-slate-700 bg-slate-950/40 rounded-b-2xl shadow-inner min-h-[220px] flex flex-col justify-end gap-2.5">
            {displayItems.map((item) => {
              const isHighlighted = activeHighlightId === item.id;
              return (
                <div
                  key={item.uid || item.id}
                  className={`
                    relative flex items-center justify-between px-5 py-3.5 rounded-xl font-mono text-base font-bold transition-all duration-300
                    ${item.isTop 
                      ? 'bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25 ring-2 ring-sky-300/80' 
                      : 'bg-slate-800/90 hover:bg-slate-750 text-slate-100 border border-slate-700/80 shadow-md'}
                    ${item.isEntering ? 'animate-slide-in-top ring-2 ring-emerald-400 scale-105' : ''}
                    ${item.isExiting ? 'animate-slide-out-top opacity-0 scale-95 ring-2 ring-rose-500' : ''}
                    ${isHighlighted ? 'ring-4 ring-amber-400 shadow-amber-500/40' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-mono ${item.isTop ? 'bg-black/30 text-sky-200' : 'bg-slate-900/60 text-slate-400'}`}>
                      [{item.index}]
                    </span>
                    <span className="tracking-wide text-lg">{item.id}</span>
                  </div>

                  {item.isTop && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-md shadow-sm">
                      <ArrowUp className="w-3 h-3 stroke-[3]" />
                      TOP
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stack Base Label */}
          <div className="mt-2 text-[11px] font-mono tracking-widest text-slate-500 uppercase">
            ── STACK BASE ──
          </div>
        </div>
      )}
    </div>
  );
};
