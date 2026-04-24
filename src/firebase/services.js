// Firestore CRUD services for all collections
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, orderBy, where, onSnapshot, setDoc, writeBatch, serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

// ==================== NEEDS ====================

export async function getNeeds() {
  const snapshot = await getDocs(collection(db, 'needs'));
  return snapshot.docs.map(d => ({ ...d.data(), _docId: d.id }));
}

export function subscribeToNeeds(callback) {
  return onSnapshot(collection(db, 'needs'), (snapshot) => {
    const data = snapshot.docs.map(d => ({ ...d.data(), _docId: d.id }));
    callback(data);
  });
}

export async function addNeed(data) {
  const docRef = await addDoc(collection(db, 'needs'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateNeed(docId, data) {
  await updateDoc(doc(db, 'needs', docId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNeed(docId) {
  await deleteDoc(doc(db, 'needs', docId));
}

// ==================== VOLUNTEERS ====================

export async function getVolunteers() {
  const snapshot = await getDocs(collection(db, 'volunteers'));
  return snapshot.docs.map(d => ({ ...d.data(), _docId: d.id }));
}

export function subscribeToVolunteers(callback) {
  return onSnapshot(collection(db, 'volunteers'), (snapshot) => {
    const data = snapshot.docs.map(d => ({ ...d.data(), _docId: d.id }));
    callback(data);
  });
}

export async function updateVolunteer(docId, data) {
  await updateDoc(doc(db, 'volunteers', docId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ==================== TASKS ====================

export async function getTasks() {
  const snapshot = await getDocs(collection(db, 'tasks'));
  return snapshot.docs.map(d => ({ ...d.data(), _docId: d.id }));
}

export function subscribeToTasks(callback) {
  return onSnapshot(collection(db, 'tasks'), (snapshot) => {
    const data = snapshot.docs.map(d => ({ ...d.data(), _docId: d.id }));
    callback(data);
  });
}

export async function addTask(data) {
  const docRef = await addDoc(collection(db, 'tasks'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTask(docId, data) {
  await updateDoc(doc(db, 'tasks', docId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ==================== ANALYTICS ====================

export async function getAnalytics() {
  const docSnap = await getDoc(doc(db, 'analytics', 'summary'));
  return docSnap.exists() ? docSnap.data() : null;
}

// ==================== USERS ====================

export async function createUserProfile(uid, data) {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    createdAt: serverTimestamp(),
  }, { merge: true });
}

export async function getUserProfile(uid) {
  const docSnap = await getDoc(doc(db, 'users', uid));
  return docSnap.exists() ? docSnap.data() : null;
}

// ==================== CHECK IF SEEDED ====================

export async function isDatabaseSeeded() {
  const snapshot = await getDocs(collection(db, 'needs'));
  return snapshot.size > 0;
}

// ==================== VOLUNTEER-SPECIFIC ====================

export function subscribeToTasksByVolunteer(volunteerId, callback) {
  const q = query(collection(db, 'tasks'), where('volunteerId', '==', volunteerId));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ ...d.data(), _docId: d.id }));
    callback(data);
  });
}

export async function selfAssignTask(volunteerId, need) {
  const taskData = {
    id: `T-${Date.now().toString(36).toUpperCase()}`,
    needId: need.id,
    volunteerId,
    status: 'Assigned',
    assignedAt: new Date().toISOString(),
    completedAt: null,
    hoursLogged: 0,
    notes: '',
  };
  const docRef = await addDoc(collection(db, 'tasks'), {
    ...taskData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  // Update need status
  if (need._docId) {
    await updateDoc(doc(db, 'needs', need._docId), {
      status: 'Assigned',
      updatedAt: serverTimestamp(),
    });
  }
  return docRef.id;
}

/**
 * Mark a task as completed AND update the linked need's status.
 * This ensures the coordinator's view (Dashboard, NeedsPage, Kanban) all reflect the change.
 *
 * @param {string} taskDocId - Firestore document ID of the task
 * @param {number} hoursLogged - Hours the volunteer spent
 * @param {string|null} needDocId - Firestore document ID of the linked need (optional)
 */
export async function completeTask(taskDocId, hoursLogged = 0, needDocId = null) {
  // Update the task status to Completed
  await updateDoc(doc(db, 'tasks', taskDocId), {
    status: 'Completed',
    completedAt: new Date().toISOString(),
    hoursLogged,
    updatedAt: serverTimestamp(),
  });

  // Also update the linked need's status so coordinator view stays in sync
  if (needDocId) {
    await updateDoc(doc(db, 'needs', needDocId), {
      status: 'Completed',
      updatedAt: serverTimestamp(),
    });
  }
}

export async function acceptTask(taskDocId) {
  await updateDoc(doc(db, 'tasks', taskDocId), {
    status: 'In Progress',
    updatedAt: serverTimestamp(),
  });
}

export async function declineTask(taskDocId) {
  await updateDoc(doc(db, 'tasks', taskDocId), {
    status: 'Open',
    volunteerId: '',
    updatedAt: serverTimestamp(),
  });
}

export async function updateVolunteerProfile(docId, data) {
  await updateDoc(doc(db, 'volunteers', docId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function addVolunteerFromSignup(data) {
  const docRef = await addDoc(collection(db, 'volunteers'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getVolunteerByUserId(uid) {
  const q = query(collection(db, 'volunteers'), where('uid', '==', uid));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { ...d.data(), _docId: d.id };
}
