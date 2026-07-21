import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { cancelReminderNotification } from './notifications';

const deleteByUserId = async (colName, uid) => {
  const snap = await getDocs(query(collection(db, colName), where('userId', '==', uid)));
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
};

const deleteSubcollection = async (path) => {
  const snap = await getDocs(collection(db, path));
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
};

// Borra todos los datos del usuario en Firestore y, por último, la cuenta de Firebase Auth.
// Si Firebase pide una sesión reciente (auth/requires-recent-login), los datos de Firestore
// ya quedaron borrados igual — solo falta reintentar después de volver a iniciar sesión.
export const deleteAccountAndData = async (uid) => {
  const remindersSnap = await getDocs(query(collection(db, 'reminders'), where('userId', '==', uid)));
  await Promise.all(remindersSnap.docs.map(async (d) => {
    const notificationId = d.data()?.notificationId;
    if (notificationId) await cancelReminderNotification(notificationId);
    await deleteDoc(d.ref);
  }));

  await deleteByUserId('transactions', uid);
  await deleteSubcollection(`savings/${uid}/goals`);
  await deleteSubcollection(`categories/${uid}/items`);

  await Promise.all([
    deleteDoc(doc(db, 'budgets', uid)),
    deleteDoc(doc(db, 'savings', uid)),
    deleteDoc(doc(db, 'budgetAlerts', uid)),
    deleteDoc(doc(db, 'users', uid)),
  ]);

  if (auth.currentUser) {
    await deleteUser(auth.currentUser);
  }
};
