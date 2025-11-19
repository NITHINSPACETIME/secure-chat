
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  addDoc,
  query,
  where,
  deleteDoc,
  Unsubscribe,
} from "@firebase/firestore";
import { db } from "./firebase";
import { CallState } from "../atoms/call";
import { SetStateAction } from "jotai";

let peerConnection: RTCPeerConnection | null = null;
let myId: string | null = null;
let setCallState: ((update: SetStateAction<CallState>) => void) | null = null;
let callId: string | null = null;
let incomingCallListener: Unsubscribe | null = null;
let activeCallListener: Unsubscribe | null = null;
let candidateListener: Unsubscribe | null = null;
let localStreamRef: MediaStream | null = null;
let blockedUsers: string[] = [];

const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

const cleanup = () => {
  if (localStreamRef) {
    localStreamRef.getTracks().forEach((track) => {
      track.stop();
    });
    localStreamRef = null;
  }

  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  if (activeCallListener) {
    activeCallListener();
    activeCallListener = null;
  }
  if (candidateListener) {
    candidateListener();
    candidateListener = null;
  }

  callId = null;

  if (setCallState) {
    setCallState({
      status: "idle",
      partnerId: null,
      partnerName: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoOff: false,
      errorMessage: undefined,
      callStartTime: undefined,
      connectionStatus: "new",
      callType: 'video'
    });
  }
};

const initializePeerConnection = () => {
  if (peerConnection) {
    peerConnection.close();
  }

  peerConnection = new RTCPeerConnection(servers);

  peerConnection.ontrack = (event) => {
    console.log("Received remote track", event.streams);
    const remoteMediaStream =
      event.streams[0] || new MediaStream([event.track]);

    if (setCallState) {
      setCallState((prev) => ({
        ...prev,
        remoteStream: remoteMediaStream,
      }));
    }
  };

  peerConnection.oniceconnectionstatechange = () => {
    const state = peerConnection?.iceConnectionState || "closed";
    
    if (setCallState) {
      setCallState((prev) => ({ ...prev, connectionStatus: state }));

      if (state === "failed") {
        setCallState((prev) => ({
          ...prev,
          status: "error",
          errorMessage:
            "Connection failed. The network link could not be established.",
        }));
      } else if (state === "closed") {
         cleanup();
      }
    }
  };
};

export const callManager = {
  init: (
    _myId: string,
    _setCallState: (update: SetStateAction<CallState>) => void,
    _blockedUsers: string[] = []
  ) => {
    myId = _myId;
    setCallState = _setCallState;
    blockedUsers = _blockedUsers;
    callManager.listenForIncomingCalls();
  },
  
  updateBlockedUsers: (newBlocked: string[]) => {
      blockedUsers = newBlocked;
  },

  listenForIncomingCalls: () => {
    if (incomingCallListener || !myId) return;
    const callsRef = collection(db, "calls");
    const q = query(callsRef, where("calleeId", "==", myId));

    incomingCallListener = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const callData = change.doc.data();
          
          // Block Check
          if (blockedUsers.includes(callData.callerId)) {
             // Silently ignore/reject
             return; 
          }

          if (setCallState && !callId) {
            const userSnap = await getDoc(doc(db, "users", callData.callerId));
            callId = change.doc.id;
            setCallState((prev) => ({
              ...prev,
              status: "incoming",
              partnerId: callData.callerId,
              partnerName: userSnap.exists()
                ? userSnap.data().name
                : "Unknown Caller",
              connectionStatus: "new",
              callType: callData.callType || 'video'
            }));
          }
        }
        if (change.type === "removed" && change.doc.id === callId) {
            cleanup();
        }
      });
    });
  },

  startCall: async (
    partnerId: string,
    partnerName: string,
    isVideo: boolean
  ) => {
    if (!myId || !setCallState) return;
    
    if (blockedUsers.includes(partnerId)) {
        setCallState(prev => ({ ...prev, status: "error", errorMessage: "Cannot call blocked user." }));
        return;
    }

    if (callId) await callManager.hangUp();

    callId = doc(collection(db, "calls")).id;
    const callType = isVideo ? 'video' : 'audio';

    try {
      initializePeerConnection();

      localStreamRef = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true,
      });

      localStreamRef.getTracks().forEach((track) => {
        peerConnection?.addTrack(track, localStreamRef!);
      });

      setCallState((prev) => ({
        ...prev,
        localStream: localStreamRef,
        status: "outgoing",
        partnerId,
        partnerName,
        isVideoOff: !isVideo,
        connectionStatus: "new",
        callType
      }));

      const candidatesCollection = collection(db, "calls", callId!, "callerCandidates");
      peerConnection!.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(candidatesCollection, event.candidate.toJSON());
        }
      };

      const offerDescription = await peerConnection!.createOffer();
      await peerConnection!.setLocalDescription(offerDescription);

      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
      };

      await setDoc(doc(db, "calls", callId!), {
        callerId: myId,
        calleeId: partnerId,
        offer,
        callType
      });

      activeCallListener = onSnapshot(doc(db, "calls", callId!), async (docSnapshot) => {
        if (!docSnapshot.exists()) {
            cleanup();
            return;
        }
        const data = docSnapshot.data();
        if (data?.status === 'rejected') {
            setCallState(prev => ({...prev, status: 'error', errorMessage: "Call Declined" }));
            setTimeout(cleanup, 2000);
            return;
        }

        if (!peerConnection?.currentRemoteDescription && data?.answer) {
          const answerDescription = new RTCSessionDescription(data.answer);
          await peerConnection?.setRemoteDescription(answerDescription);
          setCallState((prev) => ({
            ...prev,
            status: "connected",
            callStartTime: Date.now(),
          }));
        }
      });

      candidateListener = onSnapshot(
        collection(db, "calls", callId!, "answerCandidates"),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const candidate = new RTCIceCandidate(change.doc.data());
              peerConnection?.addIceCandidate(candidate);
            }
          });
        }
      );
    } catch (err: any) {
      console.error("Error starting call:", err);
      setCallState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: "Failed to access media devices.",
      }));
    }
  },

  answerCall: async (isVideo: boolean) => {
    if (!callId || !setCallState) return;

    try {
      initializePeerConnection();
      
      // If accepting audio call, ensure we don't ask for video even if 'isVideo' arg is passed true accidentally
      // (Though UI should control this)
      
      localStreamRef = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true,
      });
      localStreamRef.getTracks().forEach((track) => {
        peerConnection?.addTrack(track, localStreamRef!);
      });

      setCallState((prev) => ({
        ...prev,
        localStream: localStreamRef,
        isVideoOff: !isVideo,
      }));

      const callDocRef = doc(db, "calls", callId);
      const callDocSnap = await getDoc(callDocRef);
      const callData = callDocSnap.data();

      if (!callData) throw new Error("Call data not found");

      const candidatesCollection = collection(db, "calls", callId, "answerCandidates");
      peerConnection!.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(candidatesCollection, event.candidate.toJSON());
        }
      };

      await peerConnection?.setRemoteDescription(new RTCSessionDescription(callData.offer));
      const answerDescription = await peerConnection!.createAnswer();
      await peerConnection!.setLocalDescription(answerDescription);

      const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
      };

      await updateDoc(callDocRef, { answer });
      setCallState((prev) => ({
        ...prev,
        status: "connected",
        callStartTime: Date.now(),
      }));

      candidateListener = onSnapshot(
        collection(db, "calls", callId, "callerCandidates"),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const candidate = new RTCIceCandidate(change.doc.data());
              peerConnection?.addIceCandidate(candidate);
            }
          });
        }
      );
      
      activeCallListener = onSnapshot(callDocRef, (docSnapshot) => {
          if (!docSnapshot.exists()) {
              cleanup();
          }
      });

    } catch (err: any) {
      console.error("Error answering call:", err);
      setCallState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: "Failed to connect call.",
      }));
    }
  },

  rejectCall: async () => {
      if (callId) {
          try {
              await updateDoc(doc(db, "calls", callId), { status: 'rejected' });
              // Allow some time for caller to receive update then delete
              setTimeout(async () => {
                  try { await deleteDoc(doc(db, "calls", callId!)); } catch(e){}
              }, 1000);
          } catch(e) {}
      }
      cleanup();
  },

  hangUp: async () => {
    const currentCallId = callId;
    cleanup();
    if (currentCallId) {
      try {
        await deleteDoc(doc(db, "calls", currentCallId));
      } catch (e) { }
    }
  },

  toggleMute: (isMuted: boolean) => {
    if (localStreamRef && setCallState) {
      localStreamRef.getAudioTracks().forEach((track) => (track.enabled = !isMuted));
      setCallState((prev) => ({ ...prev, isMuted }));
    }
  },

  toggleVideo: (isVideoOff: boolean) => {
    if (localStreamRef && setCallState) {
      localStreamRef.getVideoTracks().forEach((track) => (track.enabled = !isVideoOff));
      setCallState((prev) => ({ ...prev, isVideoOff }));
    }
  },
};
