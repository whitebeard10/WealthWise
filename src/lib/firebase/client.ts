
// src/lib/firebase/client.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore'; // Import Firestore

// Read environment variables into constants immediately
const ENV_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const ENV_AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const ENV_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const ENV_STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const ENV_MESSAGING_SENDER_ID = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const ENV_APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

const firebaseConfig = {
  apiKey: ENV_API_KEY,
  authDomain: ENV_AUTH_DOMAIN,
  projectId: ENV_PROJECT_ID,
  storageBucket: ENV_STORAGE_BUCKET,
  messagingSenderId: ENV_MESSAGING_SENDER_ID,
  appId: ENV_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore; // Firestore instance

// Only run the environment variable check and initialization if no apps are initialized yet.
if (!getApps().length) {
  // Check if all required environment variables have values
  const requiredEnvVarKeys = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];

  // Use the captured constants for the check
  const capturedValues: Record<string, string | undefined> = {
    NEXT_PUBLIC_FIREBASE_API_KEY: ENV_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ENV_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: ENV_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ENV_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ENV_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: ENV_APP_ID,
  };

  const missingEnvVars = requiredEnvVarKeys.filter(
    key => !capturedValues[key]
  );

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Firebase configuration error: Missing environment variable values for: ${missingEnvVars.join(', ')}. Please check your Firebase Studio environment variable settings and ensure all NEXT_PUBLIC_FIREBASE_ variables are set correctly.`
    );
  }

  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("CLIENT.TS: Firebase initializeApp error:", error);
    console.error("CLIENT.TS: Attempted Firebase config during error:", {
        apiKey: ENV_API_KEY ? '*** PRESENT ***' : '!!! MISSING !!!',
        authDomain: ENV_AUTH_DOMAIN,
        projectId: ENV_PROJECT_ID,
        storageBucket: ENV_STORAGE_BUCKET,
        messagingSenderId: ENV_MESSAGING_SENDER_ID,
        appId: ENV_APP_ID,
    });
    throw new Error(`Firebase initializeApp failed. Original error: ${error instanceof Error ? error.message : String(error)}. Review config and environment variables.`);
  }
} else {
  app = getApp(); // Use the already initialized app
}

try {
  auth = getAuth(app);
  db = getFirestore(app); // Initialize Firestore
} catch (error) {
    console.error("CLIENT.TS: Firebase getAuth/getFirestore error:", error);
    const appName = app && app.name ? app.name : "undefined_app";
    throw new Error(`Firebase getAuth or getFirestore failed for app "${appName}". Original error: ${error instanceof Error ? error.message : String(error)}. This usually indicates an issue with the app initialization or configuration.`);
}

export { app, auth, db }; // Export db
