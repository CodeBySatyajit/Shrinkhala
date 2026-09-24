import React, { useState } from 'react';
import { 
  Play, 
  Plus, 
  Minus, 
  RotateCcw, 
  Sliders, 
  Send, 
  Layers, 
  ArrowLeftRight, 
  Network, 
  Sparkles 
} from 'lucide-react';

export const DemoControls = ({
  structure,
  onSetStructure,
  onProcessEvent,
  items,
  onClear,
  onSendOverWebSocket,
  isWsConnected
}) => {
  const [elementId, setElementId] = useState('');
  const [insertAfter, setInsertAfter] = useState('');
  const [relayThroughServer, setRelayThroughServer] = useState(true);
  const [isPlayingAutoDemo, setIsPlayingAutoDemo] = useState(false);

  // Helper to trigger an event with instant local feedback + WebSocket relay
  const triggerEvent = (event) => {
    // 1. Always process locally with zero delay
    onProcessEvent(event, 'Demo (Client)');

    // 2. Also relay to server if connected
    if (relayThroughServer && isWsConnected && onSendOverWebSocket) {
      onSendOverWebSocket(event);
    }
  };

  const getNextDefaultId = () => {
    const letters = ['A', 'B', 'C', 'D', 'X', 'Y', 'Z'];
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const num = Math.floor(Math.random() * 90 + 10);
    return `${letter}${num}`;
  };

  // Stack Actions
  const handlePush = () => {
    const val = elementId.trim() || getNextDefaultId();
    triggerEvent({ type: 'push', id: val });
    setElementId('');
  };

  const handlePop = () => {
    triggerEvent({ type: 'pop' });
  };

  // Queue Actions
  const handleEnqueue = () => {
    const val = elementId.trim() || getNextDefaultId();
    triggerEvent({ type: 'enqueue', id: val });
    setElementId('');
  };

  const handleDequeue = () => {
    triggerEvent({ type: 'dequeue' });
  };

  // Linked List Actions
  const [insertPosition, setInsertPosition] = useState('tail'); // 'tail' | 'head' | 'after'
  const [selectedAfterNode, setSelectedAfterNode] = useState('');
  const [removeTarget, setRemoveTarget] = useState('');

  const handleInsert = (forcedPosition = null) => {
    const val = elementId.trim() || getNextDefaultId();
    const pos = forcedPosition || insertPosition;

    let afterVal = null;
    if (pos === 'tail') {
      afterVal = 'tail';
    } else if (pos === 'head') {
      afterVal = 'head';
    } else if (pos === 'after') {
      afterVal = selectedAfterNode || (items.length > 0 ? items[items.length - 1].id : null);
    }

    triggerEvent({ type: 'insert', id: val, after: afterVal });
    setElementId('');
  };

  const handleRemove = (targetId = null) => {
    const val = targetId || removeTarget || elementId.trim() || (items.length > 0 ? items[items.length - 1].id : null);
    if (val) {
      triggerEvent({ type: 'remove', id: val });
      setElementId('');
      setRemoveTarget('');
    }
  };

  // Switch structure mode
  const handleSwitchMode = (mode) => {
    onSetStructure(mode);
    onProcessEvent({ type: 'structure', structure: mode }, 'UI Mode Switch');
    if (isWsConnected && onSendOverWebSocket) {
      onSendOverWebSocket({ type: 'structure', structure: mode });
    }
  };

  // Load preset snapshot
  const handleLoadSnapshot = () => {
    let snapshotItems = [];
    if (structure === 'stack') {
      snapshotItems = [{ id: '10' }, { id: '20' }, { id: '30' }, { id: '40' }];
    } else if (structure === 'queue') {
      snapshotItems = [{ id: 'A1' }, { id: 'B2' }, { id: 'C3' }];
    } else {
      snapshotItems = [{ id: 'HEAD' }, { id: 'ALPHA' }, { id: 'BETA' }, { id: 'GAMMA' }];
    }
    triggerEvent({
      type: 'snapshot',
      structure: structure,
      items: snapshotItems
    });
  };

  // Auto-play demo scenario
  const runAutoDemo = async () => {
    if (isPlayingAutoDemo) return;
    setIsPlayingAutoDemo(true);

    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

    try {
      if (structure === 'stack') {
        triggerEvent({ type: 'push', id: '10' });
        await sleep(1000);
        triggerEvent({ type: 'push', id: '20' });
        await sleep(1000);
        triggerEvent({ type: 'push', id: '30' });
        await sleep(1000);
        triggerEvent({ type: 'pop' });
        await sleep(1000);
        triggerEvent({ type: 'push', id: '99' });
      } else if (structure === 'queue') {
        triggerEvent({ type: 'enqueue', id: 'Q1' });
        await sleep(1000);
        triggerEvent({ type: 'enqueue', id: 'Q2' });
        await sleep(1000);
        triggerEvent({ type: 'dequeue' });
        await sleep(1000);
        triggerEvent({ type: 'enqueue', id: 'Q3' });
        await sleep(1000);
        triggerEvent({ type: 'enqueue', id: 'Q4' });
      } else {
        triggerEvent({ type: 'insert', id: 'N1', after: null });
        await sleep(1000);
        triggerEvent({ type: 'insert', id: 'N2', after: 'N1' });
        await sleep(1000);
        triggerEvent({ type: 'insert', id: 'MID', after: 'N1' });
        await sleep(1000);
        triggerEvent({ type: 'remove', id: 'N1' });
      }
    } finally {
      setIsPlayingAutoDemo(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header and Mode switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Interactive Demo Controls
          </h3>
        </div>

        {/* Structure Mode Switcher Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => handleSwitchMode('stack')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition select-none ${
              structure === 'stack'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Stack
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode('queue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition select-none ${
              structure === 'queue'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Queue
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition select-none ${
              structure === 'list'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Linked List
          </button>
        </div>
      </div>

      {/* Target ID & Options Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-mono text-slate-400 mb-1 uppercase tracking-wider">
            Element ID (Value)
          </label>
          <input
            type="text"
            value={elementId}
            onChange={(e) => setElementId(e.target.value)}
            placeholder="e.g. A1, 42, X1"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (structure === 'stack') handlePush();
                else if (structure === 'queue') handleEnqueue();
                else handleInsert();
              }
            }}
          />
        </div>

        {structure === 'list' && (
          <div className="flex flex-col gap-1.5">
            <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Insert Position (Where to add?)
            </label>
            <div className="flex gap-1.5">
              <select
                value={insertPosition}
                onChange={(e) => setInsertPosition(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-500"
              >
                <option value="tail">At TAIL (End of list)</option>
                <option value="head">At HEAD (Start of list)</option>
                <option value="after">After specific node...</option>
              </select>

              {insertPosition === 'after' && (
                <select
                  value={selectedAfterNode}
                  onChange={(e) => setSelectedAfterNode(e.target.value)}
                  className="w-28 bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">(Select)</option>
                  {items.map((it) => (
                    <option key={it.uid || it.id} value={it.id}>
                      Node {it.id}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer bg-slate-950/60 border border-slate-800 hover:border-slate-700 p-2.5 rounded-xl transition">
            <input
              type="checkbox"
              checked={relayThroughServer && isWsConnected}
              disabled={!isWsConnected}
              onChange={(e) => setRelayThroughServer(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                <Send className="w-3 h-3 text-sky-400" />
                Relay through Server
              </span>
              <span className="text-[10px] text-slate-500">
                {isWsConnected ? 'Logs to MongoDB via WebSocket' : 'Offline: Simulating locally'}
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Structure Specific Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {structure === 'stack' && (
          <>
            <button
              type="button"
              onClick={handlePush}
              className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition shadow-lg shadow-sky-600/20 active:scale-98 cursor-pointer select-none"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              PUSH
            </button>
            <button
              type="button"
              onClick={handlePop}
              disabled={items.length === 0}
              className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition shadow-lg shadow-rose-600/20 active:scale-98 disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none"
            >
              <Minus className="w-4 h-4 stroke-[3]" />
              POP
            </button>
          </>
        )}

        {structure === 'queue' && (
          <>
            <button
              type="button"
              onClick={handleEnqueue}
              className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20 active:scale-98 cursor-pointer select-none"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              ENQUEUE (Rear)
            </button>
            <button
              type="button"
              onClick={handleDequeue}
              disabled={items.length === 0}
              className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition shadow-lg shadow-rose-600/20 active:scale-98 disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none"
            >
              <Minus className="w-4 h-4 stroke-[3]" />
              DEQUEUE (Front)
            </button>
          </>
        )}

        {structure === 'list' && (
          <>
            <button
              type="button"
              onClick={() => handleInsert('tail')}
              className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl transition shadow-lg shadow-purple-600/20 active:scale-98 cursor-pointer select-none"
              title="Append node to the end (Tail) of the list"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              INSERT AT TAIL (End)
            </button>

            <button
              type="button"
              onClick={() => handleInsert('head')}
              className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/20 active:scale-98 cursor-pointer select-none"
              title="Prepend node to the start (Head) of the list"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              INSERT AT HEAD (Start)
            </button>

            {insertPosition === 'after' && (
              <button
                type="button"
                onClick={() => handleInsert('after')}
                className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl transition shadow-lg shadow-fuchsia-600/20 active:scale-98 cursor-pointer select-none"
                title={`Insert after selected node`}
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                INSERT AFTER {selectedAfterNode || 'NODE'}
              </button>
            )}

            <button
              type="button"
              onClick={() => handleRemove()}
              disabled={items.length === 0}
              className="min-w-[100px] flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-3 py-2.5 rounded-xl transition shadow-lg shadow-rose-600/20 active:scale-98 disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none"
            >
              <Minus className="w-4 h-4 stroke-[3]" />
              REMOVE
            </button>
          </>
        )}

        {/* Snapshot Preset */}
        <button
          type="button"
          onClick={handleLoadSnapshot}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer select-none"
          title="Load snapshot preset"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Snapshot
        </button>

        {/* Auto Scenario */}
        <button
          type="button"
          onClick={runAutoDemo}
          disabled={isPlayingAutoDemo}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-indigo-900/60 hover:bg-indigo-800/80 border border-indigo-700/60 text-indigo-200 text-xs font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer select-none"
          title="Play automated event sequence"
        >
          <Play className={`w-3.5 h-3.5 ${isPlayingAutoDemo ? 'animate-spin' : ''}`} />
          {isPlayingAutoDemo ? 'Playing...' : 'Run Scenario'}
        </button>

        {/* Reset / Clear */}
        <button
          type="button"
          onClick={onClear}
          className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 border border-slate-800 rounded-xl transition cursor-pointer select-none"
          title="Clear all nodes"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
