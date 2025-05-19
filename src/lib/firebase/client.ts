
// src/lib/firebase/client.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// --- Temporary Debugging Line ---
console.log('NEXT_PUBLIC_FIREBASE_API_KEY as seen by client.ts:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
// --- End Temporary Debugging Line ---

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Firebase configuration error: Missing environment variables: ${missingEnvVars.join(', ')}. Please check your .env.local file and ensure all NEXT_PUBLIC_FIREBASE_ variables are set correctly.`
  );
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Firebase initialization error:", error);
    throw new Error(`Firebase initialization failed. Original error: ${error instanceof Error ? error.message : String(error)}. Check your Firebase config values.`);
  }
} else {
  app = getApp();
}

try {
  auth = getAuth(app);
} catch (error) {
    console.error("Firebase getAuth error:", error);
    throw new Error(`Firebase getAuth failed. Original error: ${error instanceof Error ? error.message : String(error)}. This usually indicates an issue with the app initialization or configuration.`);
}

export { app, auth };
