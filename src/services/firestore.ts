import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  getDocs,
  updateDoc,
  deleteDoc,
  where,
  limit,
  FirestoreError,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../types/profile';
import { ClothingItem } from '../types/clothing';
import { Wardrobe, WardrobeInput } from '../types/wardrobe';
import { UserSearchResult } from '../types/social';

/*
  Firestore Security Rules:
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId} {
        // Users can read/write their own document
        allow read, write: if request.auth != null && request.auth.uid == userId;
        // Allow authenticated users to query usernames for availability checks
        allow list: if request.auth != null;
        match /wardrobe/{itemId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
        match /wardrobes/{wardrobeId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
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

// Username validation: alphanumeric + underscore, 3-20 characters
export const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Check if username is available (not taken by another user)
export const checkUsernameAvailability = async (username: string, excludeUserId?: string): Promise<boolean> => {
  try {
    if (!username || !validateUsername(username)) {
      return false;
    }

    const usersRef = collection(db, 'users');
    // Add limit(1) to match security rule requirements and optimize query
    const q = query(usersRef, where('username', '==', username), limit(1));
    const querySnapshot = await getDocs(q);

    // Check if username is taken by another user
    const isTaken = querySnapshot.docs.some((doc) => doc.id !== excludeUserId);
    return !isTaken;
  } catch (error) {
    console.error('Error checking username availability:', error);
    // On error, assume unavailable to be safe
    return false;
  }
};

// Generate username from firstName and lastName
export const generateUsernameFromName = (firstName: string, lastName: string): string => {
  const first = (firstName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const last = (lastName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (!first && !last) {
    return '';
  }
  
  // Combine first and last name
  const baseUsername = last ? `${first}${last}` : first;
  
  // Ensure minimum length
  if (baseUsername.length < 3) {
    return baseUsername.padEnd(3, '0');
  }
  
  // Ensure maximum length
  return baseUsername.substring(0, 20);
};

export const saveUserProfile = async (userId: string, profile: UserProfile, skipUsernameCheck = false): Promise<void> => {
  try {
    console.log('Saving profile for user:', userId);
    
    // Validate username if provided
    if (profile.username !== undefined && profile.username !== null && profile.username.trim() !== '') {
      const username = profile.username.trim();
      
      if (!validateUsername(username)) {
        throw new Error('Username must be 3-20 characters and contain only letters, numbers, and underscores.');
      }
      
      // Check username availability (unless we're skipping the check)
      if (!skipUsernameCheck) {
        const isAvailable = await checkUsernameAvailability(username, userId);
        if (!isAvailable) {
          throw new Error('This username is already taken. Please choose another one.');
        }
      }
    }
    
    // Filter out undefined values - Firestore doesn't accept undefined
    const cleanedProfile: Record<string, any> = {};
    Object.entries(profile).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanedProfile[key] = value;
      }
    });
    
    // Add lowercase username for case-insensitive search
    if (cleanedProfile.username) {
      cleanedProfile.usernameLower = cleanedProfile.username.toLowerCase();
    }
    
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, cleanedProfile, { merge: true });
    console.log('Profile saved successfully');
  } catch (error) {
    console.error('Error saving profile:', error);
    if (error instanceof Error) {
      throw error;
    }
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
      const profileData = userSnap.data() as UserProfile;
      console.log('Profile loaded:', profileData);
      
      // For existing users: ensure userId, usernameLower, and default privacy settings exist
      let needsUpdate = false;
      const updates: Partial<UserProfile> = {};
      
      if (!profileData.userId) {
        updates.userId = userId;
        needsUpdate = true;
      }
      
      if (!profileData.privacySettings) {
        updates.privacySettings = { allowDirectFollow: false };
        needsUpdate = true;
      }
      
      // Add usernameLower if username exists but usernameLower doesn't
      if (profileData.username && !profileData.usernameLower) {
        updates.usernameLower = profileData.username.toLowerCase();
        needsUpdate = true;
      }
      
      // Apply updates if needed
      if (needsUpdate) {
        console.log('Updating existing profile with missing fields:', updates);
        await setDoc(userRef, updates, { merge: true });
        return { ...profileData, ...updates };
      }
      
      return profileData;
    }
    
    // If no profile exists at all, create a minimal one for existing users
    console.log('No profile found for user, creating minimal profile');
    const minimalProfile: UserProfile = {
      userId: userId,
      privacySettings: {
        allowDirectFollow: false,
      },
    };
    
    await setDoc(userRef, minimalProfile);
    console.log('Minimal profile created for user:', userId);
    return minimalProfile;
  } catch (error) {
    console.error('Error loading profile:', error);
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

export const getPublicUserProfile = async (userId: string): Promise<UserSearchResult | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    const profile = userDoc.data() as UserProfile;
    
    // Return only public fields for search results
    return {
      userId,
      username: profile.username || '',
      profilePictureUrl: profile.profilePictureUrl,
      firstName: profile.firstName,
      lastName: profile.lastName,
      allowDirectFollow: profile.privacySettings?.allowDirectFollow ?? false,
    };
  } catch (error) {
    console.error('Error getting public profile:', error);
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

export const getClothingItems = async (userId: string, wardrobeId?: string): Promise<ClothingItem[]> => {
  try {
    const itemsRef = collection(db, 'users', userId, 'wardrobe');
    let q;
    
    if (wardrobeId) {
      q = query(itemsRef, where('wardrobeId', '==', wardrobeId));
    } else {
      q = query(itemsRef);
    }
    
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as ClothingItem));
    
    console.log(`[getClothingItems] Fetched ${items.length} items for wardrobeId: ${wardrobeId || 'all'}`);
    if (items.length > 0) {
      const sampleItems = items.slice(0, 3);
      console.log('[getClothingItems] Sample items wardrobeId values:', sampleItems.map(i => ({ id: i.id, wardrobeId: i.wardrobeId, category: i.category })));
    }

    return items;
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

// Wardrobe CRUD operations
export const createWardrobe = async (userId: string, input: WardrobeInput): Promise<string> => {
  try {
    // Check if wardrobe name already exists
    const existingWardrobes = await getWardrobes(userId);
    const nameExists = existingWardrobes.some(w => w.name.toLowerCase() === input.name.toLowerCase().trim());
    if (nameExists) {
      throw new Error('A wardrobe with this name already exists.');
    }

    const wardrobesRef = collection(db, 'users', userId, 'wardrobes');
    const now = new Date().toISOString();
    const wardrobeData = {
      name: input.name.trim(),
      userId, // Store owner's user ID
      isShareable: false, // Default to private
      createdAt: now,
      updatedAt: now,
    };
    const docRef = doc(wardrobesRef);
    await setDoc(docRef, wardrobeData);
    return docRef.id;
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      throw error;
    }
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

export const getWardrobes = async (userId: string): Promise<Wardrobe[]> => {
  try {
    const wardrobesRef = collection(db, 'users', userId, 'wardrobes');
    const q = query(wardrobesRef);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Wardrobe));
  } catch (error) {
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

export const updateWardrobe = async (userId: string, wardrobeId: string, input: WardrobeInput): Promise<void> => {
  try {
    // Check if wardrobe name already exists (excluding current wardrobe)
    const existingWardrobes = await getWardrobes(userId);
    const nameExists = existingWardrobes.some(
      w => w.id !== wardrobeId && w.name.toLowerCase() === input.name.toLowerCase().trim()
    );
    if (nameExists) {
      throw new Error('A wardrobe with this name already exists.');
    }

    const wardrobeRef = doc(db, 'users', userId, 'wardrobes', wardrobeId);
    await updateDoc(wardrobeRef, {
      name: input.name.trim(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      throw error;
    }
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

export const deleteWardrobe = async (userId: string, wardrobeId: string): Promise<void> => {
  try {
    const wardrobeRef = doc(db, 'users', userId, 'wardrobes', wardrobeId);
    await deleteDoc(wardrobeRef);
  } catch (error) {
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

export const updateWardrobeShareableStatus = async (
  userId: string,
  wardrobeId: string,
  isShareable: boolean
): Promise<void> => {
  try {
    const wardrobeRef = doc(db, 'users', userId, 'wardrobes', wardrobeId);
    await updateDoc(wardrobeRef, {
      isShareable,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

export const moveItemsToWardrobe = async (userId: string, fromWardrobeId: string, toWardrobeId: string): Promise<void> => {
  try {
    // Get all items from source wardrobe
    const items = await getClothingItems(userId, fromWardrobeId);
    
    if (items.length === 0) {
      return; // Nothing to move
    }

    // Use batch write for atomic operation
    const batch = writeBatch(db);
    
    items.forEach((item) => {
      const itemRef = doc(db, 'users', userId, 'wardrobe', item.id);
      batch.update(itemRef, { wardrobeId: toWardrobeId });
    });

    await batch.commit();
  } catch (error) {
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

export const deleteItemsInWardrobe = async (userId: string, wardrobeId: string): Promise<void> => {
  try {
    // Get all items from wardrobe
    const items = await getClothingItems(userId, wardrobeId);
    
    if (items.length === 0) {
      return; // Nothing to delete
    }

    // Use batch write for atomic operation
    const batch = writeBatch(db);
    
    items.forEach((item) => {
      const itemRef = doc(db, 'users', userId, 'wardrobe', item.id);
      batch.delete(itemRef);
    });

    await batch.commit();
  } catch (error) {
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};
