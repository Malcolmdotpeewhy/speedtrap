
import { RoadInfo } from './geminiService';
import { Coordinates, LogEntry } from '../types';
import { uploadToDrive, isAuthenticated } from './googleDriveService';

const STORAGE_PREFIX = 'Gemini_API_Data';

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
        console.log(`[Cloud] Sync Successful: ${driveId}`);
    } catch (e) {
        console.error("[Cloud] Upload failed, data remains locally buffered.", e);
        // Data is already saved locally with synced: false, so it acts as the buffer.
    }
  }

  return true;
};

export const syncPendingLogs = async () => {
  if (!isAuthenticated()) return 0;
  
  let syncedCount = 0;
  const keys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_PREFIX));

  for (const key of keys) {
    try {
        const val = localStorage.getItem(key);
        if (val) {
            const entry = JSON.parse(val) as LogEntry;
            if (!entry.synced) {
                await uploadToDrive(entry.filename, JSON.stringify(entry, null, 2), entry.path);
                entry.synced = true;
                localStorage.setItem(key, JSON.stringify(entry));
                syncedCount++;
            }
        }
    } catch (e) {
        console.error("Sync retry failed for", key, e);
    }
  }
  return syncedCount;
};

export const getStoredLogsCount = (): number => {
  // Optimization: Object.keys() is often faster than repeated localStorage.key(i) calls
  // when we need to iterate over many keys.
  return Object.keys(localStorage).filter(key => key.startsWith(STORAGE_PREFIX)).length;
};

export const clearLogs = () => {
  // Optimization: Filter once and then remove.
  Object.keys(localStorage)
    .filter(key => key.startsWith(STORAGE_PREFIX))
    .forEach(key => localStorage.removeItem(key));
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
      } catch (e) {
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
