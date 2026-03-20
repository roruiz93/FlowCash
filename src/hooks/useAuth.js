import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return unsub;
  }, []);

  const register = async (email, password) => await createUserWithEmailAndPassword(auth, email, password);
  const login = async (email, password) => await signInWithEmailAndPassword(auth, email, password);
  const logout = async () => await signOut(auth);

  return { user, loading, register, login, logout };
};
