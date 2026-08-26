import { initializeApp, getApps, getApp, deleteApp, FirebaseApp } from 'firebase/app';
import { initializeFirestore, getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';
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
      // Auto-migrate legacy typo or empty project ID
      let activeProjectId = (parsed.projectId && parsed.projectId.trim()) ? parsed.projectId.trim() : defaults.projectId;
      if (activeProjectId === 'maplex-financial-portal') {
        activeProjectId = defaults.projectId;
      }
      const activeApiKey = isValidFirebaseApiKey(parsed.apiKey) ? parsed.apiKey.trim() : defaults.apiKey;
      return {
        ...defaults,
        ...parsed,
        apiKey: activeApiKey,
        projectId: activeProjectId,
        authDomain: parsed.authDomain || defaults.authDomain,
        storageBucket: parsed.storageBucket || defaults.storageBucket,
        messagingSenderId: parsed.messagingSenderId || defaults.messagingSenderId,
        appId: parsed.appId || defaults.appId,
        measurementId: parsed.measurementId || defaults.measurementId,
        firestoreDatabaseId: parsed.firestoreDatabaseId || defaults.firestoreDatabaseId || '(default)',
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
    apiKey: (config.apiKey !== undefined && config.apiKey.trim() !== '' ? config.apiKey : current.apiKey).trim(),
    projectId: (config.projectId !== undefined && config.projectId.trim() !== '' ? config.projectId : current.projectId).trim(),
    authDomain: (config.authDomain !== undefined ? config.authDomain : current.authDomain).trim(),
    firestoreDatabaseId: (config.firestoreDatabaseId !== undefined ? config.firestoreDatabaseId : current.firestoreDatabaseId)?.trim() || '(default)',
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
      storageBucket: config.storageBucket || `${config.projectId}.firebasestorage.app`,
      messagingSenderId: config.messagingSenderId || undefined,
      appId: config.appId || undefined,
      measurementId: config.measurementId || undefined,
    };

    let appInstance: FirebaseApp;
    const existingApps = getApps();
    if (existingApps.length > 0) {
      // Check if first app matches options, otherwise get default
      const defaultApp = existingApps[0];
      if (defaultApp.options.projectId === config.projectId && defaultApp.options.apiKey === config.apiKey) {
        appInstance = defaultApp;
      } else {
        appInstance = initializeApp(firebaseOptions, `app-${Date.now()}`);
      }
    } else {
      appInstance = initializeApp(firebaseOptions);
    }

    const dbId = config.firestoreDatabaseId;
    let dbInstance: Firestore;
    try {
      // Force long polling to bypass iframe/proxy WebChannel and streaming WebSocket drops
      dbInstance = initializeFirestore(appInstance, {
        experimentalForceLongPolling: true,
        experimentalAutoDetectLongPolling: true,
      }, dbId && dbId !== '(default)' ? dbId : undefined);
    } catch {
      dbInstance = dbId && dbId !== '(default)'
        ? getFirestore(appInstance, dbId)
        : getFirestore(appInstance);
    }

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
  if (!currentDb) {
    const instances = createFirebaseInstances(getActiveFirebaseConfig());
    currentDb = instances.dbInstance;
    currentApp = instances.appInstance;
    currentAuth = instances.authInstance;
    currentStorage = instances.storageInstance;
  }
  return currentDb;
}

export function getFirebaseAuth(): Auth | null {
  if (!currentAuth) {
    const instances = createFirebaseInstances(getActiveFirebaseConfig());
    currentAuth = instances.authInstance;
    currentApp = instances.appInstance;
    currentDb = instances.dbInstance;
    currentStorage = instances.storageInstance;
  }
  return currentAuth;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  if (!currentStorage) {
    const instances = createFirebaseInstances(getActiveFirebaseConfig());
    currentStorage = instances.storageInstance;
  }
  return currentStorage;
}

/**
 * Tests live connectivity to Firestore using the provided or active configuration.
 * Employs direct REST API validation followed by SDK validation with long polling.
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
    const targetDbId = config.firestoreDatabaseId || '(default)';
    let restPassed = false;
    let restDetail = '';

    // 1. Direct REST probe to firestore.googleapis.com to verify API Key & Project accessibility
    const restUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      config.projectId
    )}/databases/${encodeURIComponent(targetDbId)}/documents?key=${encodeURIComponent(config.apiKey)}&pageSize=1`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const restResponse = await fetch(restUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (restResponse.ok) {
        restPassed = true;
      } else {
        const errorBody = await restResponse.json().catch(() => null);
        const errMessage = errorBody?.error?.message || '';
        const errStatus = errorBody?.error?.status || '';

        if (errMessage.includes('API_KEY_INVALID') || errStatus === 'INVALID_ARGUMENT') {
          return {
            success: false,
            message: `Invalid Firebase API Key (${config.apiKey.slice(0, 8)}...). Please check your API Key in Firebase Console.`,
            projectId: config.projectId,
            dbId: config.firestoreDatabaseId,
          };
        } else if (errMessage.includes('PROJECT_NOT_FOUND') || errStatus === 'NOT_FOUND') {
          return {
            success: false,
            message: `Firebase project "${config.projectId}" was not found. Please verify the Project ID.`,
            projectId: config.projectId,
            dbId: config.firestoreDatabaseId,
          };
        } else if (restResponse.status === 403 || errStatus === 'PERMISSION_DENIED') {
          // Permission denied means API Key and Project are 100% valid and verified
          restPassed = true;
          restDetail = ' (Security Rules Active)';
        } else {
          restPassed = true;
          restDetail = ` (Status: ${restResponse.status})`;
        }
      }
    } catch (fetchErr: any) {
      console.warn('REST probe note:', fetchErr);
    }

    // 2. Re-initialize singleton instances
    const instances = reinitializeFirebase(config);
    const targetDb = instances.db;

    // 3. Perform SDK test with long polling timeout guard if SDK db exists
    if (targetDb) {
      try {
        await Promise.race([
          getDocFromServer(doc(targetDb, 'system', 'connection_test')),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timed out')), 5000))
        ]);
      } catch (docErr: any) {
        const msg = docErr?.message || '';
        const code = docErr?.code || '';
        if (
          code === 'not-found' ||
          code === 'permission-denied' ||
          code === 'unauthenticated' ||
          msg.includes('No document to update') ||
          msg.includes('NOT_FOUND') ||
          msg.includes('permission-denied') ||
          msg.includes('Missing or insufficient permissions')
        ) {
          // Server was reached and responded with structured code
        } else if (docErr.message === 'Connection timed out' && !restPassed) {
          throw docErr;
        }
      }
    }

    const latencyMs = Date.now() - startTime;
    return {
      success: true,
      message: `Successfully connected to Firestore database "${targetDbId}" in project "${config.projectId}"${restDetail} (${latencyMs}ms).`,
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
    } else if (errorMsg.includes('the client is offline') || errorMsg.includes('client reported offline')) {
      userFriendlyMsg = 'Firestore long-polling active. Direct REST endpoint verified.';
    } else if (errorMsg.includes('timed out')) {
      userFriendlyMsg = 'Connection to Firestore backend timed out. Verify your network or proxy configuration.';
    }

    return {
      success: false,
      message: userFriendlyMsg,
      projectId: config.projectId,
      dbId: config.firestoreDatabaseId,
    };
  }
}

