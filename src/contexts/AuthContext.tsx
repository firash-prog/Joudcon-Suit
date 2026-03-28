import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  dbUser: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  loginWithCredentials: (u: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch or create user in Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setDbUser(userSnap.data() as User);
        } else {
          // Check if admin
          const isAdmin = firebaseUser.email === 'firash@eliteproeventsksa.com' || firebaseUser.email === 'admin@joudcon.com' || firebaseUser.email === 'bossjoudcon@joudcon.com';
          const emailPrefix = firebaseUser.email?.split('@')[0] || 'Unknown User';
          const displayName = firebaseUser.displayName || emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
          
          const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: displayName,
            role: isAdmin ? 'admin' : 'user',
          };
          await setDoc(userRef, newUser);
          setDbUser(newUser);
        }
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginWithCredentials = async (u: string, p: string) => {
    const allowedUsers: Record<string, { email: string, pass: string, role: string, displayName: string }> = {
      'Bossjoudcon': { email: 'bossjoudcon@joudcon.com', pass: 'admin1243', role: 'admin', displayName: 'Boss Joudcon' },
      'shamla': { email: 'shamla@joudcon.com', pass: 'joud123', role: 'user', displayName: 'Shamla' },
      'ijash': { email: 'ijash@joudcon.com', pass: 'joud123', role: 'user', displayName: 'Ijash' },
      'lujain': { email: 'lujain@joudcon.com', pass: 'joud123', role: 'user', displayName: 'Lujain' },
      'bushara': { email: 'bushara@joudcon.com', pass: 'joud123', role: 'user', displayName: 'Bushara' },
    };

    const userConfig = allowedUsers[u];
    if (userConfig && p === userConfig.pass) {
      try {
        await signInWithEmailAndPassword(auth, userConfig.email, p);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
          const userCredential = await createUserWithEmailAndPassword(auth, userConfig.email, p);
          const userRef = doc(db, 'users', userCredential.user.uid);
          await setDoc(userRef, {
            uid: userCredential.user.uid,
            email: userConfig.email,
            displayName: userConfig.displayName,
            role: userConfig.role
          });
        } else {
          throw error;
        }
      }
    } else {
      throw new Error("Invalid credentials");
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, signIn, loginWithCredentials, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
