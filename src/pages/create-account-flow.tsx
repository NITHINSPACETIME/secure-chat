
import { useState } from "react";
import {
  Shield,
  ArrowLeft,
  Loader2,
  Key,
  Copy,
  Check,
  ChevronRight,
  AlertTriangle,
  Eye,
  Fingerprint
} from "lucide-react";
import { collection, query, where, getDocs } from "@firebase/firestore";
import { db } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { useToast } from "../hooks/use-toast";
import {
  generateRecoveryPhrase,
  deriveSessionIdFromPhrase,
} from "../utils/crypto";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type CreateAccountFlowProps = {
  onComplete: (data: {
    sessionId: string;
    displayName: string;
    recoveryPhrase: string;
  }) => void;
  onBack: () => void;
};

type Step = "name" | "recovery" | "confirm";

export function CreateAccountFlow({
  onComplete,
  onBack,
}: CreateAccountFlowProps) {
  const [step, setStep] = useState<Step>("name");
  const [displayName, setDisplayName] = useState("");
  
  // Generate once
  const [recoveryPhrase] = useState(generateRecoveryPhrase());
  const [sessionId] = useState(deriveSessionIdFromPhrase(recoveryPhrase));

  const [hasWrittenDown, setHasWrittenDown] = useState(false);
  const [nameError, setNameError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [revealKey, setRevealKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleContinueFromName = async () => {
    if (!displayName.trim()) return;
    setNameError("");
    setIsChecking(true);
    try {
      const q = query(
        collection(db, "users"),
        where("name", "==", displayName.trim())
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setNameError("This username is already taken.");
        setIsChecking(false);
        return;
      }
      setStep("recovery");
    } catch (error) {
      // Allow continue on error (offline dev or network issue)
      setStep("recovery");
    } finally {
      setIsChecking(false);
    }
  };

  const handleFinish = () => {
    onComplete({ sessionId, displayName, recoveryPhrase });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(recoveryPhrase);
    setCopied(true);
    toast({ title: "Secret Phrase Copied", description: "Store this safely offline!" });
    setTimeout(() => setCopied(false), 2000);
  };
  
  const stepProgress = {
      name: 1,
      recovery: 2,
      confirm: 3
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 md:p-8">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-muted">
         <motion.div 
           className="h-full bg-primary"
           initial={{ width: "33%" }}
           animate={{ width: `${(stepProgress[step] / 3) * 100}%` }}
           transition={{ duration: 0.5, ease: "easeInOut" }}
         />
      </div>

      <div className="max-w-md w-full space-y-8 relative">
         {/* Navigation */}
         <div className="flex items-center justify-between">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={step === 'name' ? onBack : () => setStep(step === 'confirm' ? 'recovery' : 'name')} 
                className="rounded-full hover:bg-muted"
            >
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Step {stepProgress[step]} of 3</span>
            <div className="w-10" /> {/* Spacer for balance */}
         </div>

         <AnimatePresence mode="wait">
            <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-8"
            >
                {/* STEP 1: NAME */}
                {step === 'name' && (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
                                <Fingerprint className="w-8 h-8" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">Choose your Alias</h1>
                            <p className="text-muted-foreground">This is how you will be identified on the network.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold uppercase text-muted-foreground tracking-wider ml-1">Display Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. CipherPunk99"
                                    value={displayName}
                                    onChange={(e) => {
                                        setDisplayName(e.target.value);
                                        setNameError("");
                                    }}
                                    autoFocus
                                    className="h-14 text-lg bg-muted/30 border-transparent focus:bg-background focus:border-primary transition-all rounded-xl px-4"
                                />
                                {nameError && <p className="text-destructive text-sm font-medium flex items-center gap-1 pl-1"><AlertTriangle className="w-4 h-4"/> {nameError}</p>}
                            </div>
                            
                            <Button onClick={handleContinueFromName} disabled={!displayName.trim() || isChecking} className="w-full h-14 text-base rounded-xl font-semibold shadow-lg shadow-primary/20" size="lg">
                                {isChecking ? <Loader2 className="animate-spin w-5 h-5" /> : "Continue"}
                            </Button>
                        </div>
                    </div>
                )}

                {/* STEP 2: RECOVERY */}
                {step === 'recovery' && (
                    <div className="space-y-6">
                         <div className="text-center space-y-2">
                            <h1 className="text-2xl font-bold">Your Secret Key</h1>
                            <p className="text-muted-foreground text-sm">This 12-word phrase is the <strong>only</strong> way to recover your account.</p>
                         </div>

                         <div 
                            className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-6 cursor-pointer group overflow-hidden shadow-inner"
                            onClick={() => setRevealKey(true)}
                         >
                             <div className={cn("grid grid-cols-3 gap-3 transition-all duration-500", !revealKey ? "blur-xl opacity-40 scale-105" : "blur-0 opacity-100 scale-100")}>
                                {recoveryPhrase.split(" ").map((word, i) => (
                                    <div key={i} className="bg-white/5 border border-white/10 p-2 rounded text-center">
                                        <span className="text-[10px] text-zinc-500 block mb-0.5">{i+1}</span>
                                        <span className="font-mono text-zinc-300 font-medium text-sm">{word}</span>
                                    </div>
                                ))}
                             </div>
                             
                             {!revealKey && (
                                 <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/20 backdrop-blur-sm transition-colors group-hover:bg-black/10">
                                     <div className="bg-white text-black px-5 py-2.5 rounded-full font-bold shadow-2xl flex items-center gap-2 transform group-hover:scale-105 transition-transform">
                                        <Eye className="w-4 h-4" /> Click to Reveal
                                     </div>
                                 </div>
                             )}
                         </div>

                         <div className="flex justify-center">
                             <Button variant="outline" className="rounded-full border-dashed" onClick={copyToClipboard} disabled={!revealKey}>
                                 {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                                 Copy to Clipboard
                             </Button>
                         </div>

                         <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 items-start text-amber-600 dark:text-amber-400 text-sm">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p>If you lose this phrase, you lose your account forever. We cannot recover it for you.</p>
                         </div>

                         <div className="pt-2">
                             <div 
                                className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:bg-muted/50 transition-colors cursor-pointer" 
                                onClick={() => setHasWrittenDown(!hasWrittenDown)}
                             >
                                 <Checkbox id="confirm" checked={hasWrittenDown} onCheckedChange={(c) => setHasWrittenDown(!!c)} />
                                 <label htmlFor="confirm" className="text-sm font-medium cursor-pointer select-none">I have saved my recovery phrase securely</label>
                             </div>

                             <Button onClick={() => setStep('confirm')} disabled={!hasWrittenDown} className="w-full h-14 text-base mt-4 rounded-xl font-semibold" size="lg">
                                 Continue <ChevronRight className="w-4 h-4 ml-2" />
                             </Button>
                         </div>
                    </div>
                )}

                {/* STEP 3: CONFIRM */}
                {step === 'confirm' && (
                    <div className="space-y-8 text-center py-8">
                        <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-700">
                            <Shield className="w-12 h-12" />
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold">Identity Verified</h3>
                            <p className="text-muted-foreground">Your cryptographic vault has been created successfully.</p>
                        </div>

                        <div className="p-5 bg-muted/30 rounded-2xl border border-border text-left space-y-3 shadow-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Alias</span>
                                <span className="font-bold text-lg">{displayName}</span>
                            </div>
                            <div className="h-px bg-border/50" />
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Session ID</span>
                                <span className="font-mono text-xs bg-background border px-2 py-1 rounded text-muted-foreground">{sessionId.slice(0, 16)}...</span>
                            </div>
                        </div>

                        <Button onClick={handleFinish} className="w-full h-14 text-lg rounded-xl font-bold shadow-xl shadow-primary/20" size="lg">
                            Enter Project Nyx
                        </Button>
                    </div>
                )}
            </motion.div>
         </AnimatePresence>
      </div>
    </div>
  );
}
