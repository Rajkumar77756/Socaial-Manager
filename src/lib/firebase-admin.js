import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

export function initAdmin() {
  if (getApps().length > 0) return;
  if (!process.env.FIREBASE_PROJECT_ID) return;
  
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    console.error("Firebase admin initialization error", error.stack);
  }
}

export const getAdminDb = () => {
  initAdmin();
  return getFirestore();
};

export const getAdminStorage = () => {
  initAdmin();
  return getStorage();
};
