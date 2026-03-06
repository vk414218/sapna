import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue,
  off,
  Database,
  query,
  orderByChild,
  equalTo,
} from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';
import { User } from '../types';

// ---------------------------------------------------------------------------
// Firebase configuration
//
// The built-in values below belong to the project "vishal-b6def" and are
// safe to embed (Firebase web API keys are public by design; security is
// enforced via Firebase Security Rules, not by keeping the key secret).
//
// Any VITE_FIREBASE_* environment variable takes precedence over the built-in
// value, so you can override individual fields via a .env file if needed.
// See .env.example for the full list of available variables.
//
// IMPORTANT – Realtime Database setup:
//   Go to Firebase console → Build → Realtime Database → Create Database
//   and set the security rules to allow read/write during development:
//     { "rules": { ".read": true, ".write": true } }
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey:            (import.meta.env.VITE_FIREBASE_API_KEY            as string | undefined) ?? 'AIzaSyBCqQkfoLOXzpPTir2U5j1N7Yz0MtZtkFk',
  authDomain:        (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        as string | undefined) ?? 'vishal-b6def.firebaseapp.com',
  // Standard Realtime Database URL for the vishal-b6def project (us-central1 region).
  // If you created the database in a different region update VITE_FIREBASE_DATABASE_URL.
  databaseURL:       (import.meta.env.VITE_FIREBASE_DATABASE_URL       as string | undefined) ?? 'https://vishal-b6def-default-rtdb.firebaseio.com',
  projectId:         (import.meta.env.VITE_FIREBASE_PROJECT_ID         as string | undefined) ?? 'vishal-b6def',
  storageBucket:     (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     as string | undefined) ?? 'vishal-b6def.firebasestorage.app',
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined) ?? '684833400978',
  appId:             (import.meta.env.VITE_FIREBASE_APP_ID             as string | undefined) ?? '1:684833400978:web:7d5a9b7e5baf5b281d9e4b',
  measurementId:     (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     as string | undefined) ?? 'G-KE7659QK44',
};

// The config is always complete now (built-in defaults ensure all fields are set).
export const isFirebaseConfigured: boolean = true;

let app: FirebaseApp | null = null;
let db: Database | null = null;

try {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  db = getDatabase(app);

  // Initialize Analytics only in browser environments that support it
  if (typeof window !== 'undefined') {
    getAnalytics(app);
  }
} catch (e) {
  console.error('[Firebase] Initialization failed:', e);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const USERS_PATH = 'users';

function userKey(phone: string): string {
  // Firebase keys cannot contain . $ # [ ] /
  return phone.replace(/[.#$[\]/]/g, '_');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Save (or update) a user in Firebase Realtime Database.
 * Falls back to localStorage when Firebase is not configured.
 */
export async function saveUserGlobally(user: User): Promise<void> {
  if (!db) {
    _localSave(user);
    return;
  }
  const userRef = ref(db, `${USERS_PATH}/${userKey(user.phone)}`);
  await set(userRef, {
    ...user,
    // Never persist geolocation to a shared DB
    location: null,
  });
}

/**
 * Retrieve a single user by phone number.
 */
export async function getUserByPhone(phone: string): Promise<User | null> {
  if (!db) return _localGetByPhone(phone);
  const userRef = ref(db, `${USERS_PATH}/${userKey(phone)}`);
  const snap = await get(userRef);
  return snap.exists() ? (snap.val() as User) : null;
}

/**
 * Retrieve a single user by username (exact match, case-insensitive).
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  if (!db) return _localGetByUsername(username);
  const usersRef = ref(db, USERS_PATH);
  const q = query(usersRef, orderByChild('username'), equalTo(username.toLowerCase()));
  const snap = await get(q);
  if (!snap.exists()) return null;
  const vals = Object.values(snap.val() as Record<string, User>);
  return vals[0] ?? null;
}

/**
 * Fetch all registered users once.
 */
export async function getAllUsers(): Promise<User[]> {
  if (!db) return _localGetAll();
  const usersRef = ref(db, USERS_PATH);
  const snap = await get(usersRef);
  if (!snap.exists()) return [];
  return Object.values(snap.val() as Record<string, User>);
}

/**
 * Subscribe to real-time user list updates.
 * Returns an unsubscribe function.
 */
export function subscribeToUsers(callback: (users: User[]) => void): () => void {
  if (!db) {
    // Fallback: poll localStorage every 5 s and also respond to storage events
    const handler = () => callback(_localGetAll());
    const id = setInterval(handler, 5000);
    window.addEventListener('storage', handler);
    // Emit initial value immediately
    callback(_localGetAll());
    return () => {
      clearInterval(id);
      window.removeEventListener('storage', handler);
    };
  }
  const usersRef = ref(db, USERS_PATH);
  onValue(usersRef, (snap) => {
    if (!snap.exists()) { callback([]); return; }
    callback(Object.values(snap.val() as Record<string, User>));
  });
  return () => off(usersRef);
}

/**
 * Mark a user online/offline in Firebase.
 */
export async function setUserStatus(phone: string, status: 'online' | 'offline'): Promise<void> {
  if (!db) { _localSetStatus(phone, status); return; }
  const userRef = ref(db, `${USERS_PATH}/${userKey(phone)}`);
  await update(userRef, { status });
}

// ---------------------------------------------------------------------------
// localStorage fallbacks (single-device mode)
// ---------------------------------------------------------------------------
const LS_KEY = 'global_registered_users';

function _localGetAll(): User[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') as User[]; }
  catch { return []; }
}

function _localSave(user: User): void {
  const users = _localGetAll();
  const idx = users.findIndex(u => u.phone === user.phone);
  if (idx === -1) users.push(user); else users[idx] = user;
  localStorage.setItem(LS_KEY, JSON.stringify(users));
  window.dispatchEvent(new Event('storage'));
}

function _localGetByPhone(phone: string): User | null {
  return _localGetAll().find(u => u.phone === phone) ?? null;
}

function _localGetByUsername(username: string): User | null {
  return _localGetAll().find(u => u.username?.toLowerCase() === username.toLowerCase()) ?? null;
}

function _localSetStatus(phone: string, status: 'online' | 'offline'): void {
  const users = _localGetAll();
  const idx = users.findIndex(u => u.phone === phone);
  if (idx !== -1) { users[idx].status = status; }
  localStorage.setItem(LS_KEY, JSON.stringify(users));
  window.dispatchEvent(new Event('storage'));
}
