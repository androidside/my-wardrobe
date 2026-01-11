# Social Media Features - Friends & Public Wardrobes

## Overview
Add social media functionality to allow users to create usernames, manage friends (with approval or direct follow), and share wardrobes with friends. Items are private by default, and only items in shareable wardrobes are visible to friends.

## Data Model Changes

### 1. Update UserProfile Type
**File**: `src/types/profile.ts`
- Add `username?: string` - unique identifier for social features
- Add `privacySettings?: { allowDirectFollow: boolean }` - controls if users can be followed directly or require approval

### 2. Update Wardrobe Type
**File**: `src/types/wardrobe.ts`
- Add `isShareable?: boolean` - marks wardrobe as shareable with friends (default: false)
- Add `updatedAt` field update tracking when shareable status changes

### 3. New Friend System Types
**File**: `src/types/social.ts` (new file)
- `FriendRequest` interface: `id`, `fromUserId`, `toUserId`, `status` ('pending' | 'accepted' | 'rejected'), `createdAt`, `updatedAt`
- `Friend` interface: `id`, `userId`, `username`, `profilePictureUrl`, `addedAt`
- `UserSearchResult` interface: `userId`, `username`, `profilePictureUrl`, `firstName`, `lastName`, `allowDirectFollow`

## Firestore Structure Changes

### Collections
1. `users/{userId}/profile` - Add `username` and `privacySettings`
2. `users/{userId}/wardrobes/{wardrobeId}` - Add `isShareable` field
3. `users/{userId}/friends/{friendId}` - Friend relationships (subcollection)
4. `users/{userId}/friendRequests/{requestId}` - Incoming friend requests (subcollection)
5. `users/{userId}/sentRequests/{requestId}` - Outgoing friend requests (subcollection)

### Security Rules
**File**: `FIRESTORE_RULES.md` (update documentation)
- Users can read their own friends and friend requests
- Users can create friend requests to other users
- Users can read public user profiles (username, profilePictureUrl, allowDirectFollow)
- Users can read shareable wardrobes and items from friends
- Users can only update their own friend requests

## Service Layer Updates

### 1. Social Service
**File**: `src/services/social.ts` (new file)
Functions:
- `searchUsersByUsername(username: string): Promise<UserSearchResult[]>`
- `sendFriendRequest(fromUserId: string, toUserId: string): Promise<string>`
- `acceptFriendRequest(userId: string, requestId: string): Promise<void>`
- `rejectFriendRequest(userId: string, requestId: string): Promise<void>`
- `followUserDirectly(userId: string, targetUserId: string): Promise<void>`
- `unfollowUser(userId: string, friendId: string): Promise<void>`
- `getFriends(userId: string): Promise<Friend[]>`
- `getFriendRequests(userId: string): Promise<FriendRequest[]>`
- `getSentRequests(userId: string): Promise<FriendRequest[]>`
- `getFriendWardrobes(friendId: string): Promise<Wardrobe[]>` - only returns shareable wardrobes
- `getFriendClothingItems(friendId: string, wardrobeId: string): Promise<ClothingItem[]>` - only for shareable wardrobes

### 2. Update Firestore Service
**File**: `src/services/firestore.ts`
- Add username uniqueness check in `saveUserProfile`
- Add `updateWardrobeShareableStatus(userId: string, wardrobeId: string, isShareable: boolean): Promise<void>`
- Add `getPublicUserProfile(userId: string): Promise<Partial<UserProfile>>` - returns only public fields
- Add `checkUsernameAvailability(username: string): Promise<boolean>` - searches all users

### 3. Update User Profile Service
**File**: `src/services/firestore.ts`
- Update `saveUserProfile` to validate username uniqueness and format
- Add username validation: alphanumeric + underscores, 3-20 characters

## UI Components

### 1. Username Setup in Profile
**File**: `src/components/MyProfile.tsx`
- Add username input field with validation
- Show username availability check (real-time)
- Display privacy setting toggle: "Allow users to follow me directly" (default: false)
- Save username and privacy settings to profile

### 2. Social/Friends Section
**File**: `src/components/MyProfile.tsx` or `src/components/SocialSection.tsx` (new)
- Add "Social" tab/section to MyProfile
- Display current friends list
- Display pending friend requests (incoming and outgoing)
- Add "Add Friend" button to search and add friends

### 3. Friend Search Dialog
**File**: `src/components/FriendSearchDialog.tsx` (new)
- Search bar for username
- Display search results with user info
- Show "Follow" button if `allowDirectFollow` is true
- Show "Send Request" button if `allowDirectFollow` is false
- Handle friend request sending and direct following

### 4. Friend Requests Dialog
**File**: `src/components/FriendRequestsDialog.tsx` (new)
- Display incoming friend requests
- Accept/Reject buttons for each request
- Display outgoing requests with status (pending/accepted/rejected)

### 5. Friends Wardrobe View
**File**: `src/components/FriendWardrobeView.tsx` (new)
- Display list of friends
- Click friend to see their shareable wardrobes
- View items in friend's shareable wardrobes
- Similar UI to `WardrobeGallery` but read-only

### 6. Wardrobe Shareable Toggle
**File**: `src/components/EditWardrobeDialog.tsx`
- Add toggle switch: "Share with friends"
- Update wardrobe `isShareable` field when toggled

### 7. Navigation Update
**File**: `src/App.tsx` or `src/components/BottomNavigation.tsx`
- Add "Social" or "Friends" page option
- Update navigation to include friends view

## Data Migration

### Migration Script
**File**: `src/utils/socialMigration.ts` (new, optional)
- Set `isShareable: false` for all existing wardrobes
- Set `allowDirectFollow: false` for all existing users (default privacy)

## Implementation Steps

1. **Update type definitions** (`types/profile.ts`, `types/wardrobe.ts`, create `types/social.ts`)
2. **Create social service** (`services/social.ts`) with all friend operations
3. **Update Firestore service** with username validation and wardrobe shareable toggle
4. **Add username field to profile UI** (`MyProfile.tsx`)
5. **Create friend search component** (`FriendSearchDialog.tsx`)
6. **Create friend requests component** (`FriendRequestsDialog.tsx`)
7. **Add social section to profile** (`MyProfile.tsx`)
8. **Create friends wardrobe view** (`FriendWardrobeView.tsx`)
9. **Add shareable toggle to wardrobe edit** (`EditWardrobeDialog.tsx`)
10. **Update Firestore security rules** (update `FIRESTORE_RULES.md`)
11. **Update navigation** to include social/friends page
12. **Test friend requests, direct follow, and wardrobe sharing flows**

## Security Considerations

- Username validation: alphanumeric + underscore only, 3-20 chars, unique
- Friend requests can only be accepted/rejected by recipient
- Users can only see shareable wardrobes from friends
- Privacy settings prevent unwanted follows
- All friend operations require authentication

## User Flow

1. User sets username in profile (one-time setup)
2. User can search for other users by username
3. If target user allows direct follow → immediate friendship
4. If target user requires approval → send friend request → wait for acceptance
5. Once friends, user can see friend's shareable wardrobes
6. Friend can browse items in shareable wardrobes (read-only)
7. Users can mark any wardrobe as shareable from wardrobe edit dialog
