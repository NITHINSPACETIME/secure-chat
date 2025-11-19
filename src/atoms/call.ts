
import { atom } from "jotai";

export type CallStatus =
  | "idle"
  | "outgoing"
  | "incoming"
  | "connected"
  | "error";

export type CallState = {
  status: CallStatus;
  partnerId: string | null;
  partnerName: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  errorMessage?: string;
  callStartTime?: number;
  connectionStatus: RTCIceConnectionState | "new"; // Track granular connection state
  callType: 'audio' | 'video'; // New field to track mode
};

const initialState: CallState = {
  status: "idle",
  partnerId: null,
  partnerName: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoOff: false,
  connectionStatus: "new",
  callType: 'video' // Default
};

export const callAtom = atom<CallState>(initialState);
