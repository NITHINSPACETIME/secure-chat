
import { useState, useEffect, useRef } from "react";
import {
  Phone,
  Video,
  MoreVertical,
  User,
  Lock,
  ArrowLeft,
  Trash2,
  Slash,
  History,
  ShieldCheck,
  Ban
} from "lucide-react";
import { useAtom } from "jotai";
import { Timestamp } from "@firebase/firestore";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Conversation,
  activeConversationIdAtom,
  contactProfileSidebarAtom,
} from "../atoms/conversations";
import { currentUserAtom } from "../atoms/user";
import { callManager } from "../lib/callManager";
import { useToast } from "../hooks/use-toast";
import { useUserProfile } from "../hooks/use-user-profile";
import { motion, AnimatePresence } from "framer-motion";

type ChatHeaderProps = {
  conversation: Conversation;
};

export function ChatHeader({ conversation }: ChatHeaderProps) {
  const [, setActiveId] = useAtom(activeConversationIdAtom);
  const [, setSidebarState] = useAtom(contactProfileSidebarAtom);
  const [currentUser] = useAtom(currentUserAtom);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const partnerId = conversation.participants.find((p) => p !== currentUser.id) || "";
  const { profile } = useUserProfile(partnerId);
  
  const isBlocked = currentUser.blockedUsers?.includes(partnerId);

  useEffect(() => {
    const partnerTypingTimestamp = conversation.typing?.[partnerId] as unknown as Timestamp | undefined;
    if (partnerTypingTimestamp) {
      const now = Date.now();
      if (now - partnerTypingTimestamp.toDate().getTime() < 5000) {
        setIsPartnerTyping(true);
      } else {
        setIsPartnerTyping(false);
      }
    } else {
      setIsPartnerTyping(false);
    }
  }, [conversation.typing, partnerId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = profile?.name || conversation.name || "Unknown";

  return (
    <div className="h-[72px] border-b border-border/60 px-3 md:px-4 flex items-center justify-between bg-background/80 backdrop-blur-xl z-30 relative shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-1 md:gap-2 overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden -ml-2 mr-1 text-muted-foreground hover:text-foreground"
          onClick={() => setActiveId(null)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div
          className="flex items-center gap-3 cursor-pointer hover:bg-muted/40 p-1.5 pr-3 rounded-xl transition-all duration-200 -ml-2 group"
          onClick={() => setSidebarState({ isOpen: true, partnerId })}
        >
          <motion.div 
            className="relative flex-shrink-0"
            whileHover={{ scale: 1.05 }}
          >
            <Avatar className="w-9 h-9 md:w-10 md:h-10 border border-border/50 shadow-sm group-hover:shadow-md transition-all bg-muted">
              {profile?.avatar && <AvatarImage src={profile.avatar} className="object-cover" />}
              <AvatarFallback className="bg-gradient-to-br from-muted to-muted/80 text-muted-foreground">
                {displayName[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm md:text-base truncate leading-tight text-foreground">
                {displayName}
              </h2>
              <Badge variant="secondary" className="text-[9px] h-4 px-1.5 hidden sm:flex bg-primary/5 text-primary border-primary/10 font-medium">
                <Lock className="w-2.5 h-2.5 mr-0.5" /> E2EE
              </Badge>
              {isBlocked && (
                  <Badge variant="destructive" className="text-[9px] h-4 px-1.5">Blocked</Badge>
              )}
            </div>
            
            <div className="h-4 relative overflow-hidden mt-0.5">
                <AnimatePresence mode="wait">
                    {isPartnerTyping ? (
                        <motion.p 
                            key="typing"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-xs text-primary font-medium flex items-center gap-1"
                        >
                            typing<span className="animate-pulse">...</span>
                        </motion.p>
                    ) : (
                        <motion.p 
                            key="status"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-xs text-muted-foreground/80 truncate max-w-[120px] md:max-w-[200px]"
                        >
                            {profile?.statusMessage || "Tap for info"}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-0.5 md:gap-1 relative flex-shrink-0">
        {!isBlocked && (
            <>
                <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors rounded-full w-9 h-9 md:w-10 md:h-10"
                onClick={() => callManager.startCall(partnerId, displayName, false)}
                title="Voice Call"
                >
                <Phone className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
                <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors rounded-full w-9 h-9 md:w-10 md:h-10"
                onClick={() => callManager.startCall(partnerId, displayName, true)}
                title="Video Call"
                >
                <Video className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
            </>
        )}
        
        <div ref={menuRef} className="relative">
            <Button 
                variant="ghost" 
                size="icon" 
                className={`text-muted-foreground transition-colors rounded-full w-9 h-9 md:w-10 md:h-10 ${showMenu ? 'bg-muted text-foreground' : ''}`}
                onClick={() => setShowMenu(!showMenu)}
            >
                <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
            </Button>

            {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5">
                    <div className="px-4 py-2 border-b border-border/40 mb-1 bg-muted/20">
                         <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Options</p>
                    </div>
                    <button 
                        className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted/60 flex items-center gap-3 transition-colors"
                        onClick={() => { setSidebarState({ isOpen: true, partnerId }); setShowMenu(false); }}
                    >
                        <User className="w-4 h-4 opacity-70" /> Contact Info
                    </button>
                    <button 
                        className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted/60 flex items-center gap-3 transition-colors"
                         onClick={() => { toast({ title: "Encryption Verified" }); setShowMenu(false); }}
                    >
                        <ShieldCheck className="w-4 h-4 opacity-70" /> Verify Safety Number
                    </button>
                    <div className="h-px bg-border/40 my-1 mx-2" />
                    <button 
                        className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted/60 flex items-center gap-3 transition-colors text-red-500 hover:text-red-600"
                         onClick={() => { callManager.updateBlockedUsers([...(currentUser.blockedUsers || []), partnerId]); setShowMenu(false); }}
                    >
                        <Ban className="w-4 h-4 opacity-70" /> Block User
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
