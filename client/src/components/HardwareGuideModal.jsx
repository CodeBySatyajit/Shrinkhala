import React, { useState } from 'react';
import { X, Cpu, Copy, Check, Terminal, Wifi } from 'lucide-react';

export const HardwareGuideModal = ({ isOpen, onClose }) => {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const protocolExamples = [
    {
      label: 'Switch Structure',
      desc: 'Changes active data structure',
      json: '{"type":"structure","structure":"stack"}'
    },
    {
      label: 'Stack Push / Pop',
      desc: 'Pushes element to top or pops',
      json: '{"type":"push","id":"A1"}   {"type":"pop"}'
    },
    {
      label: 'Queue Enqueue / Dequeue',
      desc: 'Enqueues at rear or dequeues front',
      json: '{"type":"enqueue","id":"B2"}   {"type":"dequeue"}'
    },
    {
      label: 'Linked List Insert / Remove',
      desc: 'Inserts after node (or null for head) / removes node',
      json: '{"type":"insert","id":"C3","after":"B2"}   {"type":"remove","id":"C3"}'
    },
    {
      label: 'Full State Snapshot',
      desc: 'Replaces current structure state',
      json: '{"type":"snapshot","structure":"queue","items":[{"id":"A1"},{"id":"B2"}]}'
    }
  ];

  const arduinoSnippet = `// ESP32 WebSocket Connection snippet
#include <WiFi.h>
#include <WebSocketsClient.h>

WebSocketsClient webSocket;

void setup() {
  WiFi.begin("YOUR_SSID", "YOUR_PASSWORD");
  while (WiFi.status() != WL_CONNECTED) delay(500);

  // Connect to Node.js backend relay server
  webSocket.begin("192.168.1.100", 5000, "/");
}

void loop() {
  webSocket.loop();
  
  // Example: send a push event
  webSocket.sendTXT("{\\"type\\":\\"push\\",\\"id\\":\\"42\\"}");
  delay(5000);
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-base font-bold text-white">ESP32 Hardware & Protocol Guide</h2>
              <p className="text-xs text-slate-400">
                How to link your ESP32 microcontroller to the TDS Kit Visualizer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {/* Quick Steps */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-2">
              1. Hardware Setup Workflow
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800 font-sans">
              <li>Ensure your PC and ESP32 are connected to the <strong>same Wi-Fi network</strong>.</li>
              <li>Find your PC's local IP address (on Windows run <code className="text-sky-300">ipconfig</code>, e.g. <code className="text-sky-300">192.168.1.X</code>).</li>
              <li>Open <code className="text-sky-300">firmware/esp32_tds_demo.ino</code> in Arduino IDE or VS Code PlatformIO.</li>
              <li>Set your Wi-Fi SSID, password, and the PC's IP address.</li>
              <li>Flash the sketch to your ESP32. The ESP32 will connect to <code className="text-sky-300">ws://&lt;PC_IP&gt;:5000</code>.</li>
            </ol>
          </div>

          {/* JSON Protocol */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
              2. Fixed JSON Event Protocol Specification
            </h3>
            <div className="space-y-2">
              {protocolExamples.map((item, idx) => (
                <div key={idx} className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl font-mono text-xs">
                  <div className="flex justify-between items-center mb-1 font-sans">
                    <span className="font-semibold text-slate-200 text-xs">{item.label}</span>
                    <span className="text-[11px] text-slate-500">{item.desc}</span>
                  </div>
                  <pre className="text-emerald-300 overflow-x-auto bg-slate-900/60 p-2 rounded-lg selection:bg-emerald-500 selection:text-black">
                    {item.json}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* Arduino Code */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">
                3. ESP32 Arduino C++ Template
              </h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(arduinoSnippet);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 border border-slate-800 p-3 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto">
              {arduinoSnippet}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
