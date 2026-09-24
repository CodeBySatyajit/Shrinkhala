import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Database, Trash2, Calendar, Layers } from 'lucide-react';

export const HistoryModal = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [source, setSource] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const host = window.location.hostname || 'localhost';
      const url = `http://${host}:5000/api/events?limit=50${selectedFilter !== 'all' ? `&structure=${selectedFilter}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setEvents(data.events || []);
        setSource(data.source);
      } else {
        setError(data.error || 'Failed to fetch history');
      }
    } catch (err) {
      setError(`Cannot reach backend API at http://localhost:5000 (${err.message})`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearDatabaseEvents = async () => {
    if (!window.confirm('Are you sure you want to clear all logged events from MongoDB?')) return;
    try {
      const host = window.location.hostname || 'localhost';
      await fetch(`http://${host}:5000/api/events`, { method: 'DELETE' });
      fetchHistory();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, selectedFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-base font-bold text-white">MongoDB Event History</h2>
              <p className="text-xs text-slate-400">
                Logged events from ESP32 clients ({events.length} records retrieved)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchHistory}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[11px] mr-1">Filter:</span>
            {['all', 'stack', 'queue', 'list'].map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`px-2.5 py-1 rounded-lg uppercase font-mono text-[11px] font-semibold transition ${
                  selectedFilter === f
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-400">
              Source: <strong className="text-sky-300 uppercase">{source || 'API'}</strong>
            </span>
            <button
              onClick={clearDatabaseEvents}
              className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 hover:underline"
            >
              <Trash2 className="w-3 h-3" />
              Clear DB
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {events.length === 0 && !isLoading && !error && (
            <div className="py-16 text-center text-slate-500 text-sm">
              No logged events found in the database for this filter.
            </div>
          )}

          {events.map((ev, idx) => (
            <div
              key={ev._id || idx}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-xs gap-2"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-slate-500 text-[10px]">#{idx + 1}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold uppercase">
                  {ev.type}
                </span>
                <span className="text-sky-300 font-semibold">
                  {ev.id ? `id: "${ev.id}"` : '(no id)'}
                </span>
                {ev.after !== undefined && ev.after !== null && (
                  <span className="text-purple-300">after: "{ev.after}"</span>
                )}
                <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                  structure: {ev.structure}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-sans">
                <Calendar className="w-3 h-3 text-slate-600" />
                <span>{new Date(ev.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
