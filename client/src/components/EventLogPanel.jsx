import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Trash2, ArrowDownCircle, Check, Copy } from 'lucide-react';

export const EventLogPanel = ({ logs, onClear }) => {
  const logContainerRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // Auto-scroll to bottom when new logs arrive (if autoScroll is enabled)
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getEventBadgeColor = (type) => {
    switch (type) {
      case 'push':
      case 'enqueue':
      case 'insert':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'pop':
      case 'dequeue':
      case 'remove':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'structure':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
      case 'snapshot':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/70 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Raw Event Log (Hardware / Network)
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {logs.length} events
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
            className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-colors ${
              autoScroll
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Auto-scroll</span>
          </button>

          {/* Clear button */}
          <button
            onClick={onClear}
            disabled={logs.length === 0}
            title="Clear Event Log"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Entries Container (most recent at bottom) */}
      <div
        ref={logContainerRef}
        className="flex-1 p-3 overflow-y-auto space-y-2 font-mono text-xs max-h-[300px] min-h-[180px] bg-[#070b14]/70"
      >
        {logs.length === 0 ? (
          <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-slate-600 text-center">
            <Terminal className="w-6 h-6 mb-2 opacity-50" />
            <p className="font-sans text-xs">Waiting for incoming JSON events from ESP32 or Demo controls...</p>
          </div>
        ) : (
          logs.map((entry) => {
            const rawStr = JSON.stringify(entry.raw);
            const isCopied = copiedId === entry.id;

            return (
              <div
                key={entry.id}
                className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/70 hover:border-slate-700 transition-colors gap-2"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-500">{entry.timestamp}</span>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getEventBadgeColor(entry.raw.type)}`}>
                    {entry.raw.type}
                  </span>

                  <code className="text-slate-200 text-xs break-all selection:bg-sky-500/40">
                    {rawStr}
                  </code>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center opacity-70 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-sans text-slate-500 uppercase tracking-wider">
                    {entry.source}
                  </span>
                  <button
                    onClick={() => copyToClipboard(rawStr, entry.id)}
                    className="p-1 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded transition"
                    title="Copy JSON"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer notice */}
      <div className="px-4 py-1.5 bg-slate-950 border-t border-slate-800/80 text-[10px] text-slate-500 flex justify-between items-center font-mono">
        <span>Protocol: ESP32 WebSocket Relay JSON</span>
        <span>Latest event at bottom ⬇</span>
      </div>
    </div>
  );
};
