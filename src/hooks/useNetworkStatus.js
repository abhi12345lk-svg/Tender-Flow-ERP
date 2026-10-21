import { useState, useEffect } from 'react';

/**
 * Custom hook to monitor real-time browser network connectivity
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true
  );
  const [lastChanged, setLastChanged] = useState(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastChanged(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastChanged(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    lastChanged,
  };
}
