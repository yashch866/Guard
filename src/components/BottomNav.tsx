import { Button } from "@/components/ui/button";
import { Home, Settings, Info } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 mb-8">
      <div className="flex items-center gap-6 bg-card px-8 py-4 rounded-full shadow-lg border border-border">
        <Button
          variant={location.pathname === "/" ? "default" : "ghost"}
          size="lg"
          className="rounded-full p-6 h-auto"
          onClick={() => navigate("/")}
        >
          <Home className="w-7 h-7" />
        </Button>
        
        <Button
          variant={location.pathname.startsWith("/settings") ? "default" : "ghost"}
          size="lg"
          className="rounded-full p-6 h-auto"
          onClick={() => navigate("/settings")}
        >
          <Settings className="w-7 h-7" />
        </Button>
        
        <Button
          variant={location.pathname === "/system-status" ? "default" : "ghost"}
          size="lg"
          className="rounded-full p-6 h-auto"
          onClick={() => navigate("/system-status")}
        >
          <Info className="w-7 h-7" />
        </Button>
      </div>
    </nav>
  );
};

export default BottomNav;