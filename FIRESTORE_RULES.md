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
    match /users/{userId} {
      // Users can read/write their own document
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow authenticated users to query usernames for availability checks
      // This is needed for username uniqueness validation
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
```

6. Click **Publish** to save the rules

## What These Rules Do

- **`/users/{userId}`**: Users can only read/write their own user document
- **`/users/{userId}/wardrobe/{itemId}`**: Users can only read/write their own clothing items
- **`/users/{userId}/wardrobes/{wardrobeId}`**: Users can only read/write their own wardrobes

The `request.auth != null` check ensures that only authenticated users can access the data.

## Testing

After updating the rules, try creating a new wardrobe in the app. The permission error should be resolved.

