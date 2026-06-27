import { collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, onSnapshot, DocumentData, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Report, UserProfile, Comment, Vote } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// User Profiles
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const pathForGet = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pathForGet);
    return null;
  }
};

export const createUserProfile = async (userId: string, profile: Omit<UserProfile, 'id'>): Promise<void> => {
  const pathForWrite = `users/${userId}`;
  try {
    await setDoc(doc(db, 'users', userId), profile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
};

// Reports
export const getReports = async (): Promise<Report[]> => {
  const pathForGetDocs = 'reports';
  try {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pathForGetDocs);
    return [];
  }
};

export const getReport = async (reportId: string): Promise<Report | null> => {
  const pathForGet = `reports/${reportId}`;
  try {
    const docRef = doc(db, 'reports', reportId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Report;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pathForGet);
    return null;
  }
};

export const createReport = async (report: Omit<Report, 'id'>): Promise<string> => {
  const pathForWrite = 'reports';
  try {
    const docRef = await addDoc(collection(db, 'reports'), report);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
    return '';
  }
};

export const updateReport = async (reportId: string, data: Partial<Report>): Promise<void> => {
  const pathForUpdate = `reports/${reportId}`;
  try {
    await updateDoc(doc(db, 'reports', reportId), data as DocumentData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, pathForUpdate);
  }
};

// Comments
export const getComments = async (reportId: string): Promise<Comment[]> => {
  const pathForGetDocs = `reports/${reportId}/comments`;
  try {
    const q = query(collection(db, 'reports', reportId, 'comments'), orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pathForGetDocs);
    return [];
  }
};

export const addComment = async (reportId: string, comment: Omit<Comment, 'id'>): Promise<string> => {
  const pathForWrite = `reports/${reportId}/comments`;
  try {
    const docRef = await addDoc(collection(db, 'reports', reportId, 'comments'), comment);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
    return '';
  }
};

// Votes
export const getVotes = async (reportId: string): Promise<Vote[]> => {
  const pathForGetDocs = `reports/${reportId}/votes`;
  try {
    const q = query(collection(db, 'reports', reportId, 'votes'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vote));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pathForGetDocs);
    return [];
  }
};

export const addVote = async (reportId: string, vote: Omit<Vote, 'id'>): Promise<string> => {
  const pathForWrite = `reports/${reportId}/votes`;
  try {
    const docRef = await addDoc(collection(db, 'reports', reportId, 'votes'), vote);
    // Note: should also update report votes count transactionally, but for now we'll do it separately or depend on the client to re-fetch
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
    return '';
  }
};

export const deleteVote = async (reportId: string, voteId: string): Promise<void> => {
  const pathForDelete = `reports/${reportId}/votes/${voteId}`;
  try {
    await deleteDoc(doc(db, 'reports', reportId, 'votes', voteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, pathForDelete);
  }
};
