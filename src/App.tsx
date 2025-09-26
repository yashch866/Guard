import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import General from "./pages/settings/General";
import Display from "./pages/settings/Display";
import WiFiSettings from "./pages/settings/WiFi";
import About from "./pages/settings/About";
import Help from "./pages/settings/Help";
import SystemStatus from "./pages/SystemStatus";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider 
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={['light', 'dark', 'auto']}
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/general" element={<General />} />
            <Route path="/settings/display" element={<Display />} />
            <Route path="/settings/wifi" element={<WiFiSettings />} />
            <Route path="/settings/about" element={<About />} />
            <Route path="/settings/help" element={<Help />} />
            <Route path="/system-status" element={<SystemStatus />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
