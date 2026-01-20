import React, { Suspense, useEffect, useState } from 'react';
import { AppProvider, useApp } from './contexts/AppProvider';
import { initGoogleDrive, subscribeToAuthStatus, getCurrentUser, GoogleUser, signInToDrive, signOutDrive, syncPendingLogs, exportData, clearLogs, getStoredLogsCount } from './services/googleDriveService';
import { clearLogs as clearStorageLogs, getStoredLogsCount as getLocalLogCount } from './services/storageService';

// Lazy Components
const DashboardView = React.lazy(() => import('./components/DashboardView'));
const WidgetView = React.lazy(() => import('./components/WidgetView'));
const SettingsPanel = React.lazy(() => import('./components/SettingsPanel'));

const AppContent: React.FC = () => {
    const { viewMode, showSettings, isSyncing, handleManualSync, isGoogleSignedIn, googleUser, setLogCount } = useApp();
    
    // Wire up storage service functions to AppProvider context
    // The SettingsPanel expects these as props or gets them from context.
    // In our refactor, we made SettingsPanel use Context, but some actions like sign-in/out are external services.
    // Ideally, we wrap these in the Provider or pass them.
    // In the current `SettingsPanel` implementation (Step 7), it uses `useApp()` to get state,
    // but receives actions like `signInToDrive` as props? No, wait.
    // Let's re-check `SettingsPanel.tsx`.
    // It imports `signInToDrive`, `signOutDrive` via props interface `SettingsPanelProps`.
    // BUT the refactored code (in Step 7 content) also extracts them from `useApp`?
    // Looking at Step 7 `write_file` content:
    // It defines `SettingsPanelProps` with functions.
    // It destructures state from `useApp`.
    // It destructures functions from `props`.
    // So we need to pass these functions to `SettingsPanel`.

    return (
        <Suspense fallback={
            <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="font-black text-2xl tracking-tighter italic animate-pulse">
                DRIVE<span className="text-blue-500">PRO</span>
              </div>
            </div>
        }>
            {viewMode === 'widget' ? <WidgetView /> : <DashboardView />}

            {showSettings && (
                <SettingsPanel
                    signInToDrive={signInToDrive}
                    signOutDrive={signOutDrive}
                    exportData={exportData}
                    clearLogs={() => {
                        clearStorageLogs();
                        setLogCount(0);
                    }}
                />
            )}
        </Suspense>
    );
};

const App: React.FC = () => {
    const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
    const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        initGoogleDrive();
        const unsubscribe = subscribeToAuthStatus((isAuth) => {
            setIsGoogleSignedIn(isAuth);
            setGoogleUser(getCurrentUser());
        });
        return () => unsubscribe();
    }, []);

    const handleManualSyncWrapper = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        await syncPendingLogs();
        setIsSyncing(false);
    };

    return (
        <AppProvider
            isGoogleSignedIn={isGoogleSignedIn}
            googleUser={googleUser}
            isSyncing={isSyncing}
            handleManualSync={handleManualSyncWrapper}
        >
            <AppContent />
        </AppProvider>
    );
};

export default App;
