
import { useAtom } from "jotai";
import { motion } from "framer-motion";
import {
  conversationsAtom,
  activeConversationIdAtom,
  contactProfileSidebarAtom,
} from "../atoms/conversations";
import { currentUserAtom } from "../atoms/user";
import { ConversationItem } from "./conversation-item";
import { ScrollArea } from "./ui/scroll-area";

type ConversationListProps = {
  searchQuery: string;
};

export function ConversationList({ searchQuery }: ConversationListProps) {
  const [conversations] = useAtom(conversationsAtom);
  const [activeId, setActiveId] = useAtom(activeConversationIdAtom);
  const [, setSidebarState] = useAtom(contactProfileSidebarAtom);
  const [currentUser] = useAtom(currentUserAtom);

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.name && conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProfileClick = (participants: string[]) => {
    const partnerId = participants.find((p) => p !== currentUser.id);
    if (partnerId) {
      setSidebarState({ isOpen: true, partnerId });
    }
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-3 space-y-1">
        {filteredConversations.map((conversation, i) => (
          <motion.div
            key={conversation.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <ConversationItem
              conversation={conversation}
              currentUserId={currentUser.id}
              isActive={activeId === conversation.id}
              onClick={() => setActiveId(conversation.id)}
              onProfileClick={() => handleProfileClick(conversation.participants)}
            />
          </motion.div>
        ))}
        
        {filteredConversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center opacity-50">
             <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <span className="text-2xl">💬</span>
             </div>
             <p className="text-sm font-medium">No conversations found.</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
