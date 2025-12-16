import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
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
