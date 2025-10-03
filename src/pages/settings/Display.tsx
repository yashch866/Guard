import SettingsLayout from "@/components/SettingsLayout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Sun, Moon, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";
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
  const [brightness] = useState([100]);
  const [userSelectedTheme, setUserSelectedTheme] = useState<string>("auto");
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
    const interval = setInterval(enforceBrightness, 60000);
    return () => clearInterval(interval);
  }, []);
 
  const themeOptions = [
    { id: "auto", label: "AUTO", icon: Smartphone },
    { id: "light", label: "LIGHT", icon: Sun },
    { id: "dark", label: "DARK", icon: Moon },
  ];
 
  return (
    <SettingsLayout>
      <div className="space-y-8">
        <h2 className="text-2xl font-bold">DISPLAY</h2>
 
        <div className="space-y-6">
          <h3 className="text-xl font-bold">APPEARANCE</h3>
          <div className="grid grid-cols-3 gap-4">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.id}
                  variant={userSelectedTheme === option.id ? "default" : "outline"}
                  aria-pressed={userSelectedTheme === option.id}
                  className="h-32 flex flex-col items-center justify-center gap-3 font-bold"
                  onClick={() => {
                    setUserSelectedTheme(option.id);
                    if (option.id !== "auto") {
                      document.documentElement.classList.remove("light", "dark");
                      document.documentElement.classList.add(option.id);
                    }
                  }}
                >
                  <Icon className="w-8 h-8" />
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>
 
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

