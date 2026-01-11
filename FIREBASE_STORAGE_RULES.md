# Firebase Storage Security Rules Setup Guide

## Step-by-Step Instructions

### 1. Navigate to Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. In the left sidebar, click on **"Storage"** (under Build section)

### 2. Access Storage Rules
1. Once in Storage, click on the **"Rules"** tab at the top
2. You'll see the current security rules (usually default rules that deny all access)

### 3. Update Storage Rules

Copy and paste the following rules into the Firebase Storage Rules editor:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to read/write their own profile pictures
    match /users/{userId}/profile/{fileName} {
      allow read: if request.auth != null; // Anyone authenticated can view profile pictures
      allow write: if request.auth != null && request.auth.uid == userId; // Only the owner can upload/delete
      
      // Validate file type (images only)
      allow create: if request.auth != null 
        && request.auth.uid == userId 
        && request.resource.contentType.matches('image/.*')
        && request.resource.size < 5 * 1024 * 1024; // Max 5MB
      
      // Allow updates and deletes by owner
      allow update, delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read/write their own clothing item images
    match /users/{userId}/items/{itemId}/{fileName} {
      allow read: if request.auth != null; // Authenticated users can view images
      allow write: if request.auth != null && request.auth.uid == userId; // Only owner can upload/delete
      
      // Validate file type (images only)
      allow create: if request.auth != null 
        && request.auth.uid == userId 
        && request.resource.contentType.matches('image/.*')
        && request.resource.size < 10 * 1024 * 1024; // Max 10MB for clothing images
      
      // Allow updates and deletes by owner
      allow update, delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other paths by default
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. Publish the Rules
1. Click **"Publish"** button in the top right
2. Confirm the publish action
3. Rules will be deployed immediately (usually takes a few seconds)

### 5. Verify Rules are Active
- You should see a green checkmark or "Published" status
- The rules are now active and protecting your storage

## Rule Breakdown

### Profile Pictures Path: `users/{userId}/profile/{fileName}`
- **Read**: Any authenticated user can view profile pictures
- **Create/Write**: Only the file owner (matching userId) can upload
- **File Validation**: 
  - Must be an image file (`image/*`)
  - Maximum size: 5MB
- **Update/Delete**: Only the owner can modify or delete

### Clothing Item Images Path: `users/{userId}/items/{itemId}/{fileName}`
- **Read**: Any authenticated user can view clothing images
- **Create/Write**: Only the file owner (matching userId) can upload
- **File Validation**:
  - Must be an image file (`image/*`)
  - Maximum size: 10MB
- **Update/Delete**: Only the owner can modify or delete

## Testing the Rules

After publishing, you can test the rules using the Firebase Console:
1. Go to Storage → Rules
2. Click "Rules Playground" or use the simulator
3. Test scenarios:
   - Upload as authenticated user to own path: ✅ Should allow
   - Upload as authenticated user to another user's path: ❌ Should deny
   - Upload without authentication: ❌ Should deny
   - Upload non-image file: ❌ Should deny
   - Upload file larger than 5MB: ❌ Should deny

## Troubleshooting

If uploads still fail after setting up rules:

1. **Check browser console** for specific error messages
2. **Verify authentication**: Make sure user is logged in
3. **Check file size**: Ensure file is under 5MB for profile pictures
4. **Verify file type**: Ensure it's an image file (jpg, png, gif, etc.)
5. **Check Storage bucket**: Verify `VITE_FIREBASE_STORAGE_BUCKET` in your `.env` matches your Firebase project
6. **Review Firebase Console**: Check Storage → Files to see if path structure matches
7. **Check rules deployment**: Ensure rules are published (not just saved as draft)

## Additional Security Considerations

- Rules are evaluated server-side, so they can't be bypassed
- Always validate file types and sizes in rules (defense in depth)
- Consider adding image processing/compression before upload for better performance
- For production, consider adding virus scanning or additional validation
