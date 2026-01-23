
import { RoadInfo } from './geminiService';
import { Coordinates, LogEntry } from '../types';
import { uploadToDrive, isAuthenticated } from './googleDriveService';
import { idbSet, idbGet, idbGetAllKeys, idbClear, idbGetAll, LOGS_STORE_NAME } from '../utils/indexedDB';

const STORAGE_PREFIX = 'Gemini_API_Data';
const PENDING_KEYS_LIST = 'Gemini_Pending_Keys';
const MIGRATION_KEY = 'Gemini_Migration_V1_Done';
const LOG_COUNT_KEY = 'Gemini_Logs_Count';

// Helper to manage pending keys list
const getPendingKeys = (): string[] => {
  try {
    const val = localStorage.getItem(PENDING_KEYS_LIST);
    return val ? JSON.parse(val) : [];
  } catch {
    return [];
  }
};

const addPendingKey = (key: string) => {
  const keys = getPendingKeys();
  if (!keys.includes(key)) {
    keys.push(key);
    localStorage.setItem(PENDING_KEYS_LIST, JSON.stringify(keys));
  }
};

const removePendingKey = (key: string) => {
  const keys = getPendingKeys();
  const index = keys.indexOf(key);
  if (index > -1) {
    keys.splice(index, 1);
    localStorage.setItem(PENDING_KEYS_LIST, JSON.stringify(keys));
  }
};

// Migration function to populate pending keys for existing data
const migratePendingKeys = () => {
    if (localStorage.getItem(MIGRATION_KEY)) return;

    console.log("[Storage] Migrating pending logs to optimized list...");
    const keys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_PREFIX));
    const pendingKeys: string[] = [];

    for (const key of keys) {
        try {
            const val = localStorage.getItem(key);
            if (val) {
                const entry = JSON.parse(val) as LogEntry;
                if (!entry.synced) {
                    pendingKeys.push(key);
                }
            }
        } catch {
            // Ignore parse errors
        }
    }

    if (pendingKeys.length > 0) {
        const current = getPendingKeys();
        const combined = Array.from(new Set([...current, ...pendingKeys]));
        localStorage.setItem(PENDING_KEYS_LIST, JSON.stringify(combined));
    }

    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log(`[Storage] Migration complete. Found ${pendingKeys.length} pending logs.`);
};


export const saveLog = async (roadInfo: RoadInfo, coords: Coordinates, bearing: number, accuracy: number, cloudEnabled: boolean) => {
  const now = new Date();
  
  // 1. Timestamp-Based Organization: YYYY/MM/DD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePath = `${year}/${month}/${day}`;

  // 2. Geographic Tagging: Sanitize road name for folder usage
  const safeRoadName = roadInfo.roadName.replace(/[^a-z0-9]/gi, '_').substring(0, 30) || 'Unknown_Location';
  
  // 3. Metadata Integration
  const timestampISO = now.toISOString();
  const timeFileString = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const filename = `${timeFileString}_metadata.json`;
  
  const metadata: LogEntry = {
    filename: filename,
    path: `${STORAGE_PREFIX}/${datePath}/${safeRoadName}/`,
    timestamp: timestampISO,
    coordinates: coords,
    road_context: roadInfo.context,
    synced: false,
    gps_accuracy: accuracy,
    full_data: {
      ...roadInfo,
      telemetry: {
        bearing,
        gps_accuracy: accuracy,
        gps_timestamp: now.getTime()
      }
    }
  };

  const fullKey = `${metadata.path}${metadata.filename}`;
  
  // Step A: Save to IndexedDB (Logs Store)
  try {
    await idbSet(fullKey, metadata, LOGS_STORE_NAME);
    addPendingKey(fullKey);
    console.log(`[Storage] Saved to IDB: ${fullKey}`);
    localStorage.removeItem(LOG_COUNT_KEY); // Invalidate cache
  } catch (e) {
    console.error("[Storage] IDB Save Error", e);
    // Fallback to local storage? No, let's assume IDB works or fail gracefully.
    // If IDB fails, quota might be full there too.
    return false;
  }

  // Step B: Cloud Sync Strategy
  if (cloudEnabled && isAuthenticated()) {
    try {
        console.log("[Cloud] Attempting upload...");
        const driveId = await uploadToDrive(filename, JSON.stringify(metadata, null, 2), metadata.path);
        
        // Update local record to synced
        metadata.synced = true;
        metadata.driveId = driveId;
        await idbSet(fullKey, metadata, LOGS_STORE_NAME);
        // Remove from pending keys since it is now synced
        removePendingKey(fullKey);
        console.log(`[Cloud] Sync Successful: ${driveId}`);
    } catch (e) {
        console.error("[Cloud] Upload failed, data remains locally buffered.", e);
    }
  }

  return true;
};

export const syncPendingLogs = async () => {
  if (!isAuthenticated()) return 0;
  
  migratePendingKeys();

  let syncedCount = 0;
  const initialKeys = getPendingKeys();
  const keysToRemove = new Set<string>();

  for (const key of initialKeys) {
    try {
        let entry = await idbGet<LogEntry>(key, LOGS_STORE_NAME);

        // Fallback check in localStorage for legacy data
        if (!entry) {
            const val = localStorage.getItem(key);
            if (val) {
                 entry = JSON.parse(val);
            }
        }

        if (!entry) {
            keysToRemove.add(key);
            continue;
        }

        if (entry.synced) {
             keysToRemove.add(key);
             continue;
        }

        await uploadToDrive(entry.filename, JSON.stringify(entry, null, 2), entry.path);
        entry.synced = true;

        // Save updated status to IDB
        await idbSet(key, entry, LOGS_STORE_NAME);
        // Clean up legacy if it existed
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
        }

        keysToRemove.add(key);
        syncedCount++;
    } catch (e) {
        console.error("Sync retry failed for", key, e);
    }
  }

  if (keysToRemove.size > 0) {
      // Re-read current pending keys to handle any additions that happened during async ops
      const currentKeys = getPendingKeys();
      const newKeys = currentKeys.filter(key => !keysToRemove.has(key));
      localStorage.setItem(PENDING_KEYS_LIST, JSON.stringify(newKeys));
  }

  return syncedCount;
};

export const getStoredLogsCount = async (): Promise<number> => {
  const cachedCount = localStorage.getItem(LOG_COUNT_KEY);
  if (cachedCount !== null) {
    return parseInt(cachedCount, 10);
  }

  const keys = await idbGetAllKeys(LOGS_STORE_NAME);
  const count = keys.length;

  localStorage.setItem(LOG_COUNT_KEY, count.toString());
  return count;
};

export const clearLogs = async () => {
  await idbClear(LOGS_STORE_NAME);

  // Clean legacy
  Object.keys(localStorage)
    .filter(key => key.startsWith(STORAGE_PREFIX))
    .forEach(key => localStorage.removeItem(key));

  localStorage.removeItem(PENDING_KEYS_LIST);
  localStorage.removeItem(MIGRATION_KEY);
  localStorage.removeItem(LOG_COUNT_KEY);
};

export const exportData = async () => {
  const exportObj: Record<string, any> = {};
  
  const entries = await idbGetAll<LogEntry>(LOGS_STORE_NAME);

  for (const entry of entries) {
      if (!entry.path || !entry.filename) continue;

      const fullPath = entry.path + entry.filename;
      const pathParts = fullPath.split('/');

      let level = exportObj;
      pathParts.forEach((part, index) => {
          if (index === pathParts.length - 1) {
              level[part] = entry;
          } else {
              if (!level[part]) level[part] = {};
              level = level[part];
          }
      });
  }

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `Gemini_Data_Export_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};
