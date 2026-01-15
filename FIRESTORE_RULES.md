# Firestore Security Rules

To fix the permission error when creating wardrobes, you need to update your Firestore security rules in the Firebase Console.

## Steps to Update Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Replace the existing rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if two users are friends
    function areFriends(userId1, userId2) {
      return exists(/databases/$(database)/documents/users/$(userId1)/friends/$(userId2));
    }
    
    match /users/{userId} {
      // Users can read/write their own document
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow authenticated users to query usernames for availability checks
      // This is needed for username uniqueness validation
      allow list: if request.auth != null;
      
      // Legacy wardrobe collection (singular)
      match /wardrobe/{itemId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Wardrobes collection
      match /wardrobes/{wardrobeId} {
        // Users can read/write their own wardrobes
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        // Friends can read shareable wardrobes
        allow get: if request.auth != null 
          && areFriends(userId, request.auth.uid)
          && resource.data.isShareable == true;
        
        // Friends can list shareable wardrobes
        allow list: if request.auth != null 
          && areFriends(userId, request.auth.uid);
        
        // Clothing items within wardrobes
        match /items/{itemId} {
          // Users can read/write their own items
          allow read, write: if request.auth != null && request.auth.uid == userId;
          
          // Friends can read items in shareable wardrobes
          allow get: if request.auth != null 
            && areFriends(userId, request.auth.uid)
            && get(/databases/$(database)/documents/users/$(userId)/wardrobes/$(wardrobeId)).data.isShareable == true;
          
          // Friends can list items in shareable wardrobes
          allow list: if request.auth != null 
            && areFriends(userId, request.auth.uid)
            && get(/databases/$(database)/documents/users/$(userId)/wardrobes/$(wardrobeId)).data.isShareable == true;
        }
      }
      
      // Friends collection
      match /friends/{friendId} {
        // Users can read/write their own friends
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Friend requests collection
      match /friendRequests/{requestId} {
        // Users can read their own sent and received requests
        allow read: if request.auth != null 
          && (request.auth.uid == userId 
            || request.auth.uid == resource.data.fromUserId
            || request.auth.uid == resource.data.toUserId);
        
        // Users can create requests from themselves
        allow create: if request.auth != null 
          && request.auth.uid == request.resource.data.fromUserId;
        
        // Users can update requests sent to them (accept/reject)
        allow update: if request.auth != null 
          && request.auth.uid == resource.data.toUserId;
        
        // Users can delete their own sent requests
        allow delete: if request.auth != null 
          && request.auth.uid == resource.data.fromUserId;
      }
    }
  }
}
```

6. Click **Publish** to save the rules

## What These Rules Do

### User Documents
- **`/users/{userId}`**: Users can read/write their own user document
- **Username queries**: All authenticated users can query usernames for availability checks

### Wardrobes & Items
- **`/users/{userId}/wardrobe/{itemId}`**: Legacy collection - users can only read/write their own items
- **`/users/{userId}/wardrobes/{wardrobeId}`**: 
  - Users can read/write their own wardrobes
  - Friends can read wardrobes marked as `isShareable: true`
- **`/users/{userId}/wardrobes/{wardrobeId}/items/{itemId}`**: 
  - Users can read/write their own items
  - Friends can read items in shareable wardrobes

### Social Features
- **`/users/{userId}/friends/{friendId}`**: Users can read/write their own friends list
- **`/users/{userId}/friendRequests/{requestId}`**: 
  - Users can read requests sent to them or by them
  - Users can create requests from themselves
  - Users can accept/reject requests sent to them
  - Users can delete their own sent requests

### Helper Functions
- **`areFriends(userId1, userId2)`**: Checks if a friendship exists between two users

The `request.auth != null` check ensures that only authenticated users can access the data.

## Testing

After updating the rules, try creating a new wardrobe in the app. The permission error should be resolved.

