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
import { User } from '../types';

// ---------------------------------------------------------------------------
// Firebase configuration
// Load from Vite env vars (VITE_FIREBASE_*).  See .env.example for the
// required keys.  When the database URL is not provided the service gracefully
// falls back to localStorage so the app still works on a single device.
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            as string | undefined,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        as string | undefined,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL       as string | undefined,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         as string | undefined,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             as string | undefined,
};

export const isFirebaseConfigured: boolean =
  !!firebaseConfig.apiKey && !!firebaseConfig.databaseURL;

let app: FirebaseApp | null = null;
let db: Database | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    db = getDatabase(app);
  } catch (e) {
    console.error('[Firebase] Initialization failed:', e);
  }
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
