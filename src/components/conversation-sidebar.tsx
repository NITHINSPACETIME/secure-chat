
import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { Search, Plus, User } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ConversationList } from "./conversation-list";
import { MyProfileDialog } from "./my-profile-dialog";
import { ConnectDialog } from "./connect-dialog";
import {
  listenToMyConversations,
  conversationsAtom,
} from "../atoms/conversations";
import { currentUserAtom } from "../atoms/user";

export function ConversationSidebar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [currentUser] = useAtom(currentUserAtom);
  const [, setConversations] = useAtom(conversationsAtom);

  useEffect(() => {
    if (!currentUser.id) return;
    const unsubscribe = listenToMyConversations(
      currentUser.id,
      (updatedConversations) => {
        setConversations(updatedConversations);
      }
    );
    return () => unsubscribe();
  }, [currentUser.id, setConversations]);

  return (
    <div className="flex flex-col h-full w-full bg-background/95 backdrop-blur-sm border-r border-border/60">
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-5 px-1">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setProfileOpen(true)}>
            <div className="relative">
                <Avatar className="w-9 h-9 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                {currentUser.avatar ? (
                    <AvatarImage
                    src={currentUser.avatar}
                    className="object-cover w-full h-full"
                    />
                ) : (
                    <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="w-4 h-4" />
                    </AvatarFallback>
                )}
                </Avatar>
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground/90 group-hover:text-primary transition-colors">Chats</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setConnectOpen(true)}
            className="rounded-full w-9 h-9 bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors"
            title="New Conversation"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/40 border-transparent focus:bg-background focus:border-primary/20 h-10 rounded-xl transition-all shadow-sm"
          />
        </div>
      </div>

      <ConversationList searchQuery={searchQuery} />

      <MyProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <ConnectDialog open={connectOpen} onOpenChange={setConnectOpen} />
    </div>
  );
}
