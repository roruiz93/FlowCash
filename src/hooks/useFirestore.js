import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useTransactions = (userId) => {
const [transactions, setTransactions] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
if (!userId) return;
const q = query(collection(db, 'transactions'), where('userId', '==', userId), orderBy('date', 'desc'));
const unsub = onSnapshot(q, (snap) => {
setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
setLoading(false);
});
return unsub;
}, [userId]);

const addTransaction = async (desc, amount, category, type) => {
await addDoc(collection(db, 'transactions'), { desc, amount, category, type, userId, date: new Date().toISOString() });
};

const editTransaction = async (id, desc, amount, category, type) => {
await updateDoc(doc(db, 'transactions', id), { desc, amount, category, type });
};

const deleteTransaction = async (id) => await deleteDoc(doc(db, 'transactions', id));

return { transactions, loading, addTransaction, editTransaction, deleteTransaction };
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