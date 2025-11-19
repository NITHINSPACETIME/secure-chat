
import { initializeApp } from "@firebase/app";
import { getFirestore } from "@firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAyWHwnUu2MT_X6sPxcuxxzqqGZSi5pm7Q",
  authDomain: "spacetime909.firebaseapp.com",
  projectId: "spacetime909",
  storageBucket: "spacetime909.appspot.com",
  messagingSenderId: "259191417830",
  appId: "1:259191417830:web:5027e5c38b611640440427",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
