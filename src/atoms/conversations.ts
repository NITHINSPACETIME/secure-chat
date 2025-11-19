
import { atom } from "jotai";
import type { PrimitiveAtom } from "jotai";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  deleteField,
  getDocs,
  writeBatch,
  increment,
  orderBy
} from "@firebase/firestore";
import { db } from "../lib/firebase";
import { currentUserAtom } from "./user";

export type Reaction = {
    emoji: string;
    userId: string;
};

export type Message = {
  id: string;
  content: string;
  timestamp: Date;
  senderId: string;
  encrypted?: boolean;
  seen?: boolean;
  replyTo?: {
      id: string;
      content: string;
      senderId: string;
  };
  reactions?: Record<string, string>; // userId -> emoji
};

export type Conversation = {
  id: string;
  name: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  typing?: { [key: string]: Timestamp };
};

export const conversationsAtom = atom<Conversation[]>([]) as PrimitiveAtom<Conversation[]>;
export const activeConversationIdAtom = atom<string | null>(null) as PrimitiveAtom<string | null>;
export const messagesAtom = atom<Record<string, Message[]>>({}) as PrimitiveAtom<Record<string, Message[]>>;
export const replyToMessageAtom = atom<Message | null>(null) as PrimitiveAtom<Message | null>;

export type SidebarState = {
  isOpen: boolean;
  partnerId: string | null;
};

export const contactProfileSidebarAtom = atom<SidebarState>({
  isOpen: false,
  partnerId: null,
}) as PrimitiveAtom<SidebarState>;

export const sendMessageAtom = atom(
  null,
  async (get, set, { conversationId, content, senderId, encrypted, replyTo }: any) => {
    const currentUser = get(currentUserAtom);
    const conversations = get(conversationsAtom);
    const currentConv = conversations.find((c) => c.id === conversationId);

    // Check Blocking
    if (currentConv) {
        const partnerId = currentConv.participants.find(p => p !== senderId);
        if (partnerId && currentUser.blockedUsers?.includes(partnerId)) {
            throw new Error("Cannot send message to blocked user.");
        }
    }

    try {
      const messageData: any = {
        conversationId,
        content,
        senderId,
        encrypted: encrypted || false,
        createdAt: serverTimestamp(),
        seen: false,
      };

      if (replyTo) {
          messageData.replyTo = replyTo;
      }

      // 1. Add the message
      await addDoc(collection(db, "messages"), messageData);

      // 2. Update conversation metadata
      const updatePayload: any = {
        lastMessage: encrypted ? "Encrypted Message" : (content.startsWith('[image]') ? '📷 Image' : content),
        lastMessageTime: serverTimestamp(),
      };

      // Increment unread count for the OTHER participant(s)
      if (currentConv) {
        currentConv.participants.forEach(pid => {
            if (pid !== senderId) {
                 updatePayload[`unreadCounts.${pid}`] = increment(1);
            }
        });
      }

      const convRef = doc(db, "conversations", conversationId);
      await setDoc(convRef, updatePayload, { merge: true });
      
      // Clear reply state
      set(replyToMessageAtom, null);

    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }
);

export const toggleMessageReaction = atom(
    null,
    async (get, set, { messageId, emoji, userId }: { messageId: string, emoji: string, userId: string }) => {
       const messageRef = doc(db, "messages", messageId);
       // Determine if we are adding or removing (simplified: always set for now, ui handles toggle logic usually)
       await updateDoc(messageRef, {
           [`reactions.${userId}`]: emoji
       });
    }
);

export async function createConversationInCloud(
  myId: string,
  myName: string,
  otherId: string,
  otherName: string
) {
  const ids = [myId, otherId].sort();
  const conversationId = ids.join("_");

  const convRef = doc(db, "conversations", conversationId);

  // Initialize if not exists, merging carefully
  await setDoc(
    convRef,
    {
      id: conversationId,
      participants: ids,
      lastMessage: "Chat started",
      lastMessageTime: serverTimestamp(),
      names: {
        [myId]: myName || "Unknown",
        [otherId]: otherName || "Unknown",
      },
      unreadCounts: {
        [myId]: 0,
        [otherId]: 0
      }
    },
    { merge: true }
  );

  return conversationId;
}

export async function updateUserTypingStatus(
  conversationId: string,
  userId: string,
  isTyping: boolean
) {
  if (!conversationId || !userId) return;
  try {
    const convRef = doc(db, "conversations", conversationId);
    const typingUpdate = {
      [`typing.${userId}`]: isTyping ? serverTimestamp() : deleteField(),
    };
    await updateDoc(convRef, typingUpdate);
  } catch (error) {
    // Silently fail for typing indicators
  }
}

export async function markMessagesAsRead(
  conversationId: string,
  currentUserId: string
) {
  if (!conversationId || !currentUserId) return;
  
  // FIX: Avoid complex compound queries that need custom indexes.
  // Query ONLY by conversationId, then filter client-side.
  const messagesQuery = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId)
  );

  try {
    const batch = writeBatch(db);
    const snapshot = await getDocs(messagesQuery);
    
    let updatesCount = 0;

    if (!snapshot.empty) {
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Client-side filtering to avoid index error
        if (data.senderId !== currentUserId && data.seen === false) {
             batch.update(doc.ref, { seen: true });
             updatesCount++;
        }
      });
    }
    
    // 2. Reset unread count in conversation doc for THIS user
    const convRef = doc(db, "conversations", conversationId);
    batch.update(convRef, {
        [`unreadCounts.${currentUserId}`]: 0
    });

    // Only commit if we have updates or to reset the counter
    await batch.commit();
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
}

export function listenToMyConversations(
  userId: string,
  callback: (convs: Conversation[]) => void
) {
  if (!userId) return () => {};

  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", userId)
  );

  return onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map((doc) => {
      const data = doc.data();
      const otherId = data.participants.find((p: string) => p !== userId);

      let displayName = "Unknown";
      if (data.names && otherId && data.names[otherId]) {
        displayName = data.names[otherId];
      } else {
        displayName = otherId ? `User ${otherId.slice(0,5)}` : "Chat";
      }

      const unreadCount = data.unreadCounts ? (data.unreadCounts[userId] || 0) : 0;

      return {
        id: doc.id,
        participants: data.participants,
        name: displayName,
        lastMessage: data.lastMessage || "",
        lastMessageTime: data.lastMessageTime
          ? (data.lastMessageTime as Timestamp).toDate()
          : new Date(),
        unreadCount: unreadCount,
        typing: data.typing,
      } as Conversation;
    });

    conversations.sort(
      (a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
    );

    callback(conversations);
  });
}

export function listenToMessages(
  conversationId: string,
  callback: (msgs: Message[]) => void
) {
  if (!conversationId) return () => {};

  const q = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId)
  );

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        content: data.content,
        timestamp: data.createdAt
          ? (data.createdAt as Timestamp).toDate()
          : new Date(),
        senderId: data.senderId,
        encrypted: data.encrypted,
        seen: data.seen || false,
        replyTo: data.replyTo,
        reactions: data.reactions
      };
    });

    messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    callback(messages);
  });
}
