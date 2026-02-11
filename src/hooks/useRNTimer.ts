import { useState, useEffect, useRef } from "react";

export function useRNTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  const stop = () => {
    setIsRunning(false);
    const minutes = Math.round(elapsedSeconds / 60);
    setElapsedSeconds(0);
    return minutes;
  };
  const reset = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
  };

  const formatTime = () => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const getMinutes = () => Math.round(elapsedSeconds / 60);

  return {
    isRunning,
    elapsedSeconds,
    formattedTime: formatTime(),
    minutes: getMinutes(),
    start,
    pause,
    stop,
    reset,
  };
}
