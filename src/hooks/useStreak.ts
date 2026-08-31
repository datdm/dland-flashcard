import { useState, useEffect } from 'react';
import { getStreak } from '@/lib/storage';
import type { StreakData } from '@/lib/storage';

export function useStreak() {
  const [streak, setStreak] = useState<StreakData>({ 
    currentStreak: 0, 
    longestStreak: 0, 
    lastStreakDate: '' 
  });

  useEffect(() => {
    setStreak(getStreak());
    
    // Update when storage changes
    const handleStorageChange = () => {
      setStreak(getStreak());
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('progress-updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('progress-updated', handleStorageChange);
    };
  }, []);

  return streak;
}
