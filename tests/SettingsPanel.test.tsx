import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, Mock } from 'vitest';
import SettingsPanel from '../components/SettingsPanel';
import * as AppProvider from '../contexts/AppProvider';

// Mock useApp
vi.mock('../contexts/AppProvider', () => ({
  useApp: vi.fn(),
}));

const mockContext = {
  threshold: 5, setThreshold: vi.fn(),
  alertsEnabled: true, setAlertsEnabled: vi.fn(),
  chimesEnabled: true, setChimesEnabled: vi.fn(),
  loggingEnabled: true, setLoggingEnabled: vi.fn(),
  cloudEnabled: true, setCloudEnabled: vi.fn(),
  showPolice: true, setShowPolice: vi.fn(),
  showContext: true, setShowContext: vi.fn(),
  opacity: 1, setOpacity: vi.fn(),
  scale: 1, setScale: vi.fn(),
  clickThrough: false, setClickThrough: vi.fn(),
  isLocked: false, setIsLocked: vi.fn(),
  viewMode: 'full',
  isGoogleSignedIn: false,
  googleUser: null,
  isSyncing: false,
  handleManualSync: vi.fn(),
  logCount: 100, setLogCount: vi.fn(),
  setShowSettings: vi.fn(),
  apiKey: 'test-api-key', setApiKey: vi.fn(),
};

describe('SettingsPanel Accessibility', () => {
  it('renders API Key input associated with its label', () => {
    (AppProvider.useApp as Mock).mockReturnValue(mockContext);

    render(
      <SettingsPanel
        signInToDrive={vi.fn()}
        signOutDrive={vi.fn()}
        exportData={vi.fn()}
        clearLogs={vi.fn()}
      />
    );

    // This checks if the input is accessible via its label
    const input = screen.getByLabelText(/Gemini API Key/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'password');
  });

  it('toggles API key visibility', () => {
    (AppProvider.useApp as Mock).mockReturnValue(mockContext);

    render(
      <SettingsPanel
        signInToDrive={vi.fn()}
        signOutDrive={vi.fn()}
        exportData={vi.fn()}
        clearLogs={vi.fn()}
      />
    );

    const input = screen.getByLabelText(/Gemini API Key/i);
    const toggleBtn = screen.getByLabelText(/Show API Key/i);

    // Initial state: password
    expect(input).toHaveAttribute('type', 'password');

    // Click toggle
    fireEvent.click(toggleBtn);

    // Now state: text
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText(/Hide API Key/i)).toBeInTheDocument();

    // Click toggle again
    fireEvent.click(toggleBtn);

    // Back to password
    expect(input).toHaveAttribute('type', 'password');
  });
});
