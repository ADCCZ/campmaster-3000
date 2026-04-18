import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { DEFAULT_EVENTS } from "../data/defaultData";

// ── Storage fallback ──────────────────────────────────────────────────────────
const STORAGE_KEY = "campmaster3000_v1";

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw).events ?? null;
  } catch {}
  return null;
}

function saveLocal(events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ events }));
  } catch {}
}

// ── Context ───────────────────────────────────────────────────────────────────
const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [events, setEventsRaw] = useState(() => loadLocal() ?? DEFAULT_EVENTS);
  const [connected, setConnected] = useState(false);

  // Socket ref — persists without causing re-renders
  const socketRef = useRef(null);
  const suppressSync = useRef(false);

  // Wrap setEvents so every change auto-persists locally + syncs to server
  const setEvents = useCallback((updater) => {
    setEventsRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveLocal(next);
      if (socketRef.current?.connected && !suppressSync.current) {
        socketRef.current.emit("state:push", next);
      }
      return next;
    });
  }, []);

  // ── Socket.io connection ──────────────────────────────────────────────────
  useEffect(() => {
    // Connect directly to the backend on port 3001.
    // window.location.hostname dynamically resolves to whatever IP/host the user used
    // to open the page — so it works for localhost AND for other LAN devices.
    const backendUrl = import.meta.env.VITE_BACKEND_URL
      ?? `http://${window.location.hostname}:3001`;
    const socket = io(backendUrl, {
      reconnectionDelay: 2000,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      console.log("[WS] Connected to server");
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    // Server sends full state on first connect
    socket.on("state:init", (data) => {
      if (data?.events && Object.keys(data.events).length > 0) {
        suppressSync.current = true;
        setEventsRaw(data.events);
        saveLocal(data.events);
        suppressSync.current = false;
      }
    });

    // Another client pushed a state change
    socket.on("state:update", (events) => {
      if (!events || typeof events !== "object") return;
      suppressSync.current = true;
      setEventsRaw(events);
      saveLocal(events);
      suppressSync.current = false;
    });

    // Another client updated single event
    socket.on("event:updated", ({ id, data }) => {
      suppressSync.current = true;
      setEventsRaw(prev => ({ ...prev, [id]: data }));
      suppressSync.current = false;
    });

    // Another client deleted event
    socket.on("event:deleted", (id) => {
      suppressSync.current = true;
      setEventsRaw(prev => {
        const next = { ...prev };
        delete next[id];
        saveLocal(next);
        return next;
      });
      suppressSync.current = false;
    });

    return () => socket.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Event CRUD ──────────────────────────────────────────────────────────────
  const addEvent = useCallback((event) => {
    setEvents(prev => ({ ...prev, [event.id]: event }));
  }, [setEvents]);

  const updateEvent = useCallback((eventId, updates) => {
    setEvents(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], ...updates },
    }));
  }, [setEvents]);

  const deleteEvent = useCallback((eventId) => {
    setEvents(prev => {
      const next = { ...prev };
      delete next[eventId];
      return next;
    });
  }, [setEvents]);

  // ── Pin CRUD ────────────────────────────────────────────────────────────────
  const addPin = useCallback((eventId, pin) => {
    setEvents(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], pins: [...prev[eventId].pins, pin] },
    }));
  }, [setEvents]);

  const updatePin = useCallback((eventId, pinId, updates) => {
    setEvents(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        pins: prev[eventId].pins.map(p => p.id === pinId ? { ...p, ...updates } : p),
      },
    }));
  }, [setEvents]);

  const deletePin = useCallback((eventId, pinId) => {
    setEvents(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        pins: prev[eventId].pins.filter(p => p.id !== pinId),
      },
    }));
  }, [setEvents]);

  // ── Team CRUD ───────────────────────────────────────────────────────────────
  const addTeam = useCallback((eventId, team) => {
    setEvents(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], teams: [...prev[eventId].teams, team] },
    }));
  }, [setEvents]);

  const updateTeam = useCallback((eventId, teamId, updates) => {
    setEvents(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        teams: prev[eventId].teams.map(t => t.id === teamId ? { ...t, ...updates } : t),
      },
    }));
  }, [setEvents]);

  const deleteTeam = useCallback((eventId, teamId) => {
    setEvents(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        teams: prev[eventId].teams.filter(t => t.id !== teamId),
      },
    }));
  }, [setEvents]);

  // ── Tree ────────────────────────────────────────────────────────────────────
  const updateTree = useCallback((eventId, newTree) => {
    setEvents(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], tree: newTree },
    }));
  }, [setEvents]);

  // ── Scores ──────────────────────────────────────────────────────────────────
  const adjustScore = useCallback((eventId, teamId, delta) => {
    setEvents(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        teams: prev[eventId].teams.map(t =>
          t.id === teamId ? { ...t, score: Math.max(0, t.score + delta) } : t
        ),
      },
    }));
  }, [setEvents]);

  const setScore = useCallback((eventId, teamId, value) => {
    setEvents(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        teams: prev[eventId].teams.map(t =>
          t.id === teamId ? { ...t, score: Math.max(0, Number(value) || 0) } : t
        ),
      },
    }));
  }, [setEvents]);

  const adjustStationScore = useCallback((eventId, stationId, teamId, delta) => {
    setEvents(prev => {
      const event = prev[eventId];
      const current = event.stationScores?.[stationId]?.[teamId] ?? 0;
      return {
        ...prev,
        [eventId]: {
          ...event,
          stationScores: {
            ...(event.stationScores ?? {}),
            [stationId]: {
              ...(event.stationScores?.[stationId] ?? {}),
              [teamId]: Math.max(0, current + delta),
            },
          },
        },
      };
    });
  }, [setEvents]);

  // ── Station statuses ────────────────────────────────────────────────────────
  const updateStationStatus = useCallback((eventId, pinId, status) => {
    setEvents(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        stationStatuses: {
          ...(prev[eventId].stationStatuses ?? {}),
          [pinId]: status,
        },
      },
    }));
  }, [setEvents]);

  // ── Team station statuses ───────────────────────────────────────────────────
  const updateTeamStationStatus = useCallback((eventId, pinId, teamId, status) => {
    setEvents(prev => {
      const ev = prev[eventId];
      return {
        ...prev,
        [eventId]: {
          ...ev,
          teamStationStatuses: {
            ...(ev.teamStationStatuses ?? {}),
            [pinId]: { ...(ev.teamStationStatuses?.[pinId] ?? {}), [teamId]: status },
          },
        },
      };
    });
  }, [setEvents]);

  // ── Action log ──────────────────────────────────────────────────────────────
  const addLogEntry = useCallback((eventId, entry) => {
    setEvents(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        actionLog: [entry, ...(prev[eventId].actionLog ?? [])].slice(0, 50),
      },
    }));
  }, [setEvents]);

  // ── Live state ──────────────────────────────────────────────────────────────
  const updateLiveState = useCallback((eventId, updates) => {
    setEvents(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        liveState: { ...prev[eventId].liveState, ...updates },
      },
    }));
  }, [setEvents]);

  // ── Reset ────────────────────────────────────────────────────────────────────
  const resetToDefaults = useCallback(() => {
    setEvents(DEFAULT_EVENTS);
  }, [setEvents]);

  const value = {
    events,
    connected,
    addEvent, updateEvent, deleteEvent,
    addPin, updatePin, deletePin,
    addTeam, updateTeam, deleteTeam,
    updateTree,
    adjustScore, setScore, adjustStationScore,
    updateStationStatus, updateTeamStationStatus,
    addLogEntry,
    updateLiveState,
    resetToDefaults,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
