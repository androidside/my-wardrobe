# 🔧 URGENT: Firestore Security Rules Update Required

## Issue
Username availability checking fails during signup because users aren't authenticated yet, but the security rules require authentication to query usernames.

**Symptom**: Every username shows as "already taken" during signup.

## Solution
Update your Firestore security rules in Firebase Console to allow username queries for both authenticated and unauthenticated users (needed for signup flow).

---

## 📋 Steps to Fix

### 1. Open Firebase Console
Go to: https://console.firebase.google.com/

### 2. Navigate to Firestore Rules
- Select your project
- Click **Firestore Database** in the left sidebar  
- Click the **Rules** tab

### 3. Replace with Updated Rules
Copy and paste the complete rules from `FIRESTORE_RULES.md` file, or use the rules below:

### 4. Click "Publish" to Save

---

## 🔐 Key Changes Made

### Before (Broken for Signup):
```javascript
match /users/{userId} {
  allow list: if request.auth != null; // ❌ Blocks unauthenticated users during signup
}
```

### After (Fixed):
```javascript
match /users/{userId} {
  allow list: if request.query.limit <= 20 
    && request.query.orderBy.size() == 0; // ✅ Allows username queries for everyone
}
```

### Security Considerations:
- **Limited to 20 results** - Prevents abuse from bulk data extraction
- **No ordering** - Prevents pagination attacks
- **Query filtering** - The `where('username', '==', username)` filter in the app ensures only specific username lookups are performed
- **Read access to individual docs still restricted** - Users can only read their own profile documents

---

## ✅ After Publishing

1. **Try signing up again** with any username
2. Username availability check should now work correctly
3. You should see ✅ "Username available" in green when a username is available
4. You should see ❌ "This username is already taken" in red only when it's actually taken

---

## 🐛 Troubleshooting

If it still doesn't work:

1. **Check browser console** for error messages
2. **Verify rules published** - The Firebase Console should show "Last updated: [current time]"
3. **Hard refresh** your app (Cmd/Ctrl + Shift + R)
4. **Check Firestore query logs** in Firebase Console under "Usage" tab

---

## 📧 Need Help?

If you still have issues after following these steps, check:
- The browser's developer console for specific error messages
- Firebase Console → Firestore → Usage tab for denied requests
- Make sure you're using the exact rules from `FIRESTORE_RULES.md`

