
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrCreateFolder } from '../services/googleDriveService';

// Mock the window.gapi object
const mockList = vi.fn();
const mockCreate = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  if (typeof window !== 'undefined') {
    (window as any).gapi = {
      client: {
        drive: {
          files: {
            list: mockList,
            create: mockCreate
          }
        }
      }
    };
  } else {
    // Setup for jsdom environment if window global exists but typings are issues
    // or if we need to mock it on globalThis for node environment
    (global as any).window = {
        gapi: {
            client: {
                drive: {
                    files: {
                        list: mockList,
                        create: mockCreate
                    }
                }
            }
        }
    };
  }
});

describe('getOrCreateFolder Security', () => {
  it('should escape single quotes in folderName to prevent query injection', async () => {
    const folderName = "Sentinel's Log";
    mockList.mockResolvedValue({
      result: { files: [] } // No existing folder, so it will try to create one
    });
    mockCreate.mockResolvedValue({
      result: { id: 'new-folder-id' }
    });

    await getOrCreateFolder(folderName);

    // Check the query passed to list
    const listCall = mockList.mock.calls[0][0];
    const query = listCall.q;

    // Vulnerable expectation (current state): name='Sentinel's Log'
    // Secure expectation (after fix): name='Sentinel\'s Log'

    // We expect it to FAIL initially if we assert the secure version.
    // Or we can just log it to see what happens.
    console.log('Query:', query);

    // Let's assert the secure behavior we WANT.
    expect(query).toContain("name='Sentinel\\'s Log'");
  });
});
