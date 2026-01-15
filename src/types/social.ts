/**
 * Social features type definitions
 * Handles friend relationships, requests, and user search
 */

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromProfilePictureUrl?: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface Friend {
  id: string; // Friend's user ID
  userId: string; // Friend's user ID (redundant but explicit)
  username: string;
  profilePictureUrl?: string;
  firstName?: string;
  lastName?: string;
  addedAt: string; // ISO date string
}

export interface UserSearchResult {
  userId: string;
  username: string;
  profilePictureUrl?: string;
  firstName?: string;
  lastName?: string;
  allowDirectFollow: boolean; // From privacySettings
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';
