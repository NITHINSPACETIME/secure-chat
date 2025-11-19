
import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, PhoneOff, Video, VideoOff, AlertTriangle, Loader2, WifiOff, User } from "lucide-react";
import { callAtom } from "../atoms/call";
import { callManager } from "../lib/callManager";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";

export function CallView() {
  const [callState] = useAtom(callAtom);
  const {
    status,
    partnerName,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    errorMessage,
    callStartTime,
    connectionStatus,
    callType
  } = callState;
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState("00:00");

  // Attach Local Stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOff]);

  // Attach Remote Stream
  useEffect(() => {
    if (remoteVideoRef.current) {
        if (remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        } else {
            remoteVideoRef.current.srcObject = null;
        }
    }
  }, [remoteStream]);
  
  // Call Timer
  useEffect(() => {
    let interval: number;
    if (status === 'connected' && callStartTime) {
      interval = window.setInterval(() => {
        const now = Date.now();
        const diff = Math.floor((now - callStartTime) / 1000);
        const minutes = Math.floor(diff / 60).toString().padStart(2, '0');
        const seconds = (diff % 60).toString().padStart(2, '0');
        setDuration(`${minutes}:${seconds}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, callStartTime]);

  const getStatusText = (iceState: string) => {
      switch(iceState) {
          case 'new': return "Initializing...";
          case 'checking': return "Connecting...";
          case 'connected': return duration;
          case 'completed': return duration;
          case 'disconnected': return "Reconnecting...";
          case 'failed': return "Connection Failed";
          case 'closed': return "Call Ended";
          default: return "Connecting...";
      }
  };

  if (status === 'error') {
      return (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-card border border-destructive/50 p-6 rounded-xl max-w-sm w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Call Failed</h3>
                <p className="text-muted-foreground text-sm">{errorMessage || "An unexpected error occurred."}</p>
                <Button onClick={() => callManager.hangUp()} className="w-full" variant="outline">
                    Close
                </Button>
            </div>
        </div>
      );
  }

  const isAudioMode = callType === 'audio';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-zinc-950 z-[9999] flex flex-col items-center justify-center text-white group overflow-hidden"
    >
      {/* Background / Remote View */}
      {isAudioMode ? (
          /* Audio Mode UI */
          <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center">
               <div className="relative">
                   {status === 'connected' && (
                       <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                   )}
                   <Avatar className="w-40 h-40 md:w-56 md:h-56 border-4 border-zinc-800 shadow-2xl z-10 relative">
                        <AvatarFallback className="bg-zinc-800 text-zinc-500 text-6xl md:text-8xl font-medium">
                           {partnerName?.[0]?.toUpperCase()}
                        </AvatarFallback>
                   </Avatar>
               </div>
          </div>
      ) : (
          /* Video Mode UI */
          <div className="absolute inset-0 w-full h-full bg-zinc-900">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover transition-opacity duration-500 ${remoteStream ? 'opacity-100' : 'opacity-0'}`}
              />
              {!remoteStream && (
                 <div className="w-full h-full flex items-center justify-center backdrop-blur-sm bg-black/30">
                     <div className="text-center animate-pulse">
                         <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-zinc-800 shadow-2xl">
                            <AvatarFallback className="text-4xl bg-zinc-800 text-zinc-400">
                               {partnerName?.[0]?.toUpperCase()}
                            </AvatarFallback>
                         </Avatar>
                     </div>
                 </div>
              )}
          </div>
      )}

      {/* Local Video (PIP) - Only in Video Mode */}
      <AnimatePresence>
        {!isVideoOff && !isAudioMode && (
            <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute top-4 right-4 w-28 md:w-48 aspect-[3/4] bg-black/50 rounded-2xl overflow-hidden shadow-2xl border border-white/10 z-20 cursor-move backdrop-blur-sm"
                drag
                dragConstraints={{ left: -window.innerWidth + 150, right: 0, top: 0, bottom: window.innerHeight - 150 }}
                whileDrag={{ scale: 1.05, cursor: "grabbing" }}
            >
                <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover flip-x"
                    style={{ transform: 'scaleX(-1)' }} 
                />
            </motion.div>
        )}
      </AnimatePresence>

      {/* Header Info */}
      <div className="absolute top-10 md:top-12 left-0 right-0 z-10 flex flex-col items-center">
         <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight drop-shadow-md mb-2">{partnerName}</h2>
         <div className={`px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-2 shadow-lg ${status === 'connected' ? 'bg-green-500/20 text-green-200' : 'bg-yellow-500/20 text-yellow-200'}`}>
             {connectionStatus === 'disconnected' ? <WifiOff className="w-3 h-3" /> : (status === 'connected' ? <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> : <Loader2 className="w-3 h-3 animate-spin" />)}
             <span className="text-xs font-mono font-medium uppercase tracking-wider">{getStatusText(connectionStatus)}</span>
         </div>
      </div>
      
      {/* Controls Bar */}
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 30 }}
           className="absolute bottom-8 md:bottom-10 z-30 left-0 right-0 flex justify-center"
        >
          <div className="flex items-center gap-6 bg-black/40 backdrop-blur-2xl px-8 py-5 rounded-full border border-white/10 shadow-2xl">
            <Button
              size="icon"
              className={`rounded-full w-14 h-14 transition-all duration-300 ${isMuted ? 'bg-white text-black hover:bg-white/90 scale-110' : 'bg-white/10 hover:bg-white/20 text-white'}`}
              onClick={() => callManager.toggleMute(!isMuted)}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>

            {/* Only show Video toggle if in Video Mode */}
            {!isAudioMode && (
                <Button
                size="icon"
                className={`rounded-full w-14 h-14 transition-all duration-300 ${isVideoOff ? 'bg-white text-black hover:bg-white/90 scale-110' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                onClick={() => callManager.toggleVideo(!isVideoOff)}
                >
                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </Button>
            )}

            <div className="w-px h-8 bg-white/10 mx-2" />

            <Button
              size="icon"
              variant="destructive"
              className="rounded-full w-16 h-14 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 hover:scale-105 transition-transform"
              onClick={() => callManager.hangUp()}
            >
              <PhoneOff className="w-7 h-7" />
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
