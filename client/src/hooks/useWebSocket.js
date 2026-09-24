import { useState, useEffect, useRef, useCallback } from 'react';

export const useWebSocket = (customUrl = null) => {
  const [status, setStatus] = useState('disconnected'); // 'connected' | 'connecting' | 'disconnected'
  const [latency, setLatency] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingStartRef = useRef(null);

  // Compute WebSocket URL
  const getWsUrl = useCallback(() => {
    if (customUrl) return customUrl;
    if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
    const host = window.location.hostname || 'localhost';
    return `ws://${host}:5000`;
  }, [customUrl]);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const targetUrl = getWsUrl();
    setStatus('connecting');

    try {
      const socket = new WebSocket(targetUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log('[WebSocket Client] Connected to', targetUrl);
        setStatus('connected');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage({
            data,
            receivedAt: new Date().toISOString()
          });
        } catch (e) {
          console.error('[WebSocket Client] Failed to parse message:', event.data);
        }
      };

      socket.onerror = (err) => {
        console.warn('[WebSocket Client] Connection error:', err);
      };

      socket.onclose = (event) => {
        console.log(`[WebSocket Client] Disconnected (code: ${event.code})`);
        setStatus('disconnected');
        wsRef.current = null;

        // Auto-reconnect after 3 seconds
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[WebSocket Client] Attempting to reconnect...');
            reconnectTimeoutRef.current = null;
            connect();
          }, 3000);
        }
      };
    } catch (err) {
      console.error('[WebSocket Client] Setup error:', err);
      setStatus('disconnected');
    }
  }, [getWsUrl]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  const send = useCallback((payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const msg = typeof payload === 'string' ? payload : JSON.stringify(payload);
      wsRef.current.send(msg);
      return true;
    }
    console.warn('[WebSocket Client] Cannot send message, socket is not OPEN');
    return false;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    status,
    latency,
    lastMessage,
    send,
    connect,
    disconnect,
    url: getWsUrl()
  };
};
