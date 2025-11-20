import React, { useState, useEffect, useRef } from "react";
import { useAtom } from "jotai";
import {
  Send,
  Paperclip,
  Smile,
  Lock,
  AlertTriangle,
  Loader2,
  X,
  Reply,
  Image as ImageIcon,
} from "lucide-react";
import { doc, getDoc } from "@firebase/firestore";
import { db } from "../lib/firebase";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  sendMessageAtom,
  conversationsAtom,
  replyToMessageAtom,
} from "../atoms/conversations";
import { currentUserAtom } from "../atoms/user";
import { encryptMessage, encryptFile } from "../utils/encryption";
import { uploadEncryptedFile, fileToUint8Array } from "../utils/services";
import { useSound } from "../hooks/use-sound";
import { AnimatePresence, motion } from "framer-motion";

type MessageInputProps = {
  conversationId: string;
};

const EMOJI_CATEGORIES = {
  Faces: [
    "😀",
    "😂",
    "🤣",
    "😊",
    "😍",
    "🥰",
    "😎",
    "😭",
    "😡",
    "🤔",
    "🤯",
    "🥶",
    "🥳",
    "🤮",
    "🤡",
    "👻",
  ],
  Hands: [
    "👋",
    "✋",
    "👌",
    "✌️",
    "🤞",
    "🤟",
    "👍",
    "👎",
    "👏",
    "🙌",
    "🤝",
    "🙏",
    "💪",
    "💅",
  ],
  Hearts: [
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "💔",
    "❣️",
    "💕",
    "💞",
    "💓",
    "💗",
  ],
  Objects: [
    "🔥",
    "✨",
    "🎉",
    "🚀",
    "💡",
    "💣",
    "💊",
    "🎈",
    "🎁",
    "💎",
    "🔑",
    "🔒",
    "📱",
    "💻",
  ],
  Symbols: [
    "✅",
    "❌",
    "💯",
    "❓",
    "❗️",
    "⚠️",
    "⛔️",
    "🟢",
    "🔴",
    "🔵",
    "⚪️",
    "💲",
    "©️",
    "®️",
  ],
};

export function MessageInput({ conversationId }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [, sendMessage] = useAtom(sendMessageAtom);
  const [conversations] = useAtom(conversationsAtom);
  const [currentUser] = useAtom(currentUserAtom);
  const [replyTo, setReplyTo] = useAtom(replyToMessageAtom);

  const [recipientKey, setRecipientKey] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const keyCache = useRef<Record<string, string>>({});

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [statusMessage, setStatusMessage] = useState("Initializing...");

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiCategory, setEmojiCategory] =
    useState<keyof typeof EMOJI_CATEGORIES>("Faces");
  const [attachment, setAttachment] = useState<{
    url: string;
    file: File;
  } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const playSound = useSound();

  useEffect(() => {
    const loadKey = async () => {
      setStatus("loading");
      const conversation = conversations.find((c) => c.id === conversationId);
      if (!conversation) return;

      const otherId = conversation.participants.find(
        (p) => p !== currentUser.id
      );
      if (!otherId) return;

      if (currentUser.blockedUsers?.includes(otherId)) {
        setIsBlocked(true);
        setStatus("error");
        setStatusMessage("You have blocked this user.");
        return;
      }
      setIsBlocked(false);

      if (keyCache.current[conversationId]) {
        setRecipientKey(keyCache.current[conversationId]);
        setStatus("ready");
        setStatusMessage("Type a secure message...");
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, "users", otherId));
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.publicKey) {
            keyCache.current[conversationId] = userData.publicKey;
            setRecipientKey(userData.publicKey);
            setStatus("ready");
            setStatusMessage("Type a secure message...");
          }
        }
      } catch (e) {
        setStatus("error");
      }
    };
    loadKey();
  }, [conversationId, currentUser.id, currentUser.blockedUsers]);

  const handleSend = async () => {
    if ((!message.trim() && !attachment) || !recipientKey || isBlocked) return;
    setIsSending(true);

    const mySecretKey = localStorage.getItem("Nyx Key");
    if (!mySecretKey) {
      setIsSending(false);
      return;
    }

    let contentToSend = message.trim();

    try {
      if (attachment) {
        const fileBytes = await fileToUint8Array(attachment.file);

        const { encryptedData, key } = encryptFile(fileBytes);

        const downloadUrl = await uploadEncryptedFile(
          encryptedData,
          attachment.file.type
        );

        contentToSend = `[secure_image]${downloadUrl}|${key}|${contentToSend}`;
      }

      const encryptedContent = encryptMessage(
        contentToSend,
        mySecretKey,
        recipientKey
      );

      await sendMessage({
        conversationId,
        content: encryptedContent,
        senderId: currentUser.id,
        encrypted: true,
        replyTo: replyTo
          ? {
              id: replyTo.id,
              content: replyTo.content,
              senderId: replyTo.senderId,
            }
          : undefined,
      });

      playSound("message-out");
      setMessage("");
      setAttachment(null);
      setReplyTo(null);
      setShowEmojiPicker(false);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to send message");
    }
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border p-4 bg-background relative z-20">
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center gap-3 mb-2 px-4 py-2 bg-muted/50 rounded-xl border-l-4 border-primary"
          >
            <Reply className="w-4 h-4 text-primary" />
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-primary">
                Replying to message
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {replyTo.content.startsWith("[image]") ||
                replyTo.content.startsWith("[secure_image]")
                  ? "📷 Image"
                  : replyTo.content}
              </p>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="p-1 hover:bg-background rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full right-0 mb-2 mr-4 bg-popover border border-border shadow-xl rounded-xl w-80 z-50 overflow-hidden flex flex-col"
          >
            <div className="flex gap-1 p-2 bg-muted/50 overflow-x-auto no-scrollbar">
              {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setEmojiCategory(cat as any)}
                  className={`text-[10px] px-2 py-1 rounded-full transition-colors ${
                    emojiCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-background text-muted-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="p-3 grid grid-cols-8 gap-1 h-48 overflow-y-auto">
              {EMOJI_CATEGORIES[
                emojiCategory as keyof typeof EMOJI_CATEGORIES
              ].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setMessage((prev) => prev + emoji)}
                  className="hover:bg-muted rounded p-1 text-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {attachment && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-2 relative w-fit"
          >
            <img
              src={attachment.url}
              alt="Preview"
              className="h-20 w-auto rounded-lg border border-border object-cover"
            />
            <button
              onClick={() => setAttachment(null)}
              className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5 shadow-md hover:bg-destructive/90"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isBlocked ? (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-center text-sm font-medium flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" /> You blocked this user. Unblock
          to send messages.
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) =>
              e.target.files?.[0] &&
              setAttachment({
                url: URL.createObjectURL(e.target.files[0]),
                file: e.target.files[0],
              })
            }
          />
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-5 h-5 text-muted-foreground" />
          </Button>

          <div className="flex-1 relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                status === "ready" ? "Type a secure message..." : statusMessage
              }
              disabled={status !== "ready"}
              className="min-h-[44px] max-h-32 py-3 pr-10 bg-muted/30 border-transparent focus:bg-background rounded-2xl resize-none"
              rows={1}
            />
            <Button
              variant="ghost"
              size="icon"
              className={`absolute right-1 bottom-1 h-8 w-8 rounded-full ${
                showEmojiPicker ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="w-5 h-5" />
            </Button>
          </div>

          <Button
            onClick={handleSend}
            disabled={
              status !== "ready" ||
              (!message.trim() && !attachment) ||
              isSending
            }
            size="icon"
            className="rounded-full w-11 h-11 bg-primary hover:bg-primary/90 shadow-md"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 ml-0.5" />
            )}
          </Button>
        </div>
      )}

      <div className="mt-2 flex justify-center">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1 select-none opacity-40 hover:opacity-100 transition-opacity">
          <Lock className="w-3 h-3" /> End-to-End Encrypted via Curve25519
        </span>
      </div>
    </div>
  );
}
