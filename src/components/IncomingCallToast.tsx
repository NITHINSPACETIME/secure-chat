
import { useAtom } from "jotai";
import { motion } from "framer-motion";
import { Phone, PhoneOff, Video } from "lucide-react";
import { callAtom } from "../atoms/call";
import { callManager } from "../lib/callManager";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";

export function IncomingCallToast() {
  const [callState] = useAtom(callAtom);
  const { partnerName, callType } = callState;

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] flex justify-center p-4 pointer-events-none">
      <motion.div
        initial={{ y: -100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -100, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="pointer-events-auto bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-4 w-full max-w-sm flex items-center gap-5 relative overflow-hidden"
      >
        {/* Glowing Pulse Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse pointer-events-none" />

        <Avatar className="w-14 h-14 border-2 border-white/10 shadow-lg z-10">
          <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xl font-bold">
            {partnerName?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 z-10">
          <p className="font-bold text-white text-lg leading-none mb-1">{partnerName}</p>
          <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium flex items-center gap-1">
             {callType === 'video' ? <Video className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
             Incoming {callType} Call...
          </p>
        </div>

        <div className="flex gap-3 z-10">
            <Button
                size="icon"
                className="rounded-full w-12 h-12 bg-red-500/90 hover:bg-red-600 text-white shadow-lg hover:scale-110 transition-all"
                onClick={() => callManager.rejectCall()}
            >
                <PhoneOff className="w-5 h-5" />
            </Button>
            <Button
                size="icon"
                className="rounded-full w-12 h-12 bg-green-500/90 hover:bg-green-600 text-white shadow-lg hover:scale-110 transition-all"
                onClick={() => callManager.answerCall(callType === 'video')}
            >
                {callType === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
            </Button>
        </div>
      </motion.div>
    </div>
  );
}
