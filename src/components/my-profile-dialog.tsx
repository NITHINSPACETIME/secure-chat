import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  User,
  Camera,
  QrCode,
  X,
  Moon,
  Sun,
  Palette,
  Key,
  Eye,
  EyeOff,
  Loader2,
  Check,
  Copy,
} from "lucide-react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { currentUserAtom, updateProfileAtom } from "../atoms/user";
import { useToast } from "../hooks/use-toast";
import { ConnectDialog } from "./connect-dialog";
import { LogoutConfirmationDialog } from "./logout-confirmation-dialog";

type MyProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MyProfileDialog({ open, onOpenChange }: MyProfileDialogProps) {
  const [currentUser] = useAtom(currentUserAtom);
  const [, updateProfile] = useAtom(updateProfileAtom);

  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio || "Project Nyx User");
  const [statusMessage, setStatusMessage] = useState(
    currentUser.statusMessage || ""
  );
  const [showRecovery, setShowRecovery] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [isUploading, setIsUploading] = useState<"avatar" | "banner" | null>(
    null
  );
  const [keyCopied, setKeyCopied] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setName(currentUser.name);
      setBio(currentUser.bio || "Project Nyx User");
      setStatusMessage(currentUser.statusMessage || "");
    }
  }, [open, currentUser]);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "banner"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(type);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const url = reader.result as string;
        if (type === "avatar") updateProfile({ avatar: url });
        else updateProfile({ banner: url });

        setIsUploading(null);
        toast({
          title:
            type === "avatar" ? "Profile Picture Updated" : "Banner Updated",
        });
      };
      reader.onerror = () => {
        setIsUploading(null);
        toast({ title: "Error reading file", variant: "destructive" });
      };
    } catch (error) {
      setIsUploading(null);
      toast({ title: "Error uploading image", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (saveState !== "idle") return;
    setSaveState("saving");
    await updateProfile({ name, bio, statusMessage });
    setSaveState("saved");
    toast({ title: "Profile Saved" });
    setTimeout(() => {
      setSaveState("idle");
    }, 2000);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const toggleTheme = () => {
    const newTheme = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";
    updateProfile({ theme: newTheme });
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const recoveryPhrase =
    localStorage.getItem("recoveryPhrase") || "Error: Key not found.";

  const copyRecoveryKey = () => {
    navigator.clipboard.writeText(recoveryPhrase);
    setKeyCopied(true);
    toast({ title: "Recovery Key Copied", description: "Store this safely!" });
    setTimeout(() => setKeyCopied(false), 2000);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[420px] p-0 gap-0 border-none shadow-2xl bg-background overflow-hidden rounded-2xl ring-1 ring-border/50">
          {/* Banner Area */}
          <div className="h-32 relative bg-zinc-100 dark:bg-zinc-900 group">
            {currentUser.banner ? (
              <img
                src={currentUser.banner}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-90"
                alt="Banner"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
            )}

            {isUploading === "banner" && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}

            <div className="absolute top-3 right-3 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <label className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center cursor-pointer backdrop-blur-sm transition-colors">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "banner")}
                  disabled={isUploading !== null}
                />
              </label>
              <button
                className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-6 pb-6">
            {/* Avatar & Actions */}
            <div className="flex justify-between items-end -mt-10 mb-6">
              <div className="relative group">
                <Avatar className="w-20 h-20 border-[4px] border-background shadow-md bg-muted cursor-pointer">
                  {currentUser.avatar && (
                    <AvatarImage
                      src={currentUser.avatar}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="w-8 h-8" />
                  </AvatarFallback>

                  {isUploading === "avatar" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 rounded-full">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer text-white border-[4px] border-transparent">
                  <Camera className="w-5 h-5" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "avatar")}
                    disabled={isUploading !== null}
                  />
                </label>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-9 w-9"
                  onClick={() => setConnectOpen(true)}
                >
                  <QrCode className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button
                  onClick={handleSave}
                  className="rounded-full h-9 px-4 text-xs font-semibold"
                  disabled={saveState !== "idle" || isUploading !== null}
                >
                  {saveState === "saving" ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : saveState === "saved" ? (
                    <Check className="w-3 h-3 mr-1" />
                  ) : null}
                  {saveState === "saved" ? "Saved" : "Save Changes"}
                </Button>
              </div>
            </div>

            {/* Edit Fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
                  Display Name
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-muted/50 border-transparent focus:bg-background transition-colors h-9 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between pl-1 pr-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    About
                  </Label>
                  <span className="text-[10px] text-muted-foreground opacity-70">
                    {bio.length}/120
                  </span>
                </div>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="bg-muted/50 border-transparent focus:bg-background min-h-[70px] resize-none text-sm"
                  maxLength={120}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
                  Status
                </Label>
                <Input
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  className="bg-muted/50 border-transparent focus:bg-background h-9"
                  placeholder="What's on your mind?"
                />
              </div>

              {/* Preferences */}
              <div className="pt-4 space-y-2">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1 mb-1">
                  Settings
                </h4>

                <div
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border/50"
                  onClick={toggleTheme}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                      <Palette className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Appearance</span>
                  </div>
                  {document.documentElement.classList.contains("dark") ? (
                    <Moon className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Sun className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>

                <div className="border border-border/40 rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-2.5 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setShowRecovery(!showRecovery)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-orange-500/10 rounded-md text-orange-500">
                        <Key className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">
                        Recovery Phrase
                      </span>
                    </div>
                    {showRecovery ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <AnimatePresence>
                    {showRecovery && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="bg-zinc-950 border-t border-border/40"
                      >
                        <div className="p-3 relative group">
                          <div className="text-[11px] font-mono text-zinc-400 break-all pr-8">
                            {recoveryPhrase}
                          </div>
                          <button
                            onClick={copyRecoveryKey}
                            className="absolute top-2 right-2 p-1.5 bg-white/10 rounded-md hover:bg-white/20 transition-colors text-white"
                          >
                            {keyCopied ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <Button
                variant="ghost"
                className="w-full text-red-500 hover:text-red-600 hover:bg-red-500/5 justify-start pl-2.5 h-9 mt-2"
                onClick={() => setShowLogoutConfirm(true)}
              >
                <LogOut className="w-4 h-4 mr-3" /> Log Out
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ConnectDialog open={connectOpen} onOpenChange={setConnectOpen} />
      <LogoutConfirmationDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        onConfirm={handleLogout}
      />
    </>
  );
}
