import { doc, getDoc, setDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

// Chequea, una sola vez por usuario, si ya tenía datos guardados en Budget/Savings/Reminders
// antes de que existiera el sistema freemium — esos usuarios conservan acceso gratis a esas pantallas.
export const computeLegacyFreeAccess = async (uid) => {
  const [budgetSnap, savingsSnap, reminderSnap] = await Promise.all([
    getDoc(doc(db, 'budgets', uid)),
    getDoc(doc(db, 'savings', uid)),
    getDocs(query(collection(db, 'reminders'), where('userId', '==', uid), limit(1))),
  ]);

  return {
    budget: budgetSnap.exists(),
    savings: savingsSnap.exists() && (savingsSnap.data()?.monthlyGoal || 0) > 0,
    reminders: !reminderSnap.empty,
  };
};

// Calcula y persiste legacyFreeAccess en users/{uid}, solo si todavía no se calculó.
export const computeAndSaveLegacyFreeAccess = async (uid) => {
  const legacyFreeAccess = await computeLegacyFreeAccess(uid);
  await setDoc(doc(db, 'users', uid), {
    legacyFreeAccess,
    legacyComputedAt: new Date().toISOString(),
  }, { merge: true });
  return legacyFreeAccess;
};
