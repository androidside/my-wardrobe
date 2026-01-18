import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  AuthError,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { AuthUser } from '../types/auth';

const getFirebaseErrorMessage = (error: AuthError): string => {
  const errorCode = error.code;
  
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please log in instead.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    default:
      return error.message || 'An error occurred. Please try again.';
  }
};

export const signup = async (email: string, password: string): Promise<AuthUser> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email || '',
    };
  } catch (error) {
    const firebaseError = error as AuthError;
    throw new Error(getFirebaseErrorMessage(firebaseError));
  }
};

export const login = async (email: string, password: string): Promise<AuthUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email || '',
    };
  } catch (error) {
    const firebaseError = error as AuthError;
    throw new Error(getFirebaseErrorMessage(firebaseError));
  }
};

export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    const firebaseError = error as AuthError;
    throw new Error(getFirebaseErrorMessage(firebaseError));
  }
};

export const getCurrentUser = (): AuthUser | null => {
  const user = auth.currentUser;
  if (!user) return null;
  
  return {
    uid: user.uid,
    email: user.email || '',
  };
};

export const onAuthStateChange = (callback: (user: AuthUser | null) => void): (() => void) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email || '',
      });
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};

export const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No user is currently signed in.');
    }

    // Re-authenticate user with current password
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);
  } catch (error) {
    const firebaseError = error as AuthError;
    
    // Handle specific error cases
    if (firebaseError.code === 'auth/wrong-password') {
      throw new Error('Current password is incorrect.');
    } else if (firebaseError.code === 'auth/weak-password') {
      throw new Error('New password is too weak. Use at least 6 characters.');
    } else if (firebaseError.code === 'auth/requires-recent-login') {
      throw new Error('Please log out and log back in before changing your password.');
    }
    
    throw new Error(getFirebaseErrorMessage(firebaseError));
  }
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    const firebaseError = error as AuthError;
    
    if (firebaseError.code === 'auth/user-not-found') {
      throw new Error('No account found with this email.');
    } else if (firebaseError.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    } else if (firebaseError.code === 'auth/too-many-requests') {
      throw new Error('Too many requests. Please try again later.');
    }
    
    throw new Error(getFirebaseErrorMessage(firebaseError));
  }
};
