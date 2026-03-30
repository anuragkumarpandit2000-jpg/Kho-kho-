import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, COACH_EMAIL } from "@/firebase";

interface AuthUser {
  uid: string;
  email: string;
  name: string;
  isCoach: boolean;
  totalScore: number;
  specialty?: string;
  photoBase64?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUserProfile(fbUser: User) {
    const ref = doc(db, "users", fbUser.uid);
    const snap = await getDoc(ref);
    const data = snap.data();
    setUser({
      uid: fbUser.uid,
      email: fbUser.email || "",
      name: data?.name || fbUser.email?.split("@")[0] || "Player",
      isCoach: fbUser.email === COACH_EMAIL,
      totalScore: data?.totalScore || 0,
      specialty: data?.specialty || "",
      photoBase64: data?.photoBase64 || "",
    });
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await loadUserProfile(fbUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function register(email: string, password: string, name: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      name,
      email,
      totalScore: 0,
      specialty: "",
      photoBase64: "",
      createdAt: serverTimestamp(),
    });
  }

  async function logout() {
    await signOut(auth);
  }

  async function refreshUser() {
    if (firebaseUser) await loadUserProfile(firebaseUser);
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
