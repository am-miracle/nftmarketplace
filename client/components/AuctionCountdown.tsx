"use client"
import { useEffect, useState } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownProps {
  endTime: number;
  onEnd?: () => void;
}

const AuctionCountdown = ({ endTime, onEnd }: CountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      const difference = endTime - now;

      if (difference <= 0) {
        if (onEnd) onEnd();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / 86400),
        hours: Math.floor((difference % 86400) / 3600),
        minutes: Math.floor((difference % 3600) / 60),
        seconds: difference % 60
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      const timeLeft = calculateTimeLeft();
      setTimeLeft(timeLeft);

      if (timeLeft.days === 0 && timeLeft.hours === 0 && 
          timeLeft.minutes === 0 && timeLeft.seconds === 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onEnd]);

  return (
    <div className="flex justify-between items-center mt-4 mb-8">
      <div className="text-center">
        <p className="text-4xl font-bold">{timeLeft.days}</p>
        <p className="text-sm text-gray-500">Days</p>
      </div>
      <p className="text-4xl font-bold">:</p>
      <div className="text-center">
        <p className="text-4xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</p>
        <p className="text-sm text-gray-500">Hours</p>
      </div>
      <p className="text-4xl font-bold">:</p>
      <div className="text-center">
        <p className="text-4xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</p>
        <p className="text-sm text-gray-500">Minutes</p>
      </div>
      <p className="text-4xl font-bold">:</p>
      <div className="text-center">
        <p className="text-4xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</p>
        <p className="text-sm text-gray-500">Seconds</p>
      </div>
    </div>
  );
};

export default AuctionCountdown;