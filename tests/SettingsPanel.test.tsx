import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, type Mock } from 'vitest';
import React from 'react';
import SettingsPanel from '../components/SettingsPanel';
import * as AppContext from '../contexts/AppProvider';

// Mock the context
vi.mock('../contexts/AppProvider', () => ({
    useApp: vi.fn(),
}));

describe('SettingsPanel', () => {
    const mockUseApp = {
        threshold: 5, setThreshold: vi.fn(),
        alertsEnabled: true, setAlertsEnabled: vi.fn(),
        chimesEnabled: true, setChimesEnabled: vi.fn(),
        loggingEnabled: true, setLoggingEnabled: vi.fn(),
        cloudEnabled: true, setCloudEnabled: vi.fn(),
        showPolice: true, setShowPolice: vi.fn(),
        showContext: true, setShowContext: vi.fn(),
        isGoogleSignedIn: false, googleUser: null,
        isSyncing: false, handleManualSync: vi.fn(),
        logCount: 100, setLogCount: vi.fn(),
        setShowSettings: vi.fn(),
        apiKey: 'test-api-key', setApiKey: vi.fn(),
        opacity: 0.8, setOpacity: vi.fn(),
        scale: 1, setScale: vi.fn(),
        clickThrough: false, setClickThrough: vi.fn(),
        isLocked: false, setIsLocked: vi.fn(),
        viewMode: 'full'
    };

    it('renders API Key input with proper accessibility and visibility toggle', () => {
        (AppContext.useApp as Mock).mockReturnValue(mockUseApp);

        render(
            <SettingsPanel
                signInToDrive={vi.fn()}
                signOutDrive={vi.fn()}
                exportData={vi.fn()}
                clearLogs={vi.fn()}
            />
        );

        // Check for Label association
        // This will fail if the label is not associated with the input via htmlFor/id
        const input = screen.getByLabelText(/Gemini API Key/i);
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('type', 'password');
        expect(input).toHaveValue('test-api-key');

        // Check for Visibility Toggle
        // This will fail if the button doesn't exist
        const toggleBtn = screen.getByLabelText(/Show API Key/i);
        expect(toggleBtn).toBeInTheDocument();

        // Toggle visibility
        fireEvent.click(toggleBtn);
        expect(input).toHaveAttribute('type', 'text');
        expect(screen.getByLabelText(/Hide API Key/i)).toBeInTheDocument();

        // Toggle back
        fireEvent.click(screen.getByLabelText(/Hide API Key/i));
        expect(input).toHaveAttribute('type', 'password');
    });
});
