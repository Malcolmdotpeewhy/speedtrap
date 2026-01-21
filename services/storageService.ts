
import { RoadInfo } from './geminiService';
import { Coordinates, LogEntry } from '../types';
import { uploadToDrive, isAuthenticated } from './googleDriveService';

const STORAGE_PREFIX = 'Gemini_API_Data';
const PENDING_KEYS_LIST = 'Gemini_Pending_Keys';
const MIGRATION_KEY = 'Gemini_Migration_V1_Done';

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
  let keys = getPendingKeys();
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
        } catch {}
    }

    if (pendingKeys.length > 0) {
        // Merge with existing if any (unlikely if migration hasn't run, but safe)
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
  
  // Step A: Immediate Local Fallback (Always save locally first)
  try {
    localStorage.setItem(fullKey, JSON.stringify(metadata));
    // Default to adding to pending keys. We remove it later if sync succeeds.
    // This is safer than adding it only on failure, in case the process crashes before sync finishes.
    addPendingKey(fullKey);
    console.log(`[Storage] Saved locally to ${fullKey}`);
  } catch (e) {
    console.error("[Storage] Local Quota exceeded", e);
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
        localStorage.setItem(fullKey, JSON.stringify(metadata));
        // Remove from pending keys since it is now synced
        removePendingKey(fullKey);
        console.log(`[Cloud] Sync Successful: ${driveId}`);
    } catch (e) {
        console.error("[Cloud] Upload failed, data remains locally buffered.", e);
        // Data is already saved locally with synced: false and in pending keys.
    }
  }

  return true;
};

export const syncPendingLogs = async () => {
  if (!isAuthenticated()) return 0;
  
  // Ensure we have migrated old logs if necessary
  migratePendingKeys();

  let syncedCount = 0;
  // Use the optimized list
  const keys = getPendingKeys();

  for (const key of keys) {
    try {
        const val = localStorage.getItem(key);
        // If key doesn't exist anymore, remove it from pending list
        if (!val) {
            removePendingKey(key);
            continue;
        }

        const entry = JSON.parse(val) as LogEntry;

        // Double check synced status (in case it was updated elsewhere)
        if (entry.synced) {
             removePendingKey(key);
             continue;
        }

        await uploadToDrive(entry.filename, JSON.stringify(entry, null, 2), entry.path);
        entry.synced = true;
        localStorage.setItem(key, JSON.stringify(entry));
        removePendingKey(key);
        syncedCount++;
    } catch (e) {
        console.error("Sync retry failed for", key, e);
    }
  }
  return syncedCount;
};

export const getStoredLogsCount = (): number => {
  const cachedCount = localStorage.getItem(LOG_COUNT_KEY);
  if (cachedCount !== null) {
    return parseInt(cachedCount, 10);
  }

  // Optimization: Object.keys() is often faster than repeated localStorage.key(i) calls
  // when we need to iterate over many keys.
  const count = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_PREFIX)).length;

  localStorage.setItem(LOG_COUNT_KEY, count.toString());
  return count;
};

export const clearLogs = () => {
  // Optimization: Filter once and then remove.
  Object.keys(localStorage)
    .filter(key => key.startsWith(STORAGE_PREFIX))
    .forEach(key => localStorage.removeItem(key));

  // Also clear pending keys list
  localStorage.removeItem(PENDING_KEYS_LIST);
  localStorage.removeItem(MIGRATION_KEY);
};

export const exportData = () => {
  const exportObj: Record<string, any> = {};
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      try {
        const val = localStorage.getItem(key);
        if (val) {
          const parts = key.split('/');
          let currentLevel = exportObj;
          
          parts.forEach((part, index) => {
            if (index === parts.length - 1) {
              currentLevel[part] = JSON.parse(val);
            } else {
              if (!currentLevel[part]) {
                currentLevel[part] = {};
              }
              currentLevel = currentLevel[part];
            }
          });
        }
      } catch {
        console.error("Error exporting key", key);
      }
    }
  }

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `Gemini_Data_Export_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};
