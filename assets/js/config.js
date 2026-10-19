// ==========================================================================
// Firebase Configuration for Birthday Guestbook
// ==========================================================================
// To enable cloud storage for guestbook wishes across devices:
// 1. Create a free project at https://console.firebase.google.com/
// 2. Add a Web App and copy your firebaseConfig below.
// 3. Create a Cloud Firestore database in test mode.
// 4. That's it! (If left as default, the guestbook will use local storage).
// ==========================================================================

const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Check if user has provided real Firebase keys
window.isFirebaseConfigured = function() {
  return FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY" && 
         FIREBASE_CONFIG.projectId !== "YOUR_PROJECT_ID" && 
         typeof window.firebaseModules !== 'undefined';
};

// Initialize Firebase if configured
try {
  if (window.isFirebaseConfigured()) {
    const { initializeApp } = window.firebaseModules;
    const { getFirestore } = window.firestoreModules;
    window.firebaseApp = initializeApp(FIREBASE_CONFIG);
    window.firebaseDB = getFirestore(window.firebaseApp);
    console.log("✦ Firebase initialized successfully for Guestbook.");
  } else {
    window.firebaseApp = null;
    window.firebaseDB = null;
    console.log("✦ Firebase not configured yet — Guestbook will run in offline / local storage mode.");
  }
} catch (err) {
  console.warn("Firebase initialization skipped or encountered error:", err);
  window.firebaseApp = null;
  window.firebaseDB = null;
}
