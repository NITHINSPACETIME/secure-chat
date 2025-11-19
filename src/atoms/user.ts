
import { atom } from "jotai";
import { doc, setDoc, updateDoc } from "@firebase/firestore";
import { db } from "../lib/firebase";

export type User = {
  id: string;
  name: string;
  publicKey: string;
  avatar?: string;
  banner?: string;
  theme?: "light" | "dark";
  bio?: string;
  statusMessage?: string;
  blockedUsers?: string[];
};

const getInitialUser = (): User => {
  return {
    id: localStorage.getItem("userId") || "",
    name: localStorage.getItem("userName") || "Anonymous",
    publicKey: localStorage.getItem("publicKey") || "",
    avatar: localStorage.getItem("userAvatar") || undefined,
    banner: localStorage.getItem("userBanner") || undefined,
    theme: (localStorage.getItem("userTheme") as "light" | "dark") || "dark",
    bio: localStorage.getItem("userBio") || "Project Nyx User",
    statusMessage: localStorage.getItem("userStatusMessage") || undefined,
    blockedUsers: JSON.parse(localStorage.getItem("blockedUsers") || "[]"),
  };
};

export const currentUserAtom = atom<User>(getInitialUser());

function sanitizeUserData(data: Partial<User>): { [key: string]: any } {
  const cleanData: { [key: string]: any } = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = (data as any)[key];
      // Explicitly allow null/undefined for banner/avatar to clear them if needed, 
      // but usually we want to pass strings.
      // If value is undefined, we might want to skip it, but for updates we might want to set to null.
      if (value !== undefined) {
          cleanData[key] = value;
      }
    }
  }
  return cleanData;
}

export const setUserDataAtom = atom(null, async (get, set, data: Partial<User> & { id: string; name: string }) => {
  const newUser = { ...get(currentUserAtom), ...data, };
  set(currentUserAtom, newUser);

  localStorage.setItem("userId", newUser.id);
  localStorage.setItem("userName", newUser.name);
  if (newUser.publicKey) localStorage.setItem("publicKey", newUser.publicKey);
  localStorage.setItem("userBio", newUser.bio || "Project Nyx User");
  localStorage.setItem("userTheme", newUser.theme || "dark");
  
  if (newUser.statusMessage) localStorage.setItem("userStatusMessage", newUser.statusMessage);
  else localStorage.removeItem("userStatusMessage");

  if (newUser.avatar) localStorage.setItem("userAvatar", newUser.avatar);
  else localStorage.removeItem("userAvatar");
  if (newUser.banner) localStorage.setItem("userBanner", newUser.banner);
  else localStorage.removeItem("userBanner");
  
  localStorage.setItem("blockedUsers", JSON.stringify(newUser.blockedUsers || []));

  try {
    const dataToSave = sanitizeUserData(newUser);
    const userRef = doc(db, "users", newUser.id);
    await setDoc(userRef, dataToSave, { merge: true });
  } catch (error) {
    console.error("Error saving user:", error);
  }
});

export const updateProfileAtom = atom(null, async (get, set, updates: Partial<User>) => {
  const currentUser = get(currentUserAtom);
  if (!currentUser.id) return;

  const updatedUser = { ...currentUser, ...updates };
  set(currentUserAtom, updatedUser);

  if (updates.name) localStorage.setItem("userName", updates.name);
  if (updates.bio) localStorage.setItem("userBio", updates.bio);
  
  if (updates.hasOwnProperty('statusMessage')) {
      if(updates.statusMessage) localStorage.setItem("userStatusMessage", updates.statusMessage);
      else localStorage.removeItem("userStatusMessage");
  }

  if (updates.theme) localStorage.setItem("userTheme", updates.theme);
  
  if (updates.hasOwnProperty('avatar')) {
    if (updates.avatar) localStorage.setItem("userAvatar", updates.avatar);
    else localStorage.removeItem("userAvatar");
  }
  if (updates.hasOwnProperty('banner')) {
    if (updates.banner) localStorage.setItem("userBanner", updates.banner);
    else localStorage.removeItem("userBanner");
  }
  
  if (updates.blockedUsers) {
      localStorage.setItem("blockedUsers", JSON.stringify(updates.blockedUsers));
  }

  try {
    const cleanUpdates = sanitizeUserData(updates);
    const userRef = doc(db, "users", currentUser.id);
    await updateDoc(userRef, cleanUpdates);
  } catch (error) {
    console.error("Error updating profile:", error);
  }
});
