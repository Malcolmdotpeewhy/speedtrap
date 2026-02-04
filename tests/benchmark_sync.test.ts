
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncPendingLogs } from '../services/storageService';
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

describe('syncPendingLogs Performance', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('measures localStorage writes during batch sync', async () => {
        const itemCount = 50;
        const keys = Array.from({ length: itemCount }, (_, i) => `key_${i}`);

        localStorage.setItem('Gemini_Pending_Keys', JSON.stringify(keys));

        // Mock IDB to return unsynced entries
        (idb.idbGet as any).mockImplementation((key: string) => {
             return Promise.resolve({
                 filename: `${key}.json`,
                 path: 'path/',
                 synced: false
             });
        });

        (drive.isAuthenticated as any).mockReturnValue(true);
        (drive.uploadToDrive as any).mockResolvedValue('file_id');

        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

        const start = performance.now();
        await syncPendingLogs();
        const end = performance.now();

        // Currently, it writes to localStorage for every successful sync (removePendingKey)
        // plus potentially during migration checks (though migration happens once).
        // migration key setItem + (itemCount * removePendingKey calls)
        // Each removePendingKey calls setItem.

        const setItemCalls = setItemSpy.mock.calls.filter(call => call[0] === 'Gemini_Pending_Keys').length;

        console.log(`[Sync Benchmark] Items: ${itemCount}`);
        console.log(`[Sync Benchmark] Time: ${(end - start).toFixed(3)}ms`);
        console.log(`[Sync Benchmark] localStorage.setItem('Gemini_Pending_Keys') calls: ${setItemCalls}`);

        // In the optimized version, this should be roughly 1 (batch update at end)
        // Migration might add 1-2 calls if MIGRATION_KEY is missing.
        expect(setItemCalls).toBeLessThan(5);
    });
});
