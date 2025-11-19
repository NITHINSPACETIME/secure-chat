
import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { AnimatePresence, motion } from "framer-motion";
import { doc, getDoc, setDoc } from "@firebase/firestore";
import { db } from "./lib/firebase";
import { ConversationSidebar } from "./components/conversation-sidebar";
import { ChatArea } from "./components/chat-area";
import { Toaster } from "./components/ui/toaster";
import { WelcomeScreen } from "./pages/welcome-screen";
import { CreateAccountFlow } from "./pages/create-account-flow";
import { RestoreAccountFlow } from "./pages/restore-account-flow";
import { authStateAtom, setAuthenticatedAtom } from "./atoms/auth";
import { currentUserAtom, setUserDataAtom } from "./atoms/user";
import {
  activeConversationIdAtom,
  contactProfileSidebarAtom,
} from "./atoms/conversations";
import { cn } from "./lib/utils";
import { generateKeysFromPhrase } from "./utils/crypto";
import { ContactProfileSidebar } from "./components/contact-profile-sidebar";
import { CallManager } from "./components/CallManager";

type OnboardingFlow = "welcome" | "create" | "restore" | null;

export default function App() {
  const [authState] = useAtom(authStateAtom);
  const [, setAuthenticated] = useAtom(setAuthenticatedAtom);
  const [currentUser] = useAtom(currentUserAtom);
  const [, setUserData] = useAtom(setUserDataAtom);
  const [activeConversationId] = useAtom(activeConversationIdAtom);
  const [sidebarState] = useAtom(contactProfileSidebarAtom);

  const [onboardingFlow, setOnboardingFlow] = useState<OnboardingFlow>(
    authState.isAuthenticated ? null : "welcome"
  );

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      currentUser.theme === "dark"
    );
  }, [currentUser.theme]);

  const saveKeysAndLogin = (
    sessionId: string,
    name: string,
    phrase: string,
    avatar?: string
  ) => {
    const { publicKey, secretKey } = generateKeysFromPhrase(phrase);
    localStorage.setItem("recoveryPhrase", phrase);
    localStorage.setItem("secretKey", secretKey);

    setUserData({
      id: sessionId,
      name: name,
      publicKey: publicKey,
      avatar: avatar,
    });

    setAuthenticated(true);
    setOnboardingFlow(null);
  };

  useEffect(() => {
    const repairAccount = async () => {
      if (!authState.isAuthenticated) return;
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const storedPublicKey = localStorage.getItem("publicKey") || "";
          await setDoc(
            userRef,
            {
              id: userId,
              name: localStorage.getItem("userName") || "Restored User",
              publicKey: storedPublicKey,
              avatar: localStorage.getItem("userAvatar") || null,
              banner: localStorage.getItem("userBanner") || null,
              theme: localStorage.getItem("userTheme") || "dark",
              lastSeen: new Date(),
            },
            { merge: true }
          );
        }
      } catch (e) {
        console.error("Auto-repair failed:", e);
      }
    };
    repairAccount();
  }, [authState.isAuthenticated]);

  const handleCreateAccount = (data: {
    sessionId: string;
    displayName: string;
    recoveryPhrase: string;
  }) => {
    saveKeysAndLogin(data.sessionId, data.displayName, data.recoveryPhrase);
  };

  const handleRestoreAccount = (data: {
    sessionId: string;
    recoveryPhrase: string;
    name?: string;
    avatar?: string;
  }) => {
    saveKeysAndLogin(
      data.sessionId,
      data.name || "Restored User",
      data.recoveryPhrase,
      data.avatar
    );
  };

  if (onboardingFlow) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={onboardingFlow}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {onboardingFlow === "welcome" && (
            <WelcomeScreen
              onCreateAccount={() => setOnboardingFlow("create")}
              onRestoreAccount={() => setOnboardingFlow("restore")}
            />
          )}
          {onboardingFlow === "create" && (
            <CreateAccountFlow
              onComplete={handleCreateAccount}
              onBack={() => setOnboardingFlow("welcome")}
            />
          )}
          {onboardingFlow === "restore" && (
            <RestoreAccountFlow
              onComplete={handleRestoreAccount}
              onBack={() => setOnboardingFlow("welcome")}
            />
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <>
      <div className="h-screen w-screen flex overflow-hidden bg-background text-foreground font-sans antialiased selection:bg-primary/20">
        <div
          className={cn(
            "h-full border-r border-border bg-background transition-all duration-300",
            "md:w-80 md:flex md:flex-col md:translate-x-0",
            activeConversationId ? "hidden" : "w-full flex flex-col"
          )}
        >
          <ConversationSidebar />
        </div>

        <div
          className={cn(
            "h-full flex-1 bg-background transition-all duration-300",
            "md:flex md:flex-col",
            activeConversationId ? "w-full flex flex-col" : "hidden"
          )}
        >
          <ChatArea />
        </div>
        <Toaster />
        <ContactProfileSidebar
          isOpen={sidebarState.isOpen}
          partnerId={sidebarState.partnerId}
        />
      </div>
      <CallManager />
    </>
  );
}
