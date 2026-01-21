import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSpeedLimitAtLocation, resetAI } from '../services/geminiService';
import { GoogleGenAI } from '@google/genai';

const mockGetItem = vi.fn();

// The class mock needs to look like a class constructor
vi.mock('@google/genai', () => {
    const MockGoogleGenAI = vi.fn();
    MockGoogleGenAI.prototype.models = {
        generateContent: vi.fn()
    };
    return {
        GoogleGenAI: MockGoogleGenAI
    }
});

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAI(); // Reset the cached AI instance

    // Mock localStorage
    if (typeof window !== 'undefined') {
        Object.defineProperty(window, 'localStorage', {
        value: {
            getItem: mockGetItem,
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
        },
        writable: true
        });
    } else {
        (global as any).localStorage = {
            getItem: mockGetItem,
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
        };
    }
  });

  it('should return default offline object if API key is missing', async () => {
    mockGetItem.mockReturnValue(null);
    // @ts-ignore - we are testing behavior when env is undefined
    import.meta.env.VITE_GEMINI_API_KEY = undefined;

    // It throws API_KEY_MISSING which is caught and returns offline object
    const result = await getSpeedLimitAtLocation(0, 0, 0);
    expect(result.roadType).toBe('Offline');
    expect(result.limit).toBeNull();
  });

  it('should parse valid response correctly', async () => {
    mockGetItem.mockReturnValue('fake-key');

    // Grab the mock instance from the module to access its method mock
    // Since we can't easily access the instance created inside the service,
    // we rely on the fact that GoogleGenAI is a mock class and we can spy on its prototype?
    // Actually, `vi.mock` factory above sets the prototype.

    // Let's get the generateContent mock
    // @ts-ignore
    const mockGenerateContent = new GoogleGenAI({ apiKey: 'test' }).models.generateContent;

    mockGenerateContent.mockResolvedValue({
        text: `
          LIMIT: 65
          ROAD: I-5 North
          TYPE: Highway
          POLICE: CHP
          WHY: Verified via maps.
          PATH_AHEAD: 5.2:55
        `
    });

    const result = await getSpeedLimitAtLocation(34.0522, -118.2437, 0);
    expect(result.limit).toBe(65);
    expect(result.roadName).toBe('I-5 North');
    expect(result.policeDistrict).toBe('CHP');
    expect(result.futureSegments).toHaveLength(1);
    expect(result.futureSegments[0].distanceMiles).toBe(5.2);
    expect(result.futureSegments[0].limit).toBe(55);
  });

  it('should handle quota exceeded error', async () => {
     mockGetItem.mockReturnValue('fake-key');
     // @ts-ignore
     const mockGenerateContent = new GoogleGenAI({ apiKey: 'test' }).models.generateContent;

     mockGenerateContent.mockRejectedValue({
         status: 429,
         message: "Quota exceeded"
     });

     try {
        await getSpeedLimitAtLocation(0, 0, 0);
     } catch(e: any) {
         expect(e.message).toBe("QUOTA_EXCEEDED");
     }
  });
});
