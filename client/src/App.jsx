import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { VisualizerContainer } from './components/VisualizerContainer';
import { DemoControls } from './components/DemoControls';
import { EventLogPanel } from './components/EventLogPanel';
import { HistoryModal } from './components/HistoryModal';
import { HardwareGuideModal } from './components/HardwareGuideModal';
import { Esp32WifiModal } from './components/Esp32WifiModal';
import { useWebSocket } from './hooks/useWebSocket';
import { useDataStructure } from './hooks/useDataStructure';

export function App() {
  const {
    structure,
    setStructure,
    items,
    lastAction,
    eventLogs,
    activeHighlightId,
    processEvent,
    clearLogs,
    clearAll
  } = useDataStructure('stack');

  const {
    status: wsStatus,
    lastMessage,
    send: sendWsMessage,
    connect: reconnectWs,
    url: wsUrl
  } = useWebSocket();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
  const [esp32Connected, setEsp32Connected] = useState(false);

  // Handle incoming WebSocket messages from the backend relay server
  useEffect(() => {
    if (!lastMessage || !lastMessage.data) return;

    const event = lastMessage.data;

    // Initial handshake from server
    if (event.type === 'connection_ack') {
      if (event.currentStructure) {
        setStructure(event.currentStructure);
      }
      if (event.hasEsp32Connected) {
        setEsp32Connected(true);
      }
      return;
    }

    // Devices status update from server
    if (event.type === 'devices_update') {
      setEsp32Connected(Boolean(event.esp32Clients > 0));
      return;
    }

    // Process event as live event from ESP32/Relay server
    processEvent(event, 'ESP32 (Relay)');
  }, [lastMessage, processEvent, setStructure]);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Navigation & Status */}
      <Header
        wsStatus={wsStatus}
        wsUrl={wsUrl}
        onReconnect={reconnectWs}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenWifiModal={() => setIsWifiModalOpen(true)}
        esp32Connected={esp32Connected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Live Data Structure Visualizer */}
        <section className="w-full">
          <VisualizerContainer
            structure={structure}
            onSetStructure={setStructure}
            items={items}
            activeHighlightId={activeHighlightId}
            lastAction={lastAction}
          />
        </section>

        {/* Lower Control Section: Demo Controls & Event Log Panel */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive Demo & Hardware Controls (7 cols) */}
          <div className="lg:col-span-7 w-full">
            <DemoControls
              structure={structure}
              onSetStructure={setStructure}
              onProcessEvent={processEvent}
              items={items}
              onClear={clearAll}
              onSendOverWebSocket={sendWsMessage}
              isWsConnected={wsStatus === 'connected'}
            />
          </div>

          {/* Raw Event Log Panel (5 cols) */}
          <div className="lg:col-span-5 w-full h-[400px]">
            <EventLogPanel logs={eventLogs} onClear={clearLogs} />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/90 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        TDS Kit Visualizer • ESP32 Hardware Relay System • MERN Stack (Node, Express, MongoDB, React, WebSockets)
      </footer>

      {/* Modals */}
      <Esp32WifiModal
        isOpen={isWifiModalOpen}
        onClose={() => setIsWifiModalOpen(false)}
      />
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
      <HardwareGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}

export default App;
