import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ArrowRight } from "lucide-react";

interface PasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PasswordDialog = ({ open, onClose, onSuccess }: PasswordDialogProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(""); // Clear any previous error
    
    // Simple password check - in real app this would be more secure
    if (password === "1234") {
      onSuccess();
      setPassword("");
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
      setPassword(""); // Clear password field to allow retry
    }
    
    setIsLoading(false);
  };

  // Reset error when password changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) {
      setError(""); // Clear error when user starts typing again
    }
  };

  // Reset state when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setPassword("");
      setError("");
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg mx-auto bg-card p-10 rounded-xl">
        <div className="flex items-center justify-center mb-8">
          <h2 className="text-2xl font-bold text-foreground">ENTER PASSWORD</h2>
        </div>
        
        <div className="flex items-center gap-6">
          <Input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            className={`flex-1 text-center text-2xl py-6 ${error ? 'border-red-500' : ''}`}
            placeholder="- - - -"
            maxLength={4}
            disabled={isLoading}
            onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
          />
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !password}
            className="bg-info hover:bg-info/90 text-white rounded-full p-6 disabled:opacity-50"
            size="lg"
          >
            <ArrowRight className="w-7 h-7" />
          </Button>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mt-4 text-center">
            <p className="text-red-500 text-sm font-medium">{error}</p>
          </div>
        )}
        
        {/* Loading state */}
        {isLoading && (
          <div className="mt-4 text-center">
            <p className="text-muted-foreground text-sm">Checking password...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PasswordDialog;