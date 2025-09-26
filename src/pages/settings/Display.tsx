import SettingsLayout from "@/components/SettingsLayout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Sun, Moon, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useToast } from "@/components/ui/use-toast";

const DEVICE_IP = "http://localhost:5000"; // Points to your own laptop

const Display = () => {
  const [brightness, setBrightness] = useState([80]); // slider default
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { toast } = useToast();

  // Handle auto theme switching
  useEffect(() => {
    if (theme !== "auto") return;

    const updateTheme = () => {
      const hour = new Date().getHours();
      // Light mode between 6 AM and 6 PM
      const preferredTheme = hour >= 6 && hour < 18 ? "light" : "dark";
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(preferredTheme);
    };

    updateTheme(); // Initial check
    const interval = setInterval(updateTheme, 60000); // Check every minute

    return () => {
      clearInterval(interval);
      // Restore theme when unmounting or changing from auto
      if (resolvedTheme) {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(resolvedTheme);
      }
    };
  }, [theme, resolvedTheme]);

  const themeOptions = [
    { id: "auto", label: "AUTO", icon: Smartphone },
    { id: "light", label: "LIGHT", icon: Sun },
    { id: "dark", label: "DARK", icon: Moon },
  ];

  // 🔹 Fetch current brightness on page load
  useEffect(() => {
    const fetchBrightness = async () => {
      try {
        const res = await fetch(`${DEVICE_IP}/display/brightness`);
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`API returned ${res.status}: ${txt}`);
        }
        const data = await res.json();
        if (typeof data.brightness === "number") {
          setBrightness([data.brightness]);
        } else {
          throw new Error(data.error || "Brightness not available");
        }
      } catch (err) {
        console.error("Failed to fetch brightness:", err);
        toast({
          variant: "destructive",
          title: "Failed to fetch brightness",
          description:
            err instanceof Error ? err.message : "Backend not reachable",
        });
      }
    };
    fetchBrightness();
  }, []);

  // 🔹 Update brightness live as slider moves
  const handleBrightnessChange = async (val: number[]) => {
    setBrightness(val);
    try {
      const res = await fetch(`${DEVICE_IP}/display/brightness/${val[0]}`, {
        method: "POST",
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API returned ${res.status}: ${txt}`);
      }
      const data = await res.json().catch(() => ({} as any));
      if (data.status === "failed") {
        throw new Error(data.error || "Failed to set brightness");
      }
    } catch (err) {
      console.error("Failed to set brightness:", err);
      toast({
        variant: "destructive",
        title: "Failed to set brightness",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  return (
    <SettingsLayout>
      <div className="space-y-8">
        <h2 className="text-2xl font-bold">DISPLAY</h2>

        {/* Theme Selector */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold">APPEARANCE</h3>
          <div className="grid grid-cols-3 gap-4">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.id}
                  variant={theme === option.id ? "default" : "outline"}
                  aria-pressed={theme === option.id}
                  className="h-32 flex flex-col items-center justify-center gap-3 font-bold"
                  onClick={() => setTheme(option.id)}
                >
                  <Icon className="w-8 h-8" />
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Brightness Slider */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold">BRIGHTNESS</h3>
          <Slider
            value={brightness}
            onValueChange={handleBrightnessChange}
            max={100}
            step={1}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Current: {brightness[0]}%
          </p>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default Display;
