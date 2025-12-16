import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  getDocs,
  updateDoc,
  deleteDoc,
  FirestoreError,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../types/profile';
import { ClothingItem } from '../types/clothing';

/*
  Firestore Security Rules:
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId} {
        allow read, write: if request.auth.uid == userId;
        match /wardrobes/{document=**} {
          allow read, write: if request.auth.uid == userId;
        }
      }
    }
  }
*/

const getFirestoreErrorMessage = (error: FirestoreError): string => {
  switch (error.code) {
    case 'permission-denied':
      return 'You do not have permission to access this data.';
    case 'not-found':
      return 'Data not found.';
    case 'already-exists':
      return 'This item already exists.';
    case 'failed-precondition':
      return 'Operation failed due to missing data.';
    case 'unavailable':
      return 'Service temporarily unavailable. Please try again.';
    default:
      return error.message || 'An error occurred with the database.';
  }
};

export const saveUserProfile = async (userId: string, profile: UserProfile): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, profile, { merge: true });
  } catch (error) {
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

export const saveClothingItem = async (userId: string, item: Omit<ClothingItem, 'id'>): Promise<string> => {
  try {
    const itemsRef = collection(db, 'users', userId, 'wardrobes', 'items', 'list');
    const newItem = {
      ...item,
    };
    const docRef = doc(itemsRef);
    await setDoc(docRef, newItem);
    return docRef.id;
  } catch (error) {
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

export const getClothingItems = async (userId: string): Promise<ClothingItem[]> => {
  try {
    const itemsRef = collection(db, 'users', userId, 'wardrobes', 'items', 'list');
    const q = query(itemsRef);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as ClothingItem));
  } catch (error) {
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

export const updateClothingItem = async (userId: string, itemId: string, updates: Partial<ClothingItem>): Promise<void> => {
  try {
    const itemRef = doc(db, 'users', userId, 'wardrobes', 'items', 'list', itemId);
    await updateDoc(itemRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

export const deleteClothingItem = async (userId: string, itemId: string): Promise<void> => {
  try {
    const itemRef = doc(db, 'users', userId, 'wardrobes', 'items', 'list', itemId);
    await deleteDoc(itemRef);
  } catch (error) {
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};
