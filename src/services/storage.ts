import {
  ref,
  uploadBytes,
  deleteObject,
  getDownloadURL,
  StorageError,
} from 'firebase/storage';
import { storage } from '../config/firebase';

const getStorageErrorMessage = (error: StorageError): string => {
  switch (error.code) {
    case 'storage/object-not-found':
      return 'File not found.';
    case 'storage/unauthorized':
      return 'You do not have permission to access this file.';
    case 'storage/cancelled':
      return 'Upload was cancelled.';
    case 'storage/invalid-checksum':
      return 'File checksum mismatch. Please try again.';
    case 'storage/invalid-event-name':
      return 'Invalid operation.';
    case 'storage/invalid-url':
      return 'Invalid storage URL.';
    case 'storage/invalid-argument':
      return 'Invalid argument provided.';
    case 'storage/no-default-bucket':
      return 'Storage bucket not configured.';
    case 'storage/cannot-slice-blob':
      return 'Unable to upload file. Please try again.';
    case 'storage/server-file-wrong-size':
      return 'File size mismatch. Please try again.';
    default:
      return error.message || 'An error occurred with file storage.';
  }
};

export const uploadImage = async (userId: string, itemId: string, file: File): Promise<string> => {
  try {
    if (!storage) {
      throw new Error('Firebase Storage is not initialized. Check your Firebase configuration.');
    }

    const timestamp = Date.now();
    const fileName = `${itemId}_${timestamp}_${file.name}`;
    const storagePath = `users/${userId}/items/${itemId}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    console.log('Uploading image to Firebase Storage:', { storagePath, fileSize: file.size, fileType: file.type });

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log('Image uploaded successfully:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    const storageError = error as StorageError;
    const errorMessage = getStorageErrorMessage(storageError);
    console.error('Storage error details:', {
      code: storageError.code,
      message: storageError.message,
      serverResponse: storageError.serverResponse,
    });
    throw new Error(errorMessage);
  }
};

export const deleteImage = async (filePath: string): Promise<void> => {
  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
  } catch (error) {
    const storageError = error as StorageError;
    throw new Error(getStorageErrorMessage(storageError));
  }
};

export const deleteItemImages = async (): Promise<void> => {
  // Note: Firestore doesn't support deleting directories directly
  // Images will need to be tracked in Firestore and deleted individually
  // Or use a Cloud Function to handle batch deletion
  console.warn('Bulk delete of item images requires Cloud Function implementation');
};
