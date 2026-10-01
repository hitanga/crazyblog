// Firebase configuration and authentication setup
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword as fbSignIn,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  createUserWithEmailAndPassword as fbCreateUser
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Check if valid Firebase credentials are provided in .env
const hasValidFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "MY_FIREBASE_API_KEY" &&
  firebaseConfig.projectId
);

let app = null;
let authInstance = null;

if (hasValidFirebaseConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(app);
    console.log("Firebase initialized successfully with live project credentials.");
  } catch (err) {
    console.warn("Failed to initialize live Firebase project, falling back to local simulation:", err);
  }
}

// Fallback session storage listener for demo/local evaluation when Firebase env is empty
const AUTH_STORAGE_KEY = "gutenverse_admin_session";
const listeners = new Set();

function notifyListeners(user) {
  listeners.forEach(cb => {
    try { cb(user); } catch (e) { console.error(e); }
  });
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Authentication Wrappers
export const loginWithEmailPassword = async (email, password) => {
  if (authInstance) {
    return await fbSignIn(authInstance, email, password);
  }
  // Local fallback auth
  if (!email || !password) {
    throw new Error("Please enter both email and password.");
  }
  if (password.length < 5) {
    throw new Error("Password must be at least 5 characters long.");
  }
  const simulatedUser = {
    uid: "admin-" + btoa(email).substring(0, 8),
    email,
    displayName: email.split("@")[0].toUpperCase(),
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(simulatedUser));
  notifyListeners(simulatedUser);
  return { user: simulatedUser };
};

export const registerWithEmailPassword = async (email, password) => {
  if (authInstance) {
    return await fbCreateUser(authInstance, email, password);
  }
  // Local fallback auth
  if (!email || !password) {
    throw new Error("Please enter both email and password.");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }
  const simulatedUser = {
    uid: "admin-" + btoa(email).substring(0, 8),
    email,
    displayName: email.split("@")[0].toUpperCase(),
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(simulatedUser));
  notifyListeners(simulatedUser);
  return { user: simulatedUser };
};

export const logoutAdmin = async () => {
  if (authInstance) {
    return await fbSignOut(authInstance);
  }
  localStorage.removeItem(AUTH_STORAGE_KEY);
  notifyListeners(null);
  return true;
};

export const subscribeToAuth = (callback) => {
  if (authInstance) {
    return fbOnAuthStateChanged(authInstance, callback);
  }
  listeners.add(callback);
  // Send current state
  const currentUser = getStoredUser();
  callback(currentUser);
  return () => {
    listeners.delete(callback);
  };
};

export const getCurrentAuthUser = () => {
  if (authInstance) {
    return authInstance.currentUser;
  }
  return getStoredUser();
};

export const isLiveFirebaseActive = hasValidFirebaseConfig;
export { app, authInstance };
export default authInstance;
