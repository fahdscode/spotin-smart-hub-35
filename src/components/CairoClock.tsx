import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const CairoClock = () => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Convert to Cairo time (UTC+2)
      const cairoTime = new Date(now.toLocaleString("en-US", {timeZone: "Africa/Cairo"}));
      const timeString = cairoTime.toLocaleTimeString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setTime(timeString);
    };

    // Update immediately
    updateTime();
    
    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-white/90 bg-white/10 px-3 py-2 rounded-lg">
      <Clock className="h-4 w-4" />
      <div className="text-sm">
        <div className="font-medium">{time}</div>
        <div className="text-xs text-white/70">Cairo</div>
      </div>
    </div>
  );
};

export default CairoClock;