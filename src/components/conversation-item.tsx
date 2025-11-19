
import React from "react";
import { User as UserIcon } from "lucide-react";
import { Conversation } from "../atoms/conversations";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "../lib/utils";
import { useUserProfile } from "../hooks/use-user-profile";
import { motion } from "framer-motion";

type ConversationItemProps = {
  conversation: Conversation;
  currentUserId: string;
  isActive: boolean;
  onClick: () => void;
  onProfileClick?: () => void;
};

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  currentUserId,
  isActive,
  onClick,
  onProfileClick,
}) => {
  const partnerId = conversation.participants.find((p) => p !== currentUserId);
  const { profile } = useUserProfile(partnerId);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const displayName = profile?.name || conversation.name || "Unknown User";
  const displayAvatar = profile?.avatar;
  const isUnread = conversation.unreadCount > 0;

  return (
    <div
      className={cn(
        "w-full px-3 py-3 rounded-xl text-left transition-all duration-200 mb-1 group relative overflow-hidden border border-transparent cursor-pointer select-none mx-1",
        "hover:bg-muted/50",
        isActive ? "bg-accent/60 shadow-sm" : "hover:shadow-sm"
      )}
      onClick={onClick}
      style={{ width: 'calc(100% - 8px)' }}
    >
      {isActive && (
        <motion.div 
            layoutId="active-indicator"
            className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full" 
        />
      )}

      <div className={cn("flex gap-3.5 relative z-10", isActive && "pl-2")}>
        <motion.div 
          className="relative flex-shrink-0 cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            onProfileClick?.();
          }}
        >
          <Avatar className="w-12 h-12 border-2 border-transparent group-hover:border-background/50 transition-colors shadow-sm bg-muted">
            {displayAvatar ? (
               <AvatarImage src={displayAvatar} className="object-cover" />
            ) : null}
            <AvatarFallback className={cn("bg-gradient-to-br from-muted to-muted/50 text-muted-foreground transition-colors font-bold text-lg", isActive && "from-primary/20 to-primary/5 text-primary")}>
              {displayName ? displayName[0].toUpperCase() : <UserIcon className="w-6 h-6" />}
            </AvatarFallback>
          </Avatar>
        </motion.div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          <div className="flex items-baseline justify-between">
            <h3 className={cn("font-semibold text-sm truncate leading-tight", isActive ? "text-foreground" : "text-foreground/90", isUnread && "text-foreground")}>
              {displayName}
            </h3>
            <span className={cn("text-[10px] font-medium tabular-nums flex-shrink-0 ml-2", isActive ? "text-primary/80" : "text-muted-foreground/60", isUnread && "text-primary font-bold")}>
              {formatTime(conversation.lastMessageTime)}
            </span>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <p className={cn("text-xs truncate flex-1 pr-2 leading-relaxed", isUnread ? "text-foreground font-medium" : "text-muted-foreground", isActive && !isUnread && "text-muted-foreground/80")}>
              {conversation.lastMessage}
            </p>
            
            {conversation.unreadCount > 0 && (
              <div className="flex-shrink-0 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 shadow-sm animate-in zoom-in duration-200">
                {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
