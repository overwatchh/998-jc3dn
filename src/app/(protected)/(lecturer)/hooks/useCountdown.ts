import { useState, useEffect } from "react";

export function useCountdown() {
  const [validityDuration, setValidityDuration] = useState(15);
  // Calculate remaining time for the validity timer
  const [remainingTime, setRemainingTime] = useState(validityDuration * 60); // Start with full duration
  const [isExpired, setIsExpired] = useState(false);

  // Real countdown timer effect
  useEffect(() => {
    if (remainingTime <= 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingTime]);

  // Reset timer when validity duration changes
  useEffect(() => {
    setRemainingTime(validityDuration * 60);
    setIsExpired(false);
  }, [validityDuration]);

  return {
    validityDuration,
    remainingTime,
    setRemainingTime,
    setIsExpired,
    isExpired,
    setValidityDuration,
  };
}
