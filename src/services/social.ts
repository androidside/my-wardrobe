/**
 * Social Service
 * Handles friend relationships, requests, and social interactions
 */

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
  FirestoreError,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Friend, FriendRequest, UserSearchResult } from '../types/social';
import { Wardrobe } from '../types/wardrobe';
import { ClothingItem } from '../types/clothing';
import { getPublicUserProfile } from './firestore';

const getFirestoreErrorMessage = (error: FirestoreError): string => {
  switch (error.code) {
    case 'permission-denied':
      return 'You do not have permission to perform this action.';
    case 'not-found':
      return 'User or data not found.';
    case 'already-exists':
      return 'This relationship already exists.';
    default:
      return error.message || 'An error occurred.';
  }
};

/**
 * Search for users by username (partial or exact match)
 */
export const searchUsersByUsername = async (searchTerm: string): Promise<UserSearchResult[]> => {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return [];
    }

    const usersRef = collection(db, 'users');
    const searchLower = searchTerm.toLowerCase().trim();
    
    // Query for usernames that match the search term (using usernameLower for case-insensitive search)
    const q = query(
      usersRef,
      where('usernameLower', '>=', searchLower),
      where('usernameLower', '<=', searchLower + '\uf8ff'),
      limit(20)
    );
    
    const querySnapshot = await getDocs(q);
    const results: UserSearchResult[] = [];
    
    for (const docSnap of querySnapshot.docs) {
      const profile = await getPublicUserProfile(docSnap.id);
      if (profile && profile.username) {
        results.push(profile);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error searching users:', error);
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

/**
 * Send a friend request to another user
 */
export const sendFriendRequest = async (
  fromUserId: string,
  toUserId: string
): Promise<string> => {
  try {
    // Prevent self-friending
    if (fromUserId === toUserId) {
      throw new Error('You cannot send a friend request to yourself.');
    }

    // Check if already friends
    const existingFriendRef = doc(db, 'users', fromUserId, 'friends', toUserId);
    const existingFriend = await getDoc(existingFriendRef);
    if (existingFriend.exists()) {
      throw new Error('You are already friends with this user.');
    }

    // Check if request already exists (and is still pending)
    const existingRequestRef = doc(db, 'users', toUserId, 'friendRequests', fromUserId);
    const existingRequest = await getDoc(existingRequestRef);
    if (existingRequest.exists()) {
      const existingData = existingRequest.data() as FriendRequest;
      // Only block if status is pending
      if (existingData.status === 'pending') {
        throw new Error('Friend request already sent.');
      }
      // If rejected or accepted, we'll overwrite it (no need to delete first)
    }

    // Get sender's public profile for the request
    const fromProfile = await getPublicUserProfile(fromUserId);
    if (!fromProfile) {
      throw new Error('Your profile could not be found.');
    }

    const now = new Date().toISOString();
    const requestData: Omit<FriendRequest, 'id'> = {
      fromUserId,
      fromUsername: fromProfile.username,
      fromProfilePictureUrl: fromProfile.profilePictureUrl,
      toUserId,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    // Add to recipient's incoming requests
    await setDoc(existingRequestRef, requestData);

    // Add to sender's sent requests
    const sentRequestRef = doc(db, 'users', fromUserId, 'sentRequests', toUserId);
    await setDoc(sentRequestRef, requestData);

    return existingRequestRef.id;
  } catch (error) {
    console.error('Error sending friend request:', error);
    if (error instanceof Error) {
      throw error;
    }
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (
  userId: string,
  requestId: string
): Promise<void> => {
  try {
    // Get the friend request
    const requestRef = doc(db, 'users', userId, 'friendRequests', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      throw new Error('Friend request not found.');
    }

    const request = requestSnap.data() as FriendRequest;
    const friendUserId = request.fromUserId;

    // Get friend's public profile
    const friendProfile = await getPublicUserProfile(friendUserId);
    const myProfile = await getPublicUserProfile(userId);

    if (!friendProfile || !myProfile) {
      throw new Error('User profiles not found.');
    }

    const now = new Date().toISOString();

    // Helper function to clean undefined values
    const cleanData = (data: Record<string, any>): Record<string, any> => {
      const cleaned: Record<string, any> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          cleaned[key] = value;
        }
      });
      return cleaned;
    };

    // Add to both users' friends lists
    const friendData: Omit<Friend, 'id'> = {
      userId: friendUserId,
      username: friendProfile.username,
      profilePictureUrl: friendProfile.profilePictureUrl,
      firstName: friendProfile.firstName,
      lastName: friendProfile.lastName,
      addedAt: now,
    };

    const myData: Omit<Friend, 'id'> = {
      userId,
      username: myProfile.username,
      profilePictureUrl: myProfile.profilePictureUrl,
      firstName: myProfile.firstName,
      lastName: myProfile.lastName,
      addedAt: now,
    };

    // Add to my friends (clean undefined values)
    await setDoc(doc(db, 'users', userId, 'friends', friendUserId), cleanData(friendData));
    // Add to their friends (clean undefined values)
    await setDoc(doc(db, 'users', friendUserId, 'friends', userId), cleanData(myData));

    // Delete the friend request (no need to update status first)
    await deleteDoc(requestRef);

    // Delete the sent request
    const sentRequestRef = doc(db, 'users', friendUserId, 'sentRequests', userId);
    const sentRequestSnap = await getDoc(sentRequestRef);
    if (sentRequestSnap.exists()) {
      await deleteDoc(sentRequestRef);
    }
  } catch (error) {
    console.error('Error accepting friend request:', error);
    if (error instanceof Error) {
      throw error;
    }
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

/**
 * Reject a friend request
 */
export const rejectFriendRequest = async (
  userId: string,
  requestId: string
): Promise<void> => {
  try {
    const requestRef = doc(db, 'users', userId, 'friendRequests', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      throw new Error('Friend request not found.');
    }

    const request = requestSnap.data() as FriendRequest;

    // Delete the friend request (instead of just updating status)
    await deleteDoc(requestRef);

    // Delete the sent request
    const sentRequestRef = doc(db, 'users', request.fromUserId, 'sentRequests', userId);
    const sentRequestSnap = await getDoc(sentRequestRef);
    if (sentRequestSnap.exists()) {
      await deleteDoc(sentRequestRef);
    }

    // Delete the request after rejection
    await deleteDoc(requestRef);
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    if (error instanceof Error) {
      throw error;
    }
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

/**
 * Follow a user directly (for users who allow direct follow)
 */
export const followUserDirectly = async (
  userId: string,
  targetUserId: string
): Promise<void> => {
  try {
    // Prevent self-following
    if (userId === targetUserId) {
      throw new Error('You cannot follow yourself.');
    }

    // Check if already friends
    const existingFriendRef = doc(db, 'users', userId, 'friends', targetUserId);
    const existingFriend = await getDoc(existingFriendRef);
    if (existingFriend.exists()) {
      throw new Error('You are already friends with this user.');
    }

    // Verify target user allows direct follow
    const targetProfile = await getPublicUserProfile(targetUserId);
    if (!targetProfile || !targetProfile.allowDirectFollow) {
      throw new Error('This user requires a friend request.');
    }

    const myProfile = await getPublicUserProfile(userId);
    if (!myProfile) {
      throw new Error('Your profile could not be found.');
    }

    const now = new Date().toISOString();

    // Helper function to clean undefined values
    const cleanData = (data: Record<string, any>): Record<string, any> => {
      const cleaned: Record<string, any> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          cleaned[key] = value;
        }
      });
      return cleaned;
    };

    // Add to both users' friends lists
    const targetFriendData: Omit<Friend, 'id'> = {
      userId: targetUserId,
      username: targetProfile.username,
      profilePictureUrl: targetProfile.profilePictureUrl,
      firstName: targetProfile.firstName,
      lastName: targetProfile.lastName,
      addedAt: now,
    };

    const myFriendData: Omit<Friend, 'id'> = {
      userId,
      username: myProfile.username,
      profilePictureUrl: myProfile.profilePictureUrl,
      firstName: myProfile.firstName,
      lastName: myProfile.lastName,
      addedAt: now,
    };

    // Add to my friends (clean undefined values)
    await setDoc(doc(db, 'users', userId, 'friends', targetUserId), cleanData(targetFriendData));
    // Add to their friends (clean undefined values)
    await setDoc(doc(db, 'users', targetUserId, 'friends', userId), cleanData(myFriendData));
  } catch (error) {
    console.error('Error following user:', error);
    if (error instanceof Error) {
      throw error;
    }
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

/**
 * Unfollow/unfriend a user
 */
export const unfollowUser = async (userId: string, friendId: string): Promise<void> => {
  try {
    // Remove from both users' friends lists
    const myFriendRef = doc(db, 'users', userId, 'friends', friendId);
    const theirFriendRef = doc(db, 'users', friendId, 'friends', userId);

    await deleteDoc(myFriendRef);
    await deleteDoc(theirFriendRef);
  } catch (error) {
    console.error('Error unfollowing user:', error);
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

/**
 * Get user's friends list
 */
export const getFriends = async (userId: string): Promise<Friend[]> => {
  try {
    const friendsRef = collection(db, 'users', userId, 'friends');
    const q = query(friendsRef, orderBy('addedAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Friend));
  } catch (error) {
    console.error('Error getting friends:', error);
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

/**
 * Get incoming friend requests
 */
export const getIncomingFriendRequests = async (userId: string): Promise<FriendRequest[]> => {
  try {
    const requestsRef = collection(db, 'users', userId, 'friendRequests');
    const q = query(requestsRef, where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as FriendRequest));
  } catch (error) {
    console.error('Error getting incoming friend requests:', error);
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

/**
 * Get sent friend requests
 */
export const getSentFriendRequests = async (userId: string): Promise<FriendRequest[]> => {
  try {
    const requestsRef = collection(db, 'users', userId, 'sentRequests');
    const q = query(requestsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as FriendRequest));
  } catch (error) {
    console.error('Error getting sent friend requests:', error);
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

/**
 * Get a friend's shareable wardrobes
 */
export const getFriendWardrobes = async (friendId: string): Promise<Wardrobe[]> => {
  try {
    const wardrobesRef = collection(db, 'users', friendId, 'wardrobes');
    const q = query(wardrobesRef, where('isShareable', '==', true));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Wardrobe));
  } catch (error) {
    console.error('Error getting friend wardrobes:', error);
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};

/**
 * Get clothing items from a friend's shareable wardrobe
 */
export const getFriendClothingItems = async (
  friendId: string,
  wardrobeId: string
): Promise<ClothingItem[]> => {
  try {
    // First verify the wardrobe is shareable
    const wardrobeRef = doc(db, 'users', friendId, 'wardrobes', wardrobeId);
    const wardrobeSnap = await getDoc(wardrobeRef);

    if (!wardrobeSnap.exists()) {
      throw new Error('Wardrobe not found.');
    }

    const wardrobe = wardrobeSnap.data() as Wardrobe;
    if (!wardrobe.isShareable) {
      throw new Error('This wardrobe is not shared.');
    }

    // Get items from the wardrobe
    const itemsRef = collection(db, 'users', friendId, 'wardrobe');
    const q = query(itemsRef, where('wardrobeId', '==', wardrobeId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as ClothingItem));
  } catch (error) {
    console.error('Error getting friend clothing items:', error);
    if (error instanceof Error) {
      throw error;
    }
    const firestoreError = error as FirestoreError;
    throw new Error(getFirestoreErrorMessage(firestoreError));
  }
};
