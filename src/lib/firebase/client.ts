
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

let app: FirebaseApp;
let auth: Auth;

// Only run the environment variable check if no apps are initialized yet.
// This helps prevent errors if the module is evaluated multiple times client-side
// and process.env isn't consistently populated in every instance.
if (!getApps().length) {
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missingEnvVars.length > 0) {
    throw new Error(
      `Firebase configuration error: Missing environment variables: ${missingEnvVars.join(', ')}. Please check your Firebase Studio environment variable settings and ensure all NEXT_PUBLIC_FIREBASE_ variables are set correctly.`
    );
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Firebase initialization error:", error);
    // Log the config that was attempted
    console.error("Attempted Firebase config:", firebaseConfig);
    // If any required var is still undefined here, it's a critical issue.
    const stillMissing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (stillMissing.length > 0) {
        throw new Error(`Firebase initialization failed due to UNRESOLVED missing env vars: ${stillMissing.join(', ')}. This should not happen if the initial check passed.`)
    }
    throw new Error(`Firebase initialization failed. Original error: ${error instanceof Error ? error.message : String(error)}. Check your Firebase config values in Firebase Studio environment settings.`);
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
