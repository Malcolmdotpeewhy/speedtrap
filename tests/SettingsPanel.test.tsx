import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import SettingsPanel from '../components/SettingsPanel';
import * as AppProvider from '../contexts/AppProvider';

// Mock the useApp hook
vi.mock('../contexts/AppProvider', () => ({
  useApp: vi.fn(),
}));

describe('SettingsPanel - Clear Logs Interaction', () => {
  const mockClearLogs = vi.fn();
  const mockSetLogCount = vi.fn();

  // Default mock values for useApp to prevent destructuring errors
  const defaultContextValues = {
    threshold: 5, setThreshold: vi.fn(),
    alertsEnabled: true, setAlertsEnabled: vi.fn(),
    chimesEnabled: true, setChimesEnabled: vi.fn(),
    loggingEnabled: true, setLoggingEnabled: vi.fn(), // Must be true to show Clear button
    cloudEnabled: false, setCloudEnabled: vi.fn(),
    showPolice: false, setShowPolice: vi.fn(),
    showContext: false, setShowContext: vi.fn(),
    isGoogleSignedIn: false, googleUser: null,
    isSyncing: false, handleManualSync: vi.fn(),
    logCount: 100, setLogCount: mockSetLogCount,
    setShowSettings: vi.fn(),
    apiKey: '', setApiKey: vi.fn(),
    opacity: 1, setOpacity: vi.fn(),
    scale: 1, setScale: vi.fn(),
    clickThrough: false, setClickThrough: vi.fn(),
    isLocked: false, setIsLocked: vi.fn(),
    viewMode: 'full',
  };

  beforeEach(() => {
    vi.useFakeTimers();
    (AppProvider.useApp as any).mockReturnValue(defaultContextValues);
    mockClearLogs.mockClear();
    mockSetLogCount.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders "Clear" button initially', () => {
    render(
      <SettingsPanel
        signInToDrive={vi.fn()}
        signOutDrive={vi.fn()}
        exportData={vi.fn()}
        clearLogs={mockClearLogs}
      />
    );

    const button = screen.getByText('Clear');
    expect(button).toBeInTheDocument();
    // Check for default style class (approximate check)
    expect(button.className).toContain('bg-red-900/50');
  });

  it('changes text to "Confirm?" on first click and does NOT call clearLogs', () => {
    render(
      <SettingsPanel
        signInToDrive={vi.fn()}
        signOutDrive={vi.fn()}
        exportData={vi.fn()}
        clearLogs={mockClearLogs}
      />
    );

    const button = screen.getByText('Clear');
    fireEvent.click(button);

    expect(screen.getByText('Confirm?')).toBeInTheDocument();
    expect(mockClearLogs).not.toHaveBeenCalled();
    // Check for active style class
    expect(button.className).toContain('bg-red-600');
  });

  it('calls clearLogs and setLogCount on second click', () => {
    render(
      <SettingsPanel
        signInToDrive={vi.fn()}
        signOutDrive={vi.fn()}
        exportData={vi.fn()}
        clearLogs={mockClearLogs}
      />
    );

    const button = screen.getByText('Clear');
    fireEvent.click(button); // First click -> Confirm?

    const confirmButton = screen.getByText('Confirm?');
    fireEvent.click(confirmButton); // Second click -> Action

    expect(mockClearLogs).toHaveBeenCalledTimes(1);
    expect(mockSetLogCount).toHaveBeenCalledWith(0);

    // Should reset to Clear immediately (logic says setConfirmClear(false))
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('resets to "Clear" after 3 seconds timeout', () => {
    render(
      <SettingsPanel
        signInToDrive={vi.fn()}
        signOutDrive={vi.fn()}
        exportData={vi.fn()}
        clearLogs={mockClearLogs}
      />
    );

    const button = screen.getByText('Clear');
    fireEvent.click(button);
    expect(screen.getByText('Confirm?')).toBeInTheDocument();

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(mockClearLogs).not.toHaveBeenCalled();
  });
});
