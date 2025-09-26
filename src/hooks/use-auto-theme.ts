import { useEffect } from 'react';
import { useTheme } from '../lib/theme';

export function useAutoTheme() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const updateTheme = () => {
      const hour = new Date().getHours();
      // Day mode between 6 AM and 6 PM
      setTheme(hour >= 6 && hour < 18 ? 'light' : 'dark');
    };

    // Initial theme update
    updateTheme();

    // Update theme every minute
    const interval = setInterval(updateTheme, 60000);

    return () => clearInterval(interval);
  }, [setTheme]);
}