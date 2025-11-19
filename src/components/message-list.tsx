
import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { doc, getDoc } from "@firebase/firestore";
import { AnimatePresence } from "framer-motion";
import { db } from "../lib/firebase";
import {
  messagesAtom,
  listenToMessages,
  conversationsAtom,
  Message,
  markMessagesAsRead,
} from "../atoms/conversations";
import { currentUserAtom } from "../atoms/user";
import { MessageBubble } from "./message-bubble";
import { ScrollArea } from "./ui/scroll-area";
import { decryptMessage } from "../utils/encryption";
import { useSound } from "../hooks/use-sound";

type MessageListProps = {
  conversationId: string;
};

export function MessageList({ conversationId }: MessageListProps) {
  const [allMessages, setMessages] = useAtom(messagesAtom);
  const [currentUser] = useAtom(currentUserAtom);
  const [conversations] = useAtom(conversationsAtom);

  const [recipientKey, setRecipientKey] = useState<string | null>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const playSound = useSound();
  const lastMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    const loadKey = async () => {
      const conversation = conversations.find((c) => c.id === conversationId);
      if (!conversation) return;

      const otherId = conversation.participants.find(
        (p) => p !== currentUser.id
      );
      if (!otherId) return;

      try {
        const userSnap = await getDoc(doc(db, "users", otherId));
        if (userSnap.exists()) {
          setRecipientKey(userSnap.data().publicKey);
        }
      } catch (e) {
        // Silent failure
      }
    };
    loadKey();
  }, [conversationId, conversations, currentUser.id]);

  useEffect(() => {
    if (!conversationId || !recipientKey) return;

    const mySecretKey = localStorage.getItem("secretKey");
    if (!mySecretKey) return;

    const unsubscribe = listenToMessages(conversationId, (rawMessages) => {
      const processedMessages = rawMessages.map((msg) => ({
        ...msg,
        sent: msg.senderId === currentUser.id,
        content: msg.encrypted
          ? decryptMessage(msg.content, mySecretKey, recipientKey as string)
          : msg.content,
      }));
      
      // Sound Logic
      if (processedMessages.length > 0) {
        const lastMsg = processedMessages[processedMessages.length - 1];
        // If it's a new message AND not sent by me AND different from the last one we processed
        if (lastMsg.id !== lastMessageIdRef.current && !lastMsg.sent) {
            playSound("message-in");
        }
        lastMessageIdRef.current = lastMsg.id;
      }

      setMessages((prev) => ({ ...prev, [conversationId]: processedMessages }));
    });

    return () => unsubscribe();
  }, [conversationId, setMessages, recipientKey, currentUser.id]);

  useEffect(() => {
    if (scrollViewportRef.current) {
      setTimeout(() => {
        if (scrollViewportRef.current) {
          scrollViewportRef.current.scrollTop =
            scrollViewportRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [allMessages, conversationId]);

  useEffect(() => {
    const messages = allMessages[conversationId] || [];
    const unreadMessagesExist = messages.some(
      (msg) => !msg.seen && msg.senderId !== currentUser.id
    );

    if (unreadMessagesExist) {
      markMessagesAsRead(conversationId, currentUser.id);
    }
  }, [allMessages, conversationId, currentUser.id]);

  const messages = allMessages[conversationId] || [];

  return (
    <ScrollArea className="flex-1" ref={scrollViewportRef}>
      <div className="px-4 md:px-8 py-6 space-y-5">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground/50 mt-20">
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-[10px] mt-1 uppercase tracking-widest opacity-70">Encrypted Channel Open</p>
          </div>
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message as Message & { sent: boolean }}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </ScrollArea>
  );
}
