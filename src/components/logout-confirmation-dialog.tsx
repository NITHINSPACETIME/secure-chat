
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { LogOut, AlertTriangle } from "lucide-react";

type LogoutConfirmationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function LogoutConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
}: LogoutConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="p-3 rounded-full bg-destructive/10 mb-2">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <DialogTitle className="text-xl">
            Are you sure you want to log out?
          </DialogTitle>
          <DialogDescription className="pt-2">
            This will clear all local data from this device. You will need your
            recovery phrase to log back in.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <LogOut className="w-4 h-4 mr-2" /> Log Out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
