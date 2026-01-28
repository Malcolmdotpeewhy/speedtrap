import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import SettingsPanel from '../components/SettingsPanel';
import * as AppProvider from '../contexts/AppProvider';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Cloud: () => <span data-testid="cloud-icon" />,
    Check: () => <span data-testid="check-icon" />,
    Trash2: () => <span data-testid="trash-icon" />,
}));

// Mock GlassButton
vi.mock('../components/GlassButton', () => ({
    default: ({ label, onClick, icon }: any) => (
        <button onClick={onClick} aria-label={label}>
            {icon}
            {label}
        </button>
    ),
}));

describe('SettingsPanel Sync Feedback', () => {
    const mockHandleManualSync = vi.fn();
    const defaultContext = {
        threshold: 5, setThreshold: vi.fn(),
        alertsEnabled: true, setAlertsEnabled: vi.fn(),
        chimesEnabled: true, setChimesEnabled: vi.fn(),
        loggingEnabled: true, setLoggingEnabled: vi.fn(),
        cloudEnabled: true, setCloudEnabled: vi.fn(),
        showPolice: true, setShowPolice: vi.fn(),
        showContext: true, setShowContext: vi.fn(),
        isGoogleSignedIn: true,
        googleUser: { name: 'Test User', email: 'test@example.com', picture: '' },
        isSyncing: false,
        handleManualSync: mockHandleManualSync,
        logCount: 10, setLogCount: vi.fn(),
        setShowSettings: vi.fn(),
        apiKey: 'test-key', setApiKey: vi.fn(),
        opacity: 0.8, setOpacity: vi.fn(),
        scale: 1, setScale: vi.fn(),
        clickThrough: false, setClickThrough: vi.fn(),
        isLocked: false, setIsLocked: vi.fn(),
        viewMode: 'full' as const,
    };

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('shows "Synced!" feedback after syncing completes', async () => {
        const useAppSpy = vi.spyOn(AppProvider, 'useApp');

        // 1. Initial State
        let currentContext = { ...defaultContext, isSyncing: false };
        useAppSpy.mockReturnValue(currentContext as any);

        const { rerender } = render(
            <SettingsPanel
                signInToDrive={vi.fn()}
                signOutDrive={vi.fn()}
                exportData={vi.fn()}
                clearLogs={vi.fn()}
            />
        );

        const syncButton = screen.getByText('Sync Now');
        expect(syncButton).toBeInTheDocument();

        // 2. Start Syncing
        fireEvent.click(syncButton);
        expect(mockHandleManualSync).toHaveBeenCalled();

        currentContext = { ...defaultContext, isSyncing: true };
        useAppSpy.mockReturnValue(currentContext as any);
        rerender(
            <SettingsPanel
                signInToDrive={vi.fn()}
                signOutDrive={vi.fn()}
                exportData={vi.fn()}
                clearLogs={vi.fn()}
            />
        );

        expect(screen.getByText('Syncing...')).toBeInTheDocument();

        // 3. Finish Syncing
        currentContext = { ...defaultContext, isSyncing: false };
        useAppSpy.mockReturnValue(currentContext as any);

        // Rerender triggers the effect
        rerender(
            <SettingsPanel
                signInToDrive={vi.fn()}
                signOutDrive={vi.fn()}
                exportData={vi.fn()}
                clearLogs={vi.fn()}
            />
        );

        // 4. Expect Success State
        // Use getByText since effect should have run synchronously with rerender/act
        expect(screen.getByText('Synced!')).toBeInTheDocument();

        // 5. Expect Revert to Idle after timeout
        act(() => {
            vi.advanceTimersByTime(2000);
        });

        expect(screen.getByText('Sync Now')).toBeInTheDocument();
    });
});
