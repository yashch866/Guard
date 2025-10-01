import SettingsLayout from "@/components/SettingsLayout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Sun, Moon, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useToast } from "@/components/ui/use-toast";

declare global {
  interface Window {
    system: {
      brightness: {
        get: () => Promise<number>;
        set: (value: number) => Promise<boolean>;
      }
    }
  }
}

const Display = () => {
  const [brightness] = useState([100]); // Fixed at 100%, no setBrightness needed
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { toast } = useToast();

  // Force brightness to always be 100%
  useEffect(() => {
    const enforceBrightness = async () => {
      try {
        await window.system.brightness.set(100);
      } catch (err) {
        console.error("Failed to set brightness:", err);
      }
    };
    
    enforceBrightness();
    // Run every minute to ensure brightness stays at 100%
    const interval = setInterval(enforceBrightness, 60000);
    return () => clearInterval(interval);
  }, []);

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

  // Brightness is read-only, no handler needed

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
            max={100}
            step={1}
            disabled
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
