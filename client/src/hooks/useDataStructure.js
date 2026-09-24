import { useState, useCallback, useRef } from 'react';

let uidCounter = 0;
const generateUid = (id) => `node_${id}_${Date.now()}_${++uidCounter}`;

export const useDataStructure = (initialStructure = 'stack') => {
  const [structure, setStructure] = useState(initialStructure); // 'stack' | 'queue' | 'list'
  const [items, setItems] = useState([]);
  const [lastAction, setLastAction] = useState({
    type: 'init',
    description: 'System ready',
    timestamp: new Date().toLocaleTimeString()
  });
  const [eventLogs, setEventLogs] = useState([]);
  const [activeHighlightId, setActiveHighlightId] = useState(null);

  const exitingTimerRef = useRef(null);

  // Helper to add raw log
  const addLog = useCallback((event, source = 'Hardware') => {
    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      raw: event,
      source,
      timestamp: new Date().toLocaleTimeString() + '.' + String(new Date().getMilliseconds()).padStart(3, '0')
    };
    setEventLogs((prev) => [...prev.slice(-199), logEntry]);
  }, []);

  const clearLogs = useCallback(() => {
    setEventLogs([]);
  }, []);

  // Process a protocol event (from WebSocket or Demo Mode)
  const processEvent = useCallback((event, source = 'ESP32') => {
    if (!event || !event.type) return;

    addLog(event, source);

    const now = new Date().toLocaleTimeString();

    switch (event.type) {
      case 'structure': {
        if (['stack', 'queue', 'list'].includes(event.structure)) {
          setStructure(event.structure);
          setLastAction({
            type: 'structure',
            description: `Switched structure mode to ${event.structure.toUpperCase()}`,
            timestamp: now
          });
        }
        break;
      }

      case 'snapshot': {
        const newStructure = event.structure || structure;
        if (event.structure && ['stack', 'queue', 'list'].includes(event.structure)) {
          setStructure(event.structure);
        }
        const snapshotItems = Array.isArray(event.items)
          ? event.items.map((it) => ({
              id: String(it.id),
              uid: generateUid(it.id),
              isEntering: true
            }))
          : [];
        setItems(snapshotItems);
        setLastAction({
          type: 'snapshot',
          description: `Loaded snapshot (${snapshotItems.length} items)`,
          timestamp: now
        });
        setTimeout(() => {
          setItems((curr) => curr.map((it) => ({ ...it, isEntering: false })));
        }, 350);
        break;
      }

      case 'push': {
        const val = event.id ? String(event.id) : `V${items.length + 1}`;
        const newItem = { id: val, uid: generateUid(val), isEntering: true };
        setItems((prev) => [...prev, newItem]);
        setActiveHighlightId(val);
        setLastAction({
          type: 'push',
          description: `PUSH: Added '${val}' to TOP of stack`,
          timestamp: now
        });
        setTimeout(() => {
          setItems((curr) => curr.map((it) => (it.uid === newItem.uid ? { ...it, isEntering: false } : it)));
          setActiveHighlightId(null);
        }, 400);
        break;
      }

      case 'pop': {
        setItems((prev) => {
          if (prev.length === 0) {
            setLastAction({
              type: 'pop',
              description: 'POP error: Stack is empty (Underflow)',
              timestamp: now,
              isError: true
            });
            return prev;
          }
          const target = prev[prev.length - 1];
          setActiveHighlightId(target.id);
          setLastAction({
            type: 'pop',
            description: `POP: Removed '${target.id}' from TOP of stack`,
            timestamp: now
          });

          // Mark last item as exiting
          const marked = prev.map((it, idx) => (idx === prev.length - 1 ? { ...it, isExiting: true } : it));

          setTimeout(() => {
            setItems((curr) => curr.filter((it) => !it.isExiting));
            setActiveHighlightId(null);
          }, 300);

          return marked;
        });
        break;
      }

      case 'enqueue': {
        const val = event.id ? String(event.id) : `Q${items.length + 1}`;
        const newItem = { id: val, uid: generateUid(val), isEntering: true };
        setItems((prev) => [...prev, newItem]);
        setActiveHighlightId(val);
        setLastAction({
          type: 'enqueue',
          description: `ENQUEUE: Added '${val}' to REAR of queue`,
          timestamp: now
        });
        setTimeout(() => {
          setItems((curr) => curr.map((it) => (it.uid === newItem.uid ? { ...it, isEntering: false } : it)));
          setActiveHighlightId(null);
        }, 400);
        break;
      }

      case 'dequeue': {
        setItems((prev) => {
          if (prev.length === 0) {
            setLastAction({
              type: 'dequeue',
              description: 'DEQUEUE error: Queue is empty (Underflow)',
              timestamp: now,
              isError: true
            });
            return prev;
          }
          const target = prev[0];
          setActiveHighlightId(target.id);
          setLastAction({
            type: 'dequeue',
            description: `DEQUEUE: Removed '${target.id}' from FRONT of queue`,
            timestamp: now
          });

          const marked = prev.map((it, idx) => (idx === 0 ? { ...it, isExiting: true } : it));

          setTimeout(() => {
            setItems((curr) => curr.filter((it) => !it.isExiting));
            setActiveHighlightId(null);
          }, 300);

          return marked;
        });
        break;
      }

      case 'insert': {
        const val = event.id ? String(event.id) : `N${items.length + 1}`;
        const afterVal = event.after !== undefined && event.after !== null ? String(event.after) : null;
        const newItem = { id: val, uid: generateUid(val), isEntering: true };

        setItems((prev) => {
          let updated = [...prev];
          
          if (afterVal === 'tail') {
            // Explicitly append to end of list
            updated = [...prev, newItem];
            setLastAction({
              type: 'insert',
              description: `INSERT: Node '${val}' appended at TAIL (End of list)`,
              timestamp: now
            });
          } else if (afterVal === 'head' || afterVal === null || afterVal === '') {
            // In classic CS linked lists, after: null inserts before head (new head)
            // But if user specifically selects head, it's clear
            updated = [newItem, ...prev];
            setLastAction({
              type: 'insert',
              description: `INSERT: Node '${val}' inserted at HEAD (Start of list)`,
              timestamp: now
            });
          } else {
            const idx = prev.findIndex((it) => String(it.id) === afterVal);
            if (idx !== -1) {
              updated.splice(idx + 1, 0, newItem);
              setLastAction({
                type: 'insert',
                description: `INSERT: Node '${val}' inserted after '${afterVal}'`,
                timestamp: now
              });
            } else {
              updated.push(newItem);
              setLastAction({
                type: 'insert',
                description: `INSERT: Target '${afterVal}' not found, appended '${val}' at TAIL`,
                timestamp: now
              });
            }
          }
          return updated;
        });

        setActiveHighlightId(val);
        setTimeout(() => {
          setItems((curr) => curr.map((it) => (it.uid === newItem.uid ? { ...it, isEntering: false } : it)));
          setActiveHighlightId(null);
        }, 400);
        break;
      }

      case 'remove': {
        const val = event.id ? String(event.id) : null;
        if (!val) break;

        setItems((prev) => {
          const exists = prev.some((it) => String(it.id) === val);
          if (!exists) {
            setLastAction({
              type: 'remove',
              description: `REMOVE error: Node '${val}' not found in list`,
              timestamp: now,
              isError: true
            });
            return prev;
          }

          setActiveHighlightId(val);
          setLastAction({
            type: 'remove',
            description: `REMOVE: Removed Node '${val}' and re-linked pointers`,
            timestamp: now
          });

          const marked = prev.map((it) => (String(it.id) === val ? { ...it, isExiting: true } : it));

          setTimeout(() => {
            setItems((curr) => curr.filter((it) => !it.isExiting));
            setActiveHighlightId(null);
          }, 300);

          return marked;
        });
        break;
      }

      default:
        console.warn('Unknown event type:', event);
    }
  }, [addLog]);

  const clearAll = useCallback(() => {
    setItems([]);
    setLastAction({
      type: 'clear',
      description: 'Cleared all items in structure',
      timestamp: new Date().toLocaleTimeString()
    });
  }, []);

  return {
    structure,
    setStructure,
    items,
    setItems,
    lastAction,
    eventLogs,
    activeHighlightId,
    processEvent,
    addLog,
    clearLogs,
    clearAll
  };
};
