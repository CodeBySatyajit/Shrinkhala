import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wifi, 
  Radio, 
  Copy, 
  Check, 
  RefreshCw, 
  Play, 
  Square, 
  CheckCircle2, 
  AlertCircle, 
  Laptop, 
  Cpu, 
  ExternalLink 
} from 'lucide-react';

export const Esp32WifiModal = ({ isOpen, onClose, esp32Connected }) => {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [esp32Ip, setEsp32Ip] = useState('192.168.4.1');
  const [probeStatus, setProbeStatus] = useState(null); // { probing, success, message, latency }
  const [isCopied, setIsCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('wifi'); // 'wifi' | 'ap' | 'simulator'

  const fetchNetworkInfo = async () => {
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5000/api/network/info`);
      const data = await res.json();
      if (data.success) {
        setNetworkInfo(data);
        setIsSimulating(data.isSimulating);
      }
    } catch (e) {
      console.warn('Network info error:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNetworkInfo();
    }
  }, [isOpen]);

  const copyWsUrl = (url) => {
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleProbeEsp32 = async (targetIp) => {
    const ipToTest = targetIp || esp32Ip;
    setProbeStatus({ probing: true, message: `Probing http://${ipToTest}:80/status...` });

    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5000/api/network/probe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: ipToTest })
      });
      const data = await res.json();

      if (data.reachable) {
        setProbeStatus({
          probing: false,
          success: true,
          latency: data.latencyMs,
          message: `ESP32 reached successfully! Latency: ${data.latencyMs}ms`
        });
      } else {
        setProbeStatus({
          probing: false,
          success: false,
          message: data.message || `No HTTP response from ESP32 at ${ipToTest}`
        });
      }
    } catch (err) {
      setProbeStatus({
        probing: false,
        success: false,
        message: `Failed to probe: ${err.message}`
      });
    }
  };

  const toggleSimulator = async () => {
    setSimLoading(true);
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:5000/api/network/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' })
      });
      const data = await res.json();
      setIsSimulating(data.isSimulating);
    } catch (e) {
      console.error(e);
    } finally {
      setSimLoading(false);
    }
  };

  if (!isOpen) return null;

  const primaryWsUrl = networkInfo?.wsUrlPrimary || `ws://localhost:5000`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Connect with ESP32 Wi-Fi
                {esp32Connected ? (
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    ESP32 Online
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                    ESP32 Not Connected
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Configure Wi-Fi link between ESP32 microcontroller & TDS Kit relay server
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('wifi')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'wifi'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            1. Wi-Fi Router Link
          </button>

          <button
            onClick={() => setActiveTab('ap')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'ap'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            2. ESP32 Direct Hotspot (AP)
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'simulator'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            3. Instant Simulator
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-300">
          {/* Server IP Auto-Detection Banner */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-sky-400" />
                Your PC Server WebSocket Address (Put this in ESP32)
              </span>
              <button
                onClick={() => copyWsUrl(primaryWsUrl)}
                className="flex items-center gap-1 text-[11px] font-mono text-sky-400 hover:text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30 transition"
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{isCopied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl font-mono text-sm text-sky-300 border border-slate-800">
              <code className="flex-1 select-all">{primaryWsUrl}</code>
            </div>

            <p className="text-[11px] text-slate-500">
              Host: <span className="text-slate-300">{networkInfo?.hostname || 'Localhost'}</span> • IP: <span className="text-slate-300">{networkInfo?.primaryIp}</span> • Port: <span className="text-slate-300">{networkInfo?.serverPort || 5000}</span>
            </p>
          </div>

          {/* TAB 1: Wi-Fi Router Link */}
          {activeTab === 'wifi' && (
            <div className="space-y-4">
              {esp32Connected ? (
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-xs text-white">ESP32 Hardware Connected & Online</p>
                    <p className="text-[11px] text-emerald-300/80">Hardware is actively connected and ready to transmit events.</p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-xs text-white">ESP32 Hardware Not Connected Yet</p>
                    <p className="text-[11px] text-slate-400">
                      Follow the steps below to connect your ESP32, or test immediately using the <strong className="text-emerald-400">Tab 3: Instant Simulator</strong> or the buttons on the dashboard.
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-sky-400" />
                  Connect ESP32 via Home / Lab Wi-Fi
                </h3>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-xs">
                  <li>Ensure your PC and ESP32 are connected to the <strong>same Wi-Fi router</strong>.</li>
                  <li>In <code className="text-sky-300">firmware/esp32_tds_demo.ino</code>, set your Wi-Fi name, password, and your PC's IP (<code className="text-sky-300">{networkInfo?.primaryIp || '10.20.11.206'}</code>).</li>
                  <li>Flash the firmware to your ESP32.</li>
                  <li>The ESP32 will automatically connect to <code className="text-sky-300">{primaryWsUrl}</code> and start streaming live!</li>
                </ol>
              </div>

              {/* Probe / Ping ESP32 by IP */}
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <span className="font-bold text-slate-200 text-xs uppercase tracking-wider block">
                  Probe / Check ESP32 Status
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={esp32Ip}
                    onChange={(e) => setEsp32Ip(e.target.value)}
                    placeholder="e.g. 192.168.1.150 or 10.20.11.50"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                  />
                  <button
                    onClick={() => handleProbeEsp32(esp32Ip)}
                    disabled={probeStatus?.probing}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${probeStatus?.probing ? 'animate-spin' : ''}`} />
                    <span>{probeStatus?.probing ? 'Probing...' : 'Ping ESP32'}</span>
                  </button>
                </div>

                {probeStatus && (
                  <div
                    className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                      probeStatus.success
                        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-800 text-rose-300'
                    }`}
                  >
                    {probeStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span>{probeStatus.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Direct Hotspot Mode (SoftAP) */}
          {activeTab === 'ap' && (
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-purple-300 text-xs uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-purple-400" />
                Connect Directly to ESP32 Wi-Fi Hotspot
              </h3>
              <p className="text-slate-400 text-xs">
                If no Wi-Fi router is available, your ESP32 broadcasts its own independent Wi-Fi network!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Hotspot Name (SSID)</span>
                  <span className="text-white font-bold text-sm">ESP32-TDS-KIT</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Default Password</span>
                  <span className="text-white font-bold text-sm">12345678</span>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => handleProbeEsp32('192.168.4.1')}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition"
                >
                  <Wifi className="w-4 h-4" />
                  Test Direct Hotspot Link (192.168.4.1)
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Instant Live Simulator */}
          {activeTab === 'simulator' && (
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-emerald-300 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    Built-in ESP32 Hardware Simulator
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Streams live JSON packets through the WebSocket relay server just like physical hardware.
                  </p>
                </div>
                <button
                  onClick={toggleSimulator}
                  disabled={simLoading}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg ${
                    isSimulating
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  }`}
                >
                  {isSimulating ? (
                    <>
                      <Square className="w-4 h-4 fill-white" />
                      Stop Simulator
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      Start Simulator
                    </>
                  )}
                </button>
              </div>

              {isSimulating && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2 animate-pulse">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                  <span>
                    ESP32 Simulation stream is running actively! Watch the blocks animate in the background.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            TDS Kit Microcontroller Link • Dual-Mode (STA + SoftAP)
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
