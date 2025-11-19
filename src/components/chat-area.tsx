
import { useAtom } from "jotai";
import {
  activeConversationIdAtom,
  conversationsAtom,
} from "../atoms/conversations";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { Shield, Lock } from "lucide-react";

export function ChatArea() {
  const [activeId] = useAtom(activeConversationIdAtom);
  const [conversations] = useAtom(conversationsAtom);

  const activeConversation = conversations.find((c) => c.id === activeId);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background/50 bg-chat-pattern relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-background to-background/80 pointer-events-none" />
        
        <div className="text-center p-8 max-w-md relative z-10 animate-in fade-in zoom-in duration-700 slide-in-from-bottom-4">
          <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-muted backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/10 rotate-3 hover:rotate-0 transition-transform duration-500">
             <Shield className="w-14 h-14 text-primary drop-shadow-lg" />
          </div>
          
          <h2 className="text-4xl font-extrabold mb-4 tracking-tight text-foreground">
            Project Nyx
          </h2>
          
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            Select a conversation to start messaging. <br/>
            Your privacy is our priority.
          </p>
          
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 py-2.5 px-5 rounded-full border border-primary/20 shadow-sm">
             <Lock className="w-3.5 h-3.5" /> End-to-End Encrypted
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background relative">
      <div className="absolute inset-0 bg-chat-pattern opacity-[0.3] pointer-events-none" />
      <div className="relative flex-1 flex flex-col z-10 h-full">
        <ChatHeader conversation={activeConversation} />
        <MessageList conversationId={activeId as string} />
        <MessageInput conversationId={activeId as string} />
      </div>
    </div>
  );
}
