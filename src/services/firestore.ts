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
        match /wardrobe/{itemId} {
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
    console.log('Saving profile for user:', userId);
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, profile, { merge: true });
    console.log('Profile saved successfully');
  } catch (error) {
    console.error('Error saving profile:', error);
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    console.log('Loading profile for user:', userId);
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      console.log('Profile loaded:', userSnap.data());
      return userSnap.data() as UserProfile;
    }
    console.log('No profile found for user');
    return null;
  } catch (error) {
    console.error('Error loading profile:', error);
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

export const saveClothingItem = async (userId: string, item: Omit<ClothingItem, 'id'>): Promise<string> => {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized. Check your Firebase configuration.');
    }

    const itemsRef = collection(db, 'users', userId, 'wardrobe');
    // Filter out undefined values (Firestore doesn't accept undefined)
    const newItem = Object.fromEntries(
      Object.entries(item).filter(([_, value]) => value !== undefined)
    );
    const docRef = doc(itemsRef);
    
    console.log('Saving clothing item to Firestore:', { userId, path: `users/${userId}/wardrobe`, item: newItem });
    
    await setDoc(docRef, newItem);
    
    console.log('Item saved successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving clothing item to Firestore:', error);
    const firestoreError = error as FirestoreError;
    console.error('Firestore error details:', {
      code: firestoreError.code,
      message: firestoreError.message,
    });
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

export const getClothingItems = async (userId: string): Promise<ClothingItem[]> => {
  try {
    const itemsRef = collection(db, 'users', userId, 'wardrobe');
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
    const itemRef = doc(db, 'users', userId, 'wardrobe', itemId);
    // Filter out undefined values (Firestore doesn't accept undefined)
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    await updateDoc(itemRef, {
      ...cleanUpdates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

export const deleteClothingItem = async (userId: string, itemId: string): Promise<void> => {
  try {
    const itemRef = doc(db, 'users', userId, 'wardrobe', itemId);
    await deleteDoc(itemRef);
  } catch (error) {
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};
