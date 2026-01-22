import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStoredLogsCount, saveLog, clearLogs } from '../services/storageService';
import { RoadInfo } from '../types';

describe('storageService', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('should calculate stored logs count correctly', () => {
        // Setup mock data
        localStorage.setItem('Gemini_API_Data/1', 'data');
        localStorage.setItem('Gemini_API_Data/2', 'data');
        localStorage.setItem('Other_Data', 'data');

        const count = getStoredLogsCount();
        expect(count).toBe(2);

        // Check caching
        expect(localStorage.getItem('Gemini_Logs_Count')).toBe('2');
    });

    it('should update log count when saving a log', async () => {
        // Initialize count
        localStorage.setItem('Gemini_Logs_Count', '10');

        const mockRoadInfo: RoadInfo = {
            limit: 50,
            roadName: 'Test Road',
            roadType: 'Street',
            policeDistrict: 'D1',
            context: 'Test Context',
            confidence: 'High',
            futureSegments: []
        };

        await saveLog(mockRoadInfo, { latitude: 0, longitude: 0 }, 0, 10, false);

        expect(localStorage.getItem('Gemini_Logs_Count')).toBe('11');
    });

    it('should clear logs and count', () => {
        localStorage.setItem('Gemini_API_Data/1', 'data');
        localStorage.setItem('Gemini_Logs_Count', '1');

        clearLogs();

        expect(localStorage.getItem('Gemini_API_Data/1')).toBeNull();
        expect(localStorage.getItem('Gemini_Logs_Count')).toBeNull();
    });
});
