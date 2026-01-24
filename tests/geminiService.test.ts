import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSpeedLimitAtLocation, resetAI } from '../services/geminiService';

// Mock dependencies
const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn(function() {
      return {
        models: {
          generateContent: mockGenerateContent
        }
      };
    })
  };
});

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAI();
    localStorage.setItem('gemini_api_key', 'test-key');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should parse valid JSON response', async () => {
    const mockResponse = {
      text: JSON.stringify({
        limit: 45,
        roadName: 'Test Road',
        roadType: 'Highway',
        policeDistrict: 'D1',
        why: 'Test Context',
        futureSegments: []
      })
    };
    mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await getSpeedLimitAtLocation(10, 10, 0);

    expect(result.limit).toBe(45);
    expect(result.roadName).toBe('Test Road');
  });

  it('should handle malformed JSON gracefully', async () => {
    const mockResponse = {
      text: "Invalid JSON"
    };
    mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await getSpeedLimitAtLocation(10, 10, 0);

    expect(result.limit).toBeNull();
    // Default fallback values
    expect(result.roadName).toBe("Identifying Road");
  });

  it('should parse JSON wrapped in markdown code blocks with extra text', async () => {
    const mockResponse = {
      text: "Here is the data you requested:\n```json\n{\n\"limit\": 65,\n\"roadName\": \"Interstate 5\",\n\"roadType\": \"Freeway\",\n\"policeDistrict\": \"D2\",\n\"why\": \"Verified\",\n\"futureSegments\": []\n}\n```\nHope this helps!"
    };
    mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await getSpeedLimitAtLocation(10, 10, 0);

    expect(result.limit).toBe(65);
    expect(result.roadName).toBe('Interstate 5');
  });

  it('should handle API missing key', async () => {
    localStorage.removeItem('gemini_api_key');
    // Also ensure import.meta.env is not providing a key in the test environment if possible,
    // but typically it requires more setup to mock import.meta.
    // However, if the code checks localStorage first and finds null, then checks env...
    // If env is empty (default in test), it should fail.

    // We can spy on console.warn to suppress it
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await getSpeedLimitAtLocation(10, 10, 0);

    expect(result.roadName).toBe("Sync Failed");
    consoleSpy.mockRestore();
  });
});
