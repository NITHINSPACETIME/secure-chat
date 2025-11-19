
import { useState, useEffect } from "react";
import { doc, onSnapshot } from "@firebase/firestore";
import { db } from "../lib/firebase";
import { User } from "../atoms/user";

export function useUserProfile(userId: string | null | undefined) {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, "users", userId), (doc) => {
      if (doc.exists()) {
        setProfile(doc.data() as User);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching user profile:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { profile, loading };
}
