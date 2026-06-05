import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy, where, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const PAGE_SIZE = 50;

export const useTransactions = (userId) => {
const [transactions, setTransactions] = useState([]);
const [loading, setLoading] = useState(true);
const [lastDoc, setLastDoc] = useState(null);
const [hasMore, setHasMore] = useState(false);
const [firestoreError, setFirestoreError] = useState(null);

useEffect(() => {
if (!userId) return;
const q = query(
  collection(db, 'transactions'),
  where('userId', '==', userId),
  orderBy('date', 'desc'),
  limit(PAGE_SIZE)
);
const unsub = onSnapshot(q, (snap) => {
  setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  setLastDoc(snap.docs[snap.docs.length - 1] || null);
  setHasMore(snap.docs.length === PAGE_SIZE);
  setLoading(false);
});
return unsub;
}, [userId]);

const loadMore = async () => {
if (!lastDoc || !hasMore) return;
const q = query(
  collection(db, 'transactions'),
  where('userId', '==', userId),
  orderBy('date', 'desc'),
  startAfter(lastDoc),
  limit(PAGE_SIZE)
);
const snap = await getDocs(q);
const more = snap.docs.map(d => ({ id: d.id, ...d.data() }));
setTransactions(prev => [...prev, ...more]);
setLastDoc(snap.docs[snap.docs.length - 1] || null);
setHasMore(snap.docs.length === PAGE_SIZE);
};

const addTransaction = async (desc, amount, category, type, date) => {
try {
  await addDoc(collection(db, 'transactions'), { desc, amount, category, type, userId, date: date || new Date().toISOString() });
} catch (e) {
  setFirestoreError('add');
}
};

const editTransaction = async (id, desc, amount, category, type) => {
try {
  await updateDoc(doc(db, 'transactions', id), { desc, amount, category, type });
} catch (e) {
  setFirestoreError('edit');
}
};

const deleteTransaction = async (id) => {
try {
  await deleteDoc(doc(db, 'transactions', id));
} catch (e) {
  setFirestoreError('delete');
}
};

return { transactions, loading, hasMore, loadMore, addTransaction, editTransaction, deleteTransaction, firestoreError, clearFirestoreError: () => setFirestoreError(null) };
};

export const useReminders = (userId) => {
const [reminders, setReminders] = useState([]);

useEffect(() => {
if (!userId) return;
const q = query(collection(db, 'reminders'), where('userId', '==', userId), orderBy('due', 'asc'));
const unsub = onSnapshot(q, (snap) => {
setReminders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
});
return unsub;
}, [userId]);

const addReminder = async (name, due, amount) => {
await addDoc(collection(db, 'reminders'), { name, due, amount: amount || 0, userId });
};

const deleteReminder = async (id) => await deleteDoc(doc(db, 'reminders', id));

return { reminders, addReminder, deleteReminder };
};