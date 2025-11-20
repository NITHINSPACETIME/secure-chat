import React, { useState, useEffect } from "react";
import {
  Check,
  CheckCheck,
  Lock,
  X,
  Play,
  Pause,
  Reply,
  SmilePlus,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Message,
  replyToMessageAtom,
  toggleMessageReaction,
} from "../atoms/conversations";
import { cn } from "../lib/utils";
import { Dialog, DialogContent } from "./ui/dialog";
import { useAtom } from "jotai";
import { currentUserAtom } from "../atoms/user";
import { decryptFile } from "../utils/encryption";

type MessageBubbleProps = {
  message: Message & { sent: boolean };
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [showImage, setShowImage] = useState(false);
  const [, setReplyTo] = useAtom(replyToMessageAtom);
  const [currentUser] = useAtom(currentUserAtom);
  const [, toggleReaction] = useAtom(toggleMessageReaction);

  const [decryptedImageUrl, setDecryptedImageUrl] = useState<string | null>(
    null
  );
  const [isDecrypting, setIsDecrypting] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const legacyImageMatch = message.content.match(/^\[image\](.*?)\|?(.*)$/s);

  const secureImageMatch = message.content.match(
    /^\[secure_image\](.*?)\|(.*?)\|(.*)$/s
  );

  const textContent = secureImageMatch
    ? secureImageMatch[3]
    : legacyImageMatch
    ? legacyImageMatch[2]
    : message.content;

  useEffect(() => {
    if (secureImageMatch && !decryptedImageUrl) {
      const url = secureImageMatch[1];
      const key = secureImageMatch[2];

      setIsDecrypting(true);

      fetch(url)
        .then((res) => res.arrayBuffer())
        .then((buffer) => {
          const encryptedBytes = new Uint8Array(buffer);
          const decryptedBytes = decryptFile(encryptedBytes, key);

          if (decryptedBytes) {
            const blob = new Blob([decryptedBytes as any]);
            setDecryptedImageUrl(URL.createObjectURL(blob));
          }
        })
        .catch((err) => console.error("Failed to decrypt image", err))
        .finally(() => setIsDecrypting(false));
    }
  }, [message.content]);

  const displayImage =
    decryptedImageUrl || (legacyImageMatch ? legacyImageMatch[1] : null);

  const reactionCounts = Object.values(message.reactions || {}).reduce(
    (acc, emoji) => {
      acc[emoji] = (acc[emoji] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "flex w-full mb-4 group relative",
          message.sent ? "justify-end" : "justify-start"
        )}
      >
        <div
          className={cn(
            "absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10",
            message.sent ? "right-full mr-2" : "left-full ml-2"
          )}
        >
          <button
            onClick={() => setReplyTo(message)}
            className="p-1.5 rounded-full bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            title="Reply"
          >
            <Reply className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              toggleReaction({
                messageId: message.id,
                emoji: "❤️",
                userId: currentUser.id,
              })
            }
            className="p-1.5 rounded-full bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            title="React"
          >
            <SmilePlus className="w-4 h-4" />
          </button>
        </div>

        <div
          className={cn(
            "flex flex-col max-w-[85%] sm:max-w-[75%]",
            message.sent ? "items-end" : "items-start"
          )}
        >
          {message.replyTo && (
            <div
              className={cn(
                "mb-1 px-3 py-2 rounded-lg text-xs bg-muted/30 border-l-2 border-primary/50 w-fit max-w-full opacity-80",
                message.sent ? "rounded-tr-none" : "rounded-tl-none"
              )}
            >
              <p className="font-bold opacity-70 mb-0.5">Replying to...</p>
              <p className="truncate italic">
                {message.replyTo.content.includes("[secure_image]") ||
                message.replyTo.content.includes("[image]")
                  ? "📷 Image"
                  : message.replyTo.content}
              </p>
            </div>
          )}

          <motion.div
            whileHover={{ scale: 1.02 }}
            className={cn(
              "relative shadow-sm text-sm flex flex-col overflow-hidden border",
              message.sent
                ? "bg-primary text-primary-foreground rounded-[18px] rounded-tr-sm border-primary/10"
                : "bg-card dark:bg-zinc-800 text-foreground rounded-[18px] rounded-tl-sm border-border/50"
            )}
          >
            {displayImage ? (
              <div className="p-1 pb-0">
                <img
                  src={displayImage}
                  className="rounded-xl cursor-pointer hover:opacity-95 transition-opacity max-h-64 w-full object-cover"
                  onClick={() => setShowImage(true)}
                />
              </div>
            ) : (
              secureImageMatch &&
              isDecrypting && (
                <div className="p-4 flex items-center justify-center gap-2 bg-muted/20">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs opacity-70">
                    Decrypting Image...
                  </span>
                </div>
              )
            )}

            {textContent && (
              <div
                className={cn(
                  "px-4 py-2.5",
                  !textContent && displayImage && "hidden"
                )}
              >
                <p className="leading-relaxed whitespace-pre-wrap">
                  {textContent}
                </p>
              </div>
            )}

            <div
              className={cn(
                "flex items-center justify-end gap-1 px-3 pb-1.5 select-none",
                message.sent
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground/60",
                displayImage && !textContent
                  ? "absolute bottom-1 right-1 bg-black/30 rounded-full px-2 py-0.5 text-white backdrop-blur-md"
                  : ""
              )}
            >
              {message.encrypted && (
                <Lock className="w-[9px] h-[9px] opacity-70" />
              )}
              <span className="text-[10px] font-medium tabular-nums opacity-80">
                {formatTime(message.timestamp)}
              </span>
              {message.sent && (
                <span
                  className={cn(
                    "ml-0.5",
                    message.seen ? "text-primary-foreground" : "opacity-60"
                  )}
                >
                  {message.seen ? (
                    <CheckCheck className="w-3 h-3" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                </span>
              )}
            </div>
          </motion.div>

          {Object.keys(reactionCounts).length > 0 && (
            <div className="flex gap-1 mt-1 -mb-2 z-10">
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <div
                  key={emoji}
                  className="bg-muted/80 backdrop-blur-sm border border-border px-1.5 py-0.5 rounded-full text-[10px] shadow-sm flex items-center gap-1"
                >
                  <span>{emoji}</span>
                  {count > 1 && <span className="font-bold">{count}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <Dialog open={showImage} onOpenChange={setShowImage}>
        <DialogContent className="max-w-screen-lg w-full h-screen bg-black/90 border-none p-0 flex items-center justify-center z-[100]">
          <div
            className="relative w-full h-full flex items-center justify-center p-4"
            onClick={() => setShowImage(false)}
          >
            <img
              src={displayImage || ""}
              className="max-h-[90vh] max-w-full rounded-lg shadow-2xl object-contain"
            />
            <button className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
