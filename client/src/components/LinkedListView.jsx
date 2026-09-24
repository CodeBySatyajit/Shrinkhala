import React from 'react';
import { Network, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export const LinkedListView = ({ items, activeHighlightId }) => {
  return (
    <div className="w-full flex flex-col items-center justify-center p-6 min-h-[380px]">
      <div className="flex items-center gap-2 mb-6 text-xs font-semibold uppercase tracking-wider text-purple-400 bg-purple-950/60 border border-purple-800/60 px-3 py-1.5 rounded-full">
        <Network className="w-4 h-4 text-purple-400" />
        <span>Singly Linked List with Pointer Links & NULL Terminator</span>
        <span className="text-slate-400 ml-1">({items.length} nodes)</span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700/60 rounded-2xl w-full max-w-lg h-56 p-6 text-center text-slate-500 bg-slate-900/30">
          <AlertCircle className="w-10 h-10 mb-2 text-slate-600 animate-pulse" />
          <p className="font-semibold text-slate-400 text-sm">Linked List is Empty</p>
          <div className="flex items-center gap-2 font-mono text-sm mt-3 px-3 py-1 rounded bg-slate-800 border border-slate-700">
            <span className="text-purple-400">HEAD ➜</span>
            <span className="text-rose-400 font-bold">NULL</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Send an <code className="text-purple-400">{"{\"type\":\"insert\",\"id\":\"N1\",\"after\":null}"}</code> event to insert.
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto py-6 px-4 flex items-center justify-start sm:justify-center gap-2 min-h-[160px]">
          {/* HEAD Pointer */}
          <div className="flex-shrink-0 flex items-center gap-1.5 pr-2">
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-mono font-bold tracking-widest text-purple-300 bg-purple-900/50 border border-purple-700/60 px-2.5 py-1 rounded-md shadow-sm">
                HEAD
              </span>
              <span className="text-[10px] text-purple-400 font-mono mt-0.5">pointer</span>
            </div>
            <ArrowRight className="w-5 h-5 text-purple-400 stroke-[2.5]" />
          </div>

          {/* Linked List Nodes */}
          {items.map((node, index) => {
            const isHead = index === 0;
            const isTail = index === items.length - 1;
            const isHighlighted = activeHighlightId === node.id;

            return (
              <React.Fragment key={node.uid || node.id}>
                {/* Visual Node Box: Data section | Next Pointer section */}
                <div
                  className={`
                    relative flex-shrink-0 flex items-stretch rounded-2xl overflow-hidden border shadow-lg transition-all duration-300
                    ${isHead
                      ? 'border-purple-500/90 bg-slate-900 shadow-purple-500/15 ring-2 ring-purple-500/40'
                      : isTail
                      ? 'border-indigo-500/90 bg-slate-900 shadow-indigo-500/15'
                      : 'border-slate-700 bg-slate-900/90 hover:border-slate-600'}
                    ${node.isEntering ? 'animate-slide-in-right ring-4 ring-emerald-400 scale-105' : ''}
                    ${node.isExiting ? 'animate-slide-out-left opacity-0 scale-75 ring-4 ring-rose-500' : ''}
                    ${isHighlighted ? 'ring-4 ring-amber-400 scale-105 shadow-amber-500/40' : ''}
                  `}
                >
                  {/* Position Badge: HEAD / TAIL indicator */}
                  {(isHead || isTail) && (
                    <div className="absolute top-1 left-2 flex gap-1 z-10">
                      {isHead && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-500/40 text-purple-200 border border-purple-400/50">
                          HEAD
                        </span>
                      )}
                      {isTail && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-500/40 text-indigo-200 border border-indigo-400/50">
                          TAIL
                        </span>
                      )}
                    </div>
                  )}

                  {/* Data Compartment */}
                  <div className="px-4 pt-5 pb-3 min-w-[76px] flex flex-col items-center justify-center bg-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
                      data
                    </span>
                    <span className="font-mono font-bold text-lg text-white tracking-wide">
                      {node.id}
                    </span>
                  </div>

                  {/* Next Pointer Compartment */}
                  <div className="px-3 pt-5 pb-3 flex flex-col items-center justify-center bg-slate-950/80 border-l border-slate-700/60">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-0.5">
                      next
                    </span>
                    <div className="w-3.5 h-3.5 rounded-full bg-purple-500/80 border border-purple-300 shadow-sm flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                  </div>
                </div>

                {/* Connecting Arrow between nodes */}
                <div className="flex-shrink-0 flex items-center justify-center px-1">
                  <div className="w-6 h-0.5 bg-purple-500/60 relative flex items-center justify-end">
                    <ArrowRight className="w-4 h-4 text-purple-400 stroke-[3] -mr-1" />
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {/* NULL Terminator */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="px-3.5 py-3 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-300 font-mono text-sm font-bold flex flex-col items-center shadow-sm">
              <span className="tracking-wider">NULL</span>
              <span className="text-[9px] text-rose-400/80 uppercase font-sans font-normal tracking-tight">
                Terminator
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
