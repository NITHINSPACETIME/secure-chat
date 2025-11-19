
import { useState } from "react";
import { ArrowLeft, Loader2, KeyRound } from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { useToast } from "../hooks/use-toast";
import {
  deriveSessionIdFromPhrase,
  deriveSessionIdFromHex,
  generateKeysFromPhrase,
  generateKeysFromHex,
} from "../utils/crypto";
import { doc, getDoc } from "@firebase/firestore";
import { db } from "../lib/firebase";
import { motion } from "framer-motion";

type RestoreAccountFlowProps = {
  onComplete: (data: {
    sessionId: string;
    recoveryPhrase: string;
    name?: string;
    avatar?: string;
  }) => void;
  onBack: () => void;
};

export function RestoreAccountFlow({
  onComplete,
  onBack,
}: RestoreAccountFlowProps) {
  const [input, setInput] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const { toast } = useToast();

  const handleRestore = async () => {
    let cleanInput = input.trim();
    let sessionId = "";
    let isValid = false;

    if (cleanInput.startsWith("0x")) {
      const keys = generateKeysFromHex(cleanInput);
      if (keys) {
        isValid = true;
        sessionId = deriveSessionIdFromHex(cleanInput);
      }
    } else {
      const wordCount = cleanInput.split(/\s+/).length;
      if (wordCount === 12) {
        const keys = generateKeysFromPhrase(cleanInput);
        if (keys) {
          isValid = true;
          sessionId = deriveSessionIdFromPhrase(cleanInput);
        }
      }
    }

    if (!isValid) {
      toast({
        title: "Invalid Key",
        description: "Please enter a valid 12-word phrase or hex key.",
        variant: "destructive",
      });
      return;
    }

    setIsRestoring(true);
    try {
      const userRef = doc(db, "users", sessionId);
      const userSnap = await getDoc(userRef);

      let restoredName = "Restored User";
      let restoredAvatar = undefined;

      if (userSnap.exists()) {
        const data = userSnap.data();
        restoredName = data.name;
        restoredAvatar = data.avatar;
        toast({
          title: "Account Found",
          description: `Welcome back, ${restoredName}`,
        });
      } else {
        toast({ title: "New Session", description: "Account ID restored from keys." });
      }

      onComplete({
        sessionId,
        recoveryPhrase: cleanInput,
        name: restoredName,
        avatar: restoredAvatar,
      });
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Could not verify account existence.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-card border border-border shadow-2xl rounded-2xl overflow-hidden"
      >
        <div className="p-6 pb-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-full -ml-2 hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
        </div>

        <div className="p-6 pt-2 space-y-6">
            <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Restore Access</h1>
                <p className="text-muted-foreground text-sm">
                    Enter your 12-word recovery phrase or raw private key to unlock your vault.
                </p>
            </div>

            <div className="space-y-4">
                <Textarea
                    placeholder="abandon ability able about above absent..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="min-h-[140px] font-mono text-sm bg-muted/30 border-muted-foreground/20 focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none p-4 rounded-xl leading-relaxed"
                />
                
                <Button
                    onClick={handleRestore}
                    disabled={isRestoring || input.trim().length < 10}
                    className="w-full h-12 text-base font-semibold rounded-xl"
                    size="lg"
                >
                    {isRestoring ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                    "Unlock Vault"
                    )}
                </Button>
            </div>
        </div>
        
        <div className="p-4 bg-muted/30 text-center border-t border-border">
             <p className="text-xs text-muted-foreground">Your keys are processed locally and never sent to our servers.</p>
        </div>
      </motion.div>
    </div>
  );
}
