import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const register = async (name, email, phone, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      name,
      email,
      phone,
      solde: 0,
      cardNumber: generateCardNumber(),
      cardExpiry: generateExpiry(),
      iban: generateIBAN(),         // ✅ IBAN unique par utilisateur
      createdAt: serverTimestamp(),
    });
    return cred.user;
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  useEffect(() => {
    let unsubUser = null;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (unsubUser) unsubUser();

      if (currentUser) {
        unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
          if (snap.exists()) setUserData(snap.data());
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, register, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

function generateCardNumber() {
  return Array.from({ length: 4 }, () =>
    Math.floor(1000 + Math.random() * 9000)
  ).join(" ");
}

function generateExpiry() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear() + 4).slice(-2);
  return `${month}/${year}`;
}

function generateIBAN() {
  const checkDigits = Math.floor(10 + Math.random() * 90);
  const accountNumber = Array.from({ length: 10 }, () =>
    Math.floor(Math.random() * 10)
  ).join("");
  return `ML${checkDigits}ML09001001${accountNumber}`;
}