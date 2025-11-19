
import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { AnimatePresence, motion } from "framer-motion";
import {
  doc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  writeBatch,
} from "@firebase/firestore";
import { db } from "../lib/firebase";
import {
  User as UserIcon,
  X,
  Copy,
  Check,
  Trash2,
  Slash,
  History,
  ShieldCheck,
  Fingerprint,
  Info
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { useToast } from "../hooks/use-toast";
import {
  contactProfileSidebarAtom,
  conversationsAtom,
  messagesAtom,
  activeConversationIdAtom,
} from "../atoms/conversations";
import { currentUserAtom, User } from "../atoms/user";

type ContactProfileSidebarProps = {
  isOpen: boolean;
  partnerId: string | null;
};

export function ContactProfileSidebar({
  isOpen,
  partnerId,
}: ContactProfileSidebarProps) {
  const [, setSidebarState] = useAtom(contactProfileSidebarAtom);
  const [partnerData, setPartnerData] = useState<User | null>(null);
  const [currentUser] = useAtom(currentUserAtom);
  const [, setConversations] = useAtom(conversationsAtom);
  const [, setMessages] = useAtom(messagesAtom);
  const [, setActiveConversationId] = useAtom(activeConversationIdAtom);
  const [copied, setCopied] = useState(false);
  const [verified, setVerified] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && partnerId) {
      const fetchProfile = async () => {
        try {
          const snap = await getDoc(doc(db, "users", partnerId));
          if (snap.exists()) {
            setPartnerData(snap.data() as User);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchProfile();
    } else {
      setTimeout(() => {
          setPartnerData(null);
          setVerified(false);
      }, 300);
    }
  }, [isOpen, partnerId]);

  const closeSidebar = () => setSidebarState({ isOpen: false, partnerId: null });

  const copyId = () => {
    if (!partnerId) return;
    navigator.clipboard.writeText(partnerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "ID Copied" });
  };

  const deleteChat = async () => {
    if (!partnerId) return;
    const ids = [currentUser.id, partnerId].sort();
    const conversationId = ids.join("_");

    if (
      !confirm(
        "Are you sure you want to delete this entire conversation? This cannot be undone."
      )
    )
      return;

    try {
      await deleteDoc(doc(db, "conversations", conversationId));

      const messagesQuery = query(
        collection(db, "messages"),
        where("conversationId", "==", conversationId)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      const batch = writeBatch(db);
      messagesSnapshot.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      setMessages((prev) => {
        const newMessages = { ...prev };
        delete newMessages[conversationId];
        return newMessages;
      });
      setActiveConversationId(null);
      closeSidebar();
      toast({ title: "Chat Deleted" });
    } catch (e) {
      toast({ title: "Error deleting chat", variant: "destructive" });
    }
  };
  
  // Simulated Safety Number (Signal style)
  const safetyNumber = partnerId ? Array.from({length: 12}, (_, i) => 
    parseInt(partnerId.charCodeAt(i % partnerId.length).toString(), 10) % 10000
  ).map(n => n.toString().padStart(4, '0')).join(' ') : '';

  return (
    <AnimatePresence>
      {isOpen && partnerData && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeSidebar}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-[360px] h-full bg-background border-l border-border flex flex-col shadow-2xl"
          >
            <div className="flex-shrink-0 relative">
              <div className="h-36 bg-zinc-100 dark:bg-zinc-900 relative overflow-hidden">
                {partnerData.banner ? (
                  <img
                    src={partnerData.banner}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md border border-white/10"
                  onClick={closeSidebar}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="px-6 -mt-12 mb-4 relative z-10">
                <Avatar className="w-24 h-24 border-4 border-background shadow-lg bg-muted">
                  {partnerData.avatar && <AvatarImage src={partnerData.avatar} className="object-cover" />}
                  <AvatarFallback className="bg-muted text-2xl font-bold text-muted-foreground">
                    {partnerData.name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">{partnerData.name}</h2>
                {partnerData.statusMessage && (
                  <p className="text-sm text-muted-foreground italic border-l-2 border-primary/50 pl-3 py-1">
                    "{partnerData.statusMessage}"
                  </p>
                )}
              </div>

              <div className="space-y-5">
                 
                 {partnerData.bio && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Info className="w-3 h-3" /> About
                    </label>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{partnerData.bio}</p>
                  </div>
                 )}
                 
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">User ID</label>
                    <div className="flex items-center gap-2 bg-muted/40 p-2.5 rounded-lg border border-border/50 group hover:border-border transition-colors">
                      <p className="text-xs font-mono truncate flex-1 text-muted-foreground select-all">
                        {partnerId}
                      </p>
                      <Button size="icon" variant="ghost" className="h-6 w-6 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" onClick={copyId}>
                        {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                 </div>
              </div>
              
              {/* Safety Number / Encryption Verification Feature */}
              <div className="space-y-3 pt-4 border-t border-border/50">
                 <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" />
                    Encryption
                 </h3>
                 <div 
                    className={`p-4 rounded-xl border transition-all cursor-pointer overflow-hidden relative ${verified ? 'bg-green-500/5 border-green-500/20' : 'bg-card border-border hover:border-primary/30'}`}
                    onClick={() => setVerified(!verified)}
                 >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <Fingerprint className="w-4 h-4 opacity-70" />
                          Safety Number
                        </span>
                        {verified ? (
                            <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
                              <Check className="w-3 h-3" /> VERIFIED
                            </span>
                        ) : (
                             <span className="text-[10px] text-primary font-medium">Verify</span>
                        )}
                    </div>
                    <div className="grid grid-cols-4 gap-y-1 gap-x-2 font-mono text-[10px] text-muted-foreground opacity-70 select-none text-center">
                        {safetyNumber.split(' ').map((chunk, i) => (
                            <span key={i} className="bg-muted/30 rounded px-1">{chunk}</span>
                        ))}
                    </div>
                 </div>
              </div>

              <div className="space-y-1 pt-4 border-t border-border/50">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-foreground h-10"
                  onClick={() => toast({ title: "History Cleared" })}
                >
                  <History className="w-4 h-4 mr-3" /> Clear Chat History
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-foreground h-10"
                  onClick={() => toast({ title: "User Blocked" })}
                >
                  <Slash className="w-4 h-4 mr-3" /> Block User
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/5 h-10 mt-2"
                  onClick={deleteChat}
                >
                  <Trash2 className="w-4 h-4 mr-3" /> Delete Conversation
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
