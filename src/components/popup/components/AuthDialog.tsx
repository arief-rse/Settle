import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { AuthForm } from "./AuthForm";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign in to Text Analyzer</DialogTitle>
          <DialogDescription>
            Enter your email and password to continue
          </DialogDescription>
        </DialogHeader>
        <AuthForm onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
