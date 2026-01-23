
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { saveLog, syncPendingLogs, clearLogs, getStoredLogsCount } from '../services/storageService';
import * as idb from '../utils/indexedDB';
import * as drive from '../services/googleDriveService';

// Mock dependencies
vi.mock('../utils/indexedDB', () => ({
    idbSet: vi.fn(),
    idbGet: vi.fn(),
    idbGetAllKeys: vi.fn(),
    idbClear: vi.fn(),
    idbDel: vi.fn(),
    LOGS_STORE_NAME: 'logs'
}));

vi.mock('../services/googleDriveService', () => ({
    uploadToDrive: vi.fn(),
    isAuthenticated: vi.fn()
}));

describe('storageService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('saveLog saves to IndexedDB and pending keys in localStorage', async () => {
        const roadInfo: any = { roadName: 'Test Road', context: 'Test' };
        const coords = { latitude: 10, longitude: 10 };

        // Mock successful IDB set
        (idb.idbSet as any).mockResolvedValue(undefined);

        await saveLog(roadInfo, coords, 0, 10, false);

        expect(idb.idbSet).toHaveBeenCalledWith(expect.stringContaining('Test_Road'), expect.any(Object), 'logs');

        // Check localStorage for pending keys
        const pending = JSON.parse(localStorage.getItem('Gemini_Pending_Keys') || '[]');
        expect(pending.length).toBe(1);
        expect(pending[0]).toContain('Test_Road');
    });

    it('syncPendingLogs uploads pending logs and updates IDB', async () => {
        // Setup pending key
        const key = 'Gemini_API_Data/2023/10/10/Test_Road/log.json';
        localStorage.setItem('Gemini_Pending_Keys', JSON.stringify([key]));

        // Mock IDB get to return log entry
        const logEntry = {
            filename: 'log.json',
            path: 'path/to/log',
            synced: false
        };
        (idb.idbGet as any).mockResolvedValue(logEntry);

        // Mock Drive auth and upload
        (drive.isAuthenticated as any).mockReturnValue(true);
        (drive.uploadToDrive as any).mockResolvedValue('file_id_123');

        const count = await syncPendingLogs();

        expect(count).toBe(1);
        expect(drive.uploadToDrive).toHaveBeenCalled();

        // Verify IDB update (synced = true)
        expect(idb.idbSet).toHaveBeenCalledWith(key, expect.objectContaining({ synced: true }), 'logs');

        // Verify pending key removed
        const pending = JSON.parse(localStorage.getItem('Gemini_Pending_Keys') || '[]');
        expect(pending.length).toBe(0);
    });

    it('clearLogs clears IDB and localStorage', async () => {
        await clearLogs();
        expect(idb.idbClear).toHaveBeenCalledWith('logs');
        expect(localStorage.getItem('Gemini_Pending_Keys')).toBeNull();
    });

    it('getStoredLogsCount counts keys from IDB', async () => {
        (idb.idbGetAllKeys as any).mockResolvedValue(['key1', 'key2']);
        const count = await getStoredLogsCount();
        expect(count).toBe(2);
    });
});
