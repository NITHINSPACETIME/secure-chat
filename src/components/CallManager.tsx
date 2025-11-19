
import { useEffect } from "react";
import { useAtom } from "jotai";
import { callAtom } from "../atoms/call";
import { currentUserAtom } from "../atoms/user";
import { callManager } from "../lib/callManager";
import { IncomingCallToast } from "./IncomingCallToast";
import { CallView } from "./CallView";

export function CallManager() {
  const [callState, setCallState] = useAtom(callAtom);
  const [currentUser] = useAtom(currentUserAtom);

  useEffect(() => {
    if (currentUser.id) {
      callManager.init(currentUser.id, setCallState);
    }
  }, [currentUser.id, setCallState]);

  if (callState.status === "idle") {
    return null;
  }

  if (callState.status === "incoming") {
    return <IncomingCallToast />;
  }

  if (
    callState.status === "outgoing" ||
    callState.status === "connected"
  ) {
    return <CallView />;
  }

  return null;
}
