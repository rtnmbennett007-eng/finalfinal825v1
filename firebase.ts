import { initializeApp, getApps, getApp, deleteApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import defaultFirebaseConfig from '../firebase-applet-config.json';
import { FirebaseClientConfig } from './types';

const STORAGE_KEY = 'maplex_firebase_custom_config';

/**
 * Validates if the given API key is a non-empty, non-dummy key
 */
export function isValidFirebaseApiKey(key?: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  return trimmed.length >= 8 && !trimmed.includes('PLACEHOLDER');
}

/**
 * Returns the default bundled Firebase configuration from firebase-applet-config.json
 */
export function getDefaultFirebaseConfig(): FirebaseClientConfig {
  const apiKey = (defaultFirebaseConfig as any).apiKey || '';
  const projectId = (defaultFirebaseConfig as any).projectId || '';
  return {
    apiKey,
    authDomain: (defaultFirebaseConfig as any).authDomain || (projectId ? `${projectId}.firebaseapp.com` : ''),
    projectId,
    firestoreDatabaseId: (defaultFirebaseConfig as any).firestoreDatabaseId || '(default)',
    storageBucket: (defaultFirebaseConfig as any).storageBucket || (projectId ? `${projectId}.appspot.com` : ''),
    messagingSenderId: (defaultFirebaseConfig as any).messagingSenderId || '',
    appId: (defaultFirebaseConfig as any).appId || '',
    measurementId: (defaultFirebaseConfig as any).measurementId || '',
    isConfigured: isValidFirebaseApiKey(apiKey) && !!projectId,
    lastVerifiedAt: new Date().toISOString(),
  };
}

/**
 * Retrieves the active Firebase configuration from localStorage, falling back to defaults.
 */
export function getActiveFirebaseConfig(): FirebaseClientConfig {
  const defaults = getDefaultFirebaseConfig();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const activeApiKey = parsed.apiKey !== undefined ? parsed.apiKey : defaults.apiKey;
      const activeProjectId = parsed.projectId !== undefined ? parsed.projectId : defaults.projectId;
      return {
        ...defaults,
        ...parsed,
        isConfigured: isValidFirebaseApiKey(activeApiKey) && !!activeProjectId,
      };
    }
  } catch (err) {
    console.warn('Failed to parse saved Firebase config from localStorage:', err);
  }
  return defaults;
}

/**
 * Checks whether Firebase is currently configured with valid credentials
 */
export function isFirebaseConfigured(config?: FirebaseClientConfig): boolean {
  const active = config || getActiveFirebaseConfig();
  return isValidFirebaseApiKey(active.apiKey) && !!(active.projectId && active.projectId.trim());
}

/**
 * Saves custom Firebase configuration to localStorage.
 */
export function saveCustomFirebaseConfig(config: Partial<FirebaseClientConfig>): FirebaseClientConfig {
  const current = getActiveFirebaseConfig();
  const updated: FirebaseClientConfig = {
    ...current,
    ...config,
    apiKey: (config.apiKey !== undefined ? config.apiKey : current.apiKey).trim(),
    projectId: (config.projectId !== undefined ? config.projectId : current.projectId).trim(),
    authDomain: (config.authDomain !== undefined ? config.authDomain : current.authDomain).trim(),
    firestoreDatabaseId: (config.firestoreDatabaseId !== undefined ? config.firestoreDatabaseId : current.firestoreDatabaseId)?.trim(),
    appId: (config.appId !== undefined ? config.appId : current.appId).trim(),
    storageBucket: (config.storageBucket !== undefined ? config.storageBucket : current.storageBucket).trim(),
    messagingSenderId: (config.messagingSenderId !== undefined ? config.messagingSenderId : current.messagingSenderId).trim(),
    isConfigured: false,
    lastVerifiedAt: new Date().toISOString(),
  };

  updated.isConfigured = isValidFirebaseApiKey(updated.apiKey) && !!updated.projectId;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save Firebase config to localStorage:', err);
  }

  // Re-initialize instances with new config
  reinitializeFirebase(updated);
  return updated;
}

/**
 * Resets Firebase config back to default configuration from firebase-applet-config.json
 */
export function resetFirebaseConfigToDefaults(): FirebaseClientConfig {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear Firebase config from localStorage:', err);
  }
  const defaults = getDefaultFirebaseConfig();
  reinitializeFirebase(defaults);
  return defaults;
}

// Active singleton instances
let currentApp: FirebaseApp | null = null;
let currentDb: Firestore | null = null;
let currentAuth: Auth | null = null;
let currentStorage: FirebaseStorage | null = null;

function createFirebaseInstances(config: FirebaseClientConfig) {
  if (!isFirebaseConfigured(config)) {
    return {
      appInstance: null,
      dbInstance: null,
      authInstance: null,
      storageInstance: null,
    };
  }

  try {
    const firebaseOptions = {
      apiKey: config.apiKey,
      authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`,
      projectId: config.projectId,
      storageBucket: config.storageBucket || `${config.projectId}.appspot.com`,
      messagingSenderId: config.messagingSenderId || undefined,
      appId: config.appId || undefined,
      measurementId: config.measurementId || undefined,
    };

    let appInstance: FirebaseApp;
    const existingApps = getApps();
    if (existingApps.length > 0) {
      appInstance = getApp();
    } else {
      appInstance = initializeApp(firebaseOptions);
    }

    const dbId = config.firestoreDatabaseId;
    const dbInstance = dbId && dbId !== '(default)'
      ? getFirestore(appInstance, dbId)
      : getFirestore(appInstance);

    const authInstance = getAuth(appInstance);
    const storageInstance = getStorage(appInstance);

    return { appInstance, dbInstance, authInstance, storageInstance };
  } catch (err) {
    console.warn('Failed to initialize Firebase instances:', err);
    return {
      appInstance: null,
      dbInstance: null,
      authInstance: null,
      storageInstance: null,
    };
  }
}

// Initial bootstrap
const initialConfig = getActiveFirebaseConfig();
const initialInstances = createFirebaseInstances(initialConfig);
currentApp = initialInstances.appInstance;
currentDb = initialInstances.dbInstance;
currentAuth = initialInstances.authInstance;
currentStorage = initialInstances.storageInstance;

export function reinitializeFirebase(config?: Partial<FirebaseClientConfig>) {
  const active = config ? { ...getActiveFirebaseConfig(), ...config } : getActiveFirebaseConfig();
  try {
    const existingApps = getApps();
    for (const ap of existingApps) {
      try {
        deleteApp(ap);
      } catch {
        // ignore delete failure
      }
    }
  } catch (err) {
    console.warn('Error resetting Firebase app instances:', err);
  }

  const instances = createFirebaseInstances(active);
  currentApp = instances.appInstance;
  currentDb = instances.dbInstance;
  currentAuth = instances.authInstance;
  currentStorage = instances.storageInstance;

  return { app: currentApp, db: currentDb, auth: currentAuth, storage: currentStorage };
}

// Export references
export const app = currentApp;
export const db = currentDb;
export const auth = currentAuth;
export const storage = currentStorage;

export function getDb(): Firestore | null {
  return currentDb;
}

export function getFirebaseAuth(): Auth | null {
  return currentAuth;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  return currentStorage;
}

/**
 * Tests live connectivity to Firestore using the provided or active configuration.
 */
export async function testFirestoreConnection(customConfig?: Partial<FirebaseClientConfig>): Promise<{
  success: boolean;
  message: string;
  latencyMs?: number;
  dbId?: string;
  projectId?: string;
}> {
  const startTime = Date.now();
  const config = customConfig ? { ...getActiveFirebaseConfig(), ...customConfig } : getActiveFirebaseConfig();

  if (!config.apiKey || !config.apiKey.trim()) {
    return {
      success: false,
      message: 'Firebase API Key is missing. Please enter a valid Web API Key.',
      projectId: config.projectId,
      dbId: config.firestoreDatabaseId,
    };
  }

  if (!config.projectId || !config.projectId.trim()) {
    return {
      success: false,
      message: 'Firebase Project ID is missing. Please provide your Project ID.',
      projectId: config.projectId,
      dbId: config.firestoreDatabaseId,
    };
  }

  try {
    const instances = createFirebaseInstances(config);
    const targetDb = instances.dbInstance;

    if (!targetDb) {
      throw new Error('Failed to create Firestore database instance with the provided config.');
    }

    // Perform a server-side read attempt to verify connectivity and rules
    try {
      await Promise.race([
        getDocFromServer(doc(targetDb, 'system', 'connection_test')),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timed out after 8 seconds')), 8000))
      ]);
    } catch (docErr: any) {
      // If doc doesn't exist or permissions allow read, that confirms server was reached
      const msg = docErr?.message || '';
      if (
        msg.includes('No document to update') ||
        msg.includes('NOT_FOUND') ||
        msg.includes('permission-denied') ||
        msg.includes('Missing or insufficient permissions')
      ) {
        // Connected to server, permissions or doc state verified
      } else if (msg.includes('offline') || msg.includes('Failed to get document') || msg.includes('network') || msg.includes('timed out')) {
        throw docErr;
      }
    }

    const latencyMs = Date.now() - startTime;
    return {
      success: true,
      message: `Successfully connected to Firestore database "${config.firestoreDatabaseId || '(default)'}" in project "${config.projectId}" (${latencyMs}ms).`,
      latencyMs,
      dbId: config.firestoreDatabaseId,
      projectId: config.projectId,
    };
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown Firestore error occurred.';
    let userFriendlyMsg = `Connection failed: ${errorMsg}`;

    if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('api-key-not-valid') || errorMsg.includes('invalid api key')) {
      userFriendlyMsg = 'Invalid Firebase API Key. Please verify your Web API Key from the Firebase Console.';
    } else if (errorMsg.includes('PROJECT_NOT_FOUND') || errorMsg.includes('project-not-found')) {
      userFriendlyMsg = `Firebase project "${config.projectId}" was not found. Please check your Project ID.`;
    } else if (errorMsg.includes('the client is offline')) {
      userFriendlyMsg = 'Unable to reach Firebase Firestore backend (client reported offline). Check internet connection and API Key.';
    } else if (errorMsg.includes('timed out')) {
      userFriendlyMsg = 'Connection to Firestore timed out. Please check your network and Firebase configuration.';
    }

    return {
      success: false,
      message: userFriendlyMsg,
      projectId: config.projectId,
      dbId: config.firestoreDatabaseId,
    };
  }
}
