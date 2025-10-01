import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ArrowRight, Delete } from "lucide-react";

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

  // Handle number pad input
  const handleNumberPadInput = (digit: string) => {
    if (password.length < 4) {
      const newPassword = password + digit;
      setPassword(newPassword);
      if (error) {
        setError("");
      }
    }
  };

  // Handle backspace
  const handleBackspace = () => {
    setPassword(password.slice(0, -1));
    if (error) {
      setError("");
    }
  };

  // Handle clear
  const handleClear = () => {
    setPassword("");
    if (error) {
      setError("");
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
      <DialogContent className="max-w-4xl mx-auto bg-card p-16 rounded-2xl">
        <div className="flex items-center justify-center mb-12">
          <h2 className="text-4xl font-bold text-foreground">ENTER PASSWORD</h2>
        </div>
        
        <div className="flex items-center gap-8 mb-12">
          <Input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            className={`flex-1 text-center text-4xl py-8 h-24 text-[2.5rem] ${error ? 'border-red-500' : ''}`}
            placeholder="- - - -"
            maxLength={4}
            disabled={isLoading}
            onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
            readOnly
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

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
          {/* Numbers 1-9 */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              onClick={() => handleNumberPadInput(num.toString())}
              disabled={isLoading || password.length >= 4}
              className="h-16 w-full text-2xl font-bold bg-muted hover:bg-muted/80 text-foreground border-2 border-border"
              variant="outline"
            >
              {num}
            </Button>
          ))}
        </div>

        {/* Bottom row with 0, Clear, and Backspace */}
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
          <Button
            onClick={handleClear}
            disabled={isLoading}
            className="h-16 w-full text-lg font-bold bg-destructive hover:bg-destructive/80 text-destructive-foreground"
            variant="destructive"
          >
            Clear
          </Button>
          <Button
            onClick={() => handleNumberPadInput("0")}
            disabled={isLoading || password.length >= 4}
            className="h-16 w-full text-2xl font-bold bg-muted hover:bg-muted/80 text-foreground border-2 border-border"
            variant="outline"
          >
            0
          </Button>
          <Button
            onClick={handleBackspace}
            disabled={isLoading || password.length === 0}
            className="h-16 w-full text-lg font-bold bg-secondary hover:bg-secondary/80 text-secondary-foreground flex items-center justify-center"
            variant="secondary"
          >
            <Delete className="w-6 h-6" />
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