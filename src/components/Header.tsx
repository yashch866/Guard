import { useState, useEffect } from "react";
import { Circle } from "lucide-react";
import { socket } from "@/lib/socket";
import { getAdaptiveConfig } from "@/lib/config";

const Header = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [hasInternet, setHasInternet] = useState(true);
  const [wifiConnected, setWifiConnected] = useState(false);

  // Get adaptive API configuration
  const { apiUrl: API_URL } = getAdaptiveConfig();

  useEffect(() => {
    // Update clock
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    // Check connection status
    const checkConnection = async () => {
      try {
        // First check WiFi status
        const statusRes = await fetch(`${API_URL}/wifi/connection`);
        if (!statusRes.ok) {
          console.error('WiFi connection check failed:', statusRes.status);
          setIsOnline(false);
          setWifiConnected(false);
          setHasInternet(false);
          return;
        }

        const data = await statusRes.json();
        setWifiConnected(data.connected === true);

        // Check internet connectivity
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const internetCheck = await fetch('https://8.8.8.8', { 
            mode: 'no-cors',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          setHasInternet(true);
          setIsOnline(true);
        } catch (error) {
          console.error('Internet connectivity check failed:', error);
          setHasInternet(false);
          setIsOnline(false);
        }

      } catch (error) {
        console.error('Error checking connection:', error);
        setIsOnline(false);
        setWifiConnected(false);
        setHasInternet(false);
      }
    };

    // Check immediately and then every 3 seconds
    const connectionInterval = setInterval(checkConnection, 3000);
    checkConnection();

    // Also listen for real-time WiFi state changes
    socket.on('wifi_state_change', (state) => {
      console.log('WiFi state change:', state);
      checkConnection();
    });

    // Cleanup
    return () => {
      clearInterval(timer);
      clearInterval(connectionInterval);
      socket.off('wifi_state_change');
    };
  }, []);

  // Format date as DD/MM/YY
  const formattedDate = dateTime
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })
    .replace(/\//g, "/");

  // Format time in 12-hour with AM/PM
  const formattedTime = dateTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <header className="flex items-center justify-between w-full px-6 py-4 bg-card border-b border-border">
      {/* Left Section */}
      <div className="flex items-center">
        <img
          className="h-12 block dark:hidden"
          src="sakar-light.png"
          alt="Sakar Logo Light"
        />
        <img
          className="h-12 hidden dark:block"
          src="sakar-dark.png"
          alt="Sakar Logo Dark"
        />
      </div>

      {/* Date & Time in Center */}
      <div className="px-5 py-2 bg-muted rounded-lg text-center">
        <div className="text-sm font-semibold text-muted-foreground">
          {formattedDate}
        </div>
        <div className="text-2xl font-bold text-foreground">
          {formattedTime.toUpperCase()}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 ${isOnline ? 'bg-success/20' : 'bg-destructive/20'} rounded-full`}>
          <Circle className={`w-4 h-4 ${isOnline ? 'fill-success text-success' : 'fill-destructive text-destructive'}`} />
          <span className={`text-base font-medium ${isOnline ? 'text-success' : 'text-destructive'}`}>
            {isOnline ? 'ONLINE' : wifiConnected && !hasInternet ? 'NO INTERNET' : 'OFFLINE'}
          </span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-destructive/20 rounded-full">
          <Circle className="w-4 h-4 fill-destructive text-destructive" />
          <span className="text-sm text-destructive font-medium">RECORDING</span>
        </div>
      </div>
    </header>
  );
};

export default Header;