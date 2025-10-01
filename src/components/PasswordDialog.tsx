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
      <DialogContent className="max-w-2xl mx-auto bg-card p-16 rounded-2xl">
        <div className="flex items-center justify-center mb-12">
          <h2 className="text-4xl font-bold text-foreground">ENTER PASSWORD</h2>
        </div>
        
        <div className="flex items-center gap-8">
          <Input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            className={`flex-1 text-center text-4xl py-8 h-24 text-[2.5rem] ${error ? 'border-red-500' : ''}`}
            placeholder="- - - -"
            maxLength={4}
            disabled={isLoading}
            onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
          />
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !password}
            className="bg-info hover:bg-info/90 text-white rounded-full p-8 h-24 w-24 disabled:opacity-50"
            size="lg"
          >
            <ArrowRight className="w-12 h-12" />
          </Button>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mt-8 text-center">
            <p className="text-red-500 text-xl font-medium">{error}</p>
          </div>
        )}
        
        {/* Loading state */}
        {isLoading && (
          <div className="mt-8 text-center">
            <p className="text-muted-foreground text-xl">Checking password...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PasswordDialog;