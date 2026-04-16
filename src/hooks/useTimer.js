import { useState, useEffect, useRef, useCallback } from "react";

/**
 * useTimer — counts elapsed seconds
 * @param {number}  initialSeconds  Starting value
 * @param {boolean} autoStart       Start immediately
 * @returns {{ elapsed, isRunning, start, pause, reset, toggle }}
 */
export function useTimer(initialSeconds = 0, autoStart = false) {
  const [elapsed, setElapsed] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed(s => s + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const start  = useCallback(() => setIsRunning(true),  []);
  const pause  = useCallback(() => setIsRunning(false), []);
  const toggle = useCallback(() => setIsRunning(r => !r), []);
  const reset  = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
  }, []);

  // MM:SS formatter
  const formatted = [
    String(Math.floor(elapsed / 60)).padStart(2, "0"),
    String(elapsed % 60).padStart(2, "0"),
  ].join(":");

  return { elapsed, isRunning, formatted, start, pause, reset, toggle };
}
