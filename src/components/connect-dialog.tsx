
import React, { useState, useRef, useEffect } from "react";
import { useAtom } from "jotai";
import {
  QrCode,
  Copy,
  Check,
  Loader2,
  UserPlus,
} from "lucide-react";
import QRCodeStyling from "qr-code-styling";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { currentUserAtom } from "../atoms/user";
import { createConversationInCloud } from "../atoms/conversations";
import { doc, getDoc } from "@firebase/firestore";
import { db } from "../lib/firebase";
import { useToast } from "../hooks/use-toast";
import { analyzeImage } from "../utils/services";

const ContactQRCode = ({ data }: { data: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const qrCode = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = "";
      qrCode.current = new QRCodeStyling({
        width: 240,
        height: 240,
        data: data,
        dotsOptions: { color: "#18181b", type: "rounded" },
        backgroundOptions: { color: "#ffffff" },
        imageOptions: { crossOrigin: "anonymous", margin: 5 },
        cornersSquareOptions: { type: "extra-rounded", color: "#18181b" },
      });
      qrCode.current.append(ref.current);
    }
  }, [data]);

  return (
    <div
      ref={ref}
      className="bg-white p-6 rounded-2xl shadow-sm mx-auto w-fit border border-zinc-200"
    />
  );
};

type ConnectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ConnectDialog({ open, onOpenChange }: ConnectDialogProps) {
  const [currentUser] = useAtom(currentUserAtom);
  const [userIdInput, setUserIdInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const qrData = JSON.stringify({
    id: currentUser.id,
    name: currentUser.name,
    publicKey: currentUser.publicKey,
  });

  const copyId = () => {
    navigator.clipboard.writeText(currentUser.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddContact = async (idToAdd: string) => {
    if (!idToAdd.trim() || idToAdd === currentUser.id) return;

    setIsLoading(true);
    try {
      const userRef = doc(db, "users", idToAdd.trim());
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error("User not found");
      const userData = userSnap.data();

      await createConversationInCloud(
        currentUser.id,
        currentUser.name,
        userData.id,
        userData.name || "Unknown"
      );

      onOpenChange(false);
      toast({
        title: "Connected",
        description: `Chat started with ${userData.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "User not found.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRCodeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = await analyzeImage({
          imageUrl: event.target?.result as string,
          prompt: "scan qr code for user data",
        });
        const data = result.analysis;
        if (data.id) handleAddContact(data.id);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-background border-none shadow-2xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-center text-2xl font-bold">Connect</DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-2">
            <Tabs defaultValue="my-code" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 p-1 h-12 bg-muted/50 rounded-xl">
                <TabsTrigger value="my-code" className="rounded-lg h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm">My Code</TabsTrigger>
                <TabsTrigger value="scan" className="rounded-lg h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm">Scan / Add</TabsTrigger>
            </TabsList>

            <TabsContent value="my-code" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="text-center">
                    <ContactQRCode data={qrData} />
                    <div className="mt-6 space-y-1">
                        <p className="text-lg font-bold text-foreground">{currentUser.name}</p>
                        <p className="text-sm text-muted-foreground">Scan to start an encrypted chat</p>
                    </div>
                </div>
                
                <div className="bg-muted/40 rounded-xl p-4 border border-border/50">
                    <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-2 block">Your ID</Label>
                    <div className="flex gap-2 items-center">
                        <div className="flex-1 font-mono text-xs text-muted-foreground truncate bg-background p-2.5 rounded-md border border-border/50 select-all">
                            {currentUser.id}
                        </div>
                        <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={copyId}>
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="scan" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="space-y-6">
                    <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl h-48 flex flex-col items-center justify-center relative group hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                        <div className="p-4 bg-background rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                            <QrCode className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Upload QR Image</p>
                        <p className="text-xs text-muted-foreground mt-1">Click to browse files</p>
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleQRCodeUpload}
                        />
                    </div>

                    <div className="relative flex items-center">
                        <div className="flex-grow border-t border-border"></div>
                        <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Or manually enter</span>
                        <div className="flex-grow border-t border-border"></div>
                    </div>

                    <div className="flex gap-2">
                        <Input
                            placeholder="Paste 24-character User ID..."
                            value={userIdInput}
                            onChange={(e) => setUserIdInput(e.target.value)}
                            className="h-12 font-mono text-sm bg-muted/30"
                        />
                        <Button
                            onClick={() => handleAddContact(userIdInput)}
                            disabled={isLoading}
                            className="h-12 px-6"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </TabsContent>
            </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
