import { useState, useEffect, useCallback } from 'react';

interface CountdownResult {
  timeLeft: string;
  isUrgent: boolean; // < 1 hour
  isExpired: boolean;
}

export function useCountdown(endDate: any): CountdownResult {
  const [result, setResult] = useState<CountdownResult>({
    timeLeft: "Calculating...",
    isUrgent: false,
    isExpired: false,
  });

  const calculateTime = useCallback(() => {
    if (!endDate) return;

    // Convert Firebase Timestamp to Date if necessary
    const targetDate = typeof endDate.toDate === 'function' 
      ? endDate.toDate() 
      : new Date(endDate);

    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();

    if (difference <= 0) {
      setResult({
        timeLeft: "Expired",
        isUrgent: false,
        isExpired: true,
      });
      return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    const totalHours = Math.floor(difference / (1000 * 60 * 60));
    const isUrgent = totalHours < 1;

    let timeLeft = "";
    if (days > 0) {
      timeLeft = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours > 0) {
      timeLeft = `${hours}h ${minutes}m ${seconds}s`;
    } else {
      timeLeft = `${minutes}m ${seconds}s`;
    }

    setResult({
      timeLeft,
      isUrgent,
      isExpired: false,
    });
  }, [endDate]);

  useEffect(() => {
    if (!endDate) return;

    // Initial calculation
    calculateTime();

    // Always update every 1 second to show running seconds
    const interval = setInterval(calculateTime, 1000);
    
    return () => clearInterval(interval);
  }, [endDate, calculateTime]);

  return result;
}
