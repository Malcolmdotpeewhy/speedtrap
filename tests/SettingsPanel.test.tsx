import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SettingsPanel from '../components/SettingsPanel';
import React from 'react';

// Mock useApp
vi.mock('../contexts/AppProvider', () => ({
  useApp: () => ({
    threshold: 5, setThreshold: vi.fn(),
    alertsEnabled: true, setAlertsEnabled: vi.fn(),
    chimesEnabled: true, setChimesEnabled: vi.fn(),
    loggingEnabled: false, setLoggingEnabled: vi.fn(),
    cloudEnabled: false, setCloudEnabled: vi.fn(),
    showPolice: false, setShowPolice: vi.fn(),
    showContext: false, setShowContext: vi.fn(),
    isGoogleSignedIn: false, googleUser: null,
    isSyncing: false, handleManualSync: vi.fn(),
    logCount: 0, setLogCount: vi.fn(),
    setShowSettings: vi.fn(),
    apiKey: '', setApiKey: vi.fn(),
    opacity: 0.8, setOpacity: vi.fn(),
    scale: 1, setScale: vi.fn(),
    clickThrough: false, setClickThrough: vi.fn(),
    isLocked: false, setIsLocked: vi.fn(),
    viewMode: 'full'
  })
}));

describe('SettingsPanel', () => {
  it('renders accessibility inputs correctly', () => {
    render(
      <SettingsPanel
        signInToDrive={vi.fn()}
        signOutDrive={vi.fn()}
        exportData={vi.fn()}
        clearLogs={vi.fn()}
      />
    );

    // This check is expected to FAIL initially because there is no ID association
    const apiKeyInput = screen.getByLabelText('Gemini API Key');
    expect(apiKeyInput).toBeInTheDocument();

    // Also check attributes
    expect(apiKeyInput).toHaveAttribute('type', 'password');
  });
});
