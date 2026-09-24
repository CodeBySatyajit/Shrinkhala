import React from 'react';
import { Cpu, Wifi, WifiOff, History, BookOpen, RefreshCw, Radio } from 'lucide-react';

export const Header = ({
  wsStatus,
  wsUrl,
  onReconnect,
  onOpenHistory,
  onOpenHelp,
  onOpenWifiModal
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg shadow-black/20">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-500/25 ring-1 ring-white/20">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>TDS Kit Visualizer</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                v1.0 Live
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Real-time data structures driven by ESP32 hardware WebSocket events
          </p>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
        {/* Prominent 'Connect with ESP32 Wi-Fi' Button */}
        <button
          onClick={onOpenWifiModal}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-600 hover:from-sky-500 hover:to-indigo-500 border border-sky-400/40 transition shadow-lg shadow-sky-500/20 active:scale-98"
        >
          <Wifi className="w-4 h-4 text-white animate-pulse" />
          <span>Connect ESP32 Wi-Fi</span>
        </button>

        {/* WebSocket Connection Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-slate-900/90 text-xs font-mono shadow-sm">
          {wsStatus === 'connected' ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-semibold hidden sm:inline">
                Relay Online
              </span>
            </>
          ) : wsStatus === 'connecting' ? (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-amber-400 font-semibold">Connecting...</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
              <span className="text-rose-400 font-semibold">Offline</span>
            </>
          )}

          {wsStatus !== 'connected' && (
            <button
              onClick={onReconnect}
              title="Reconnect WebSocket"
              className="ml-1 text-slate-400 hover:text-sky-300 transition"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* MongoDB History button */}
        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition"
          title="Inspect MongoDB Events collection"
        >
          <History className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden lg:inline">MongoDB History</span>
        </button>

        {/* Hardware Guide button */}
        <button
          onClick={onOpenHelp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition"
          title="ESP32 Wiring & Protocol Guide"
        >
          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden lg:inline">Guide</span>
        </button>
      </div>
    </header>
  );
};
