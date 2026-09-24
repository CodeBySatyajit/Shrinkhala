import React from 'react';
import { Cpu, Wifi, WifiOff, History, BookOpen, RefreshCw } from 'lucide-react';

export const Header = ({
  wsStatus,
  wsUrl,
  onReconnect,
  onOpenHistory,
  onOpenHelp
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-500/20 ring-1 ring-white/20">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
              <span>TDS Kit Visualizer</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                v1.0
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Real-time data structures driven by ESP32 microcontroller WebSocket events
          </p>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        {/* Connection Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-slate-900/90 text-xs font-mono shadow-sm">
          {wsStatus === 'connected' ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5 inline" />
                Relay Connected
              </span>
            </>
          ) : wsStatus === 'connecting' ? (
            <>
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-amber-400 font-semibold">Connecting...</span>
            </>
          ) : (
            <>
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
              <span className="text-rose-400 font-semibold flex items-center gap-1">
                <WifiOff className="w-3.5 h-3.5 inline" />
                Disconnected (Demo Mode)
              </span>
            </>
          )}

          {wsStatus !== 'connected' && (
            <button
              onClick={onReconnect}
              title="Attempt to reconnect to WebSocket server"
              className="ml-1 text-slate-400 hover:text-sky-300 transition"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* MongoDB History button */}
        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition shadow-sm"
        >
          <History className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">MongoDB History</span>
        </button>

        {/* ESP32 Hardware Info button */}
        <button
          onClick={onOpenHelp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition shadow-sm"
        >
          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">ESP32 Guide</span>
        </button>
      </div>
    </header>
  );
};
