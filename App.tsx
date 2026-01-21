import React, { Suspense, useEffect, useState } from 'react';
import { AppProvider, useApp } from './contexts/AppProvider';
import { initGoogleDrive, subscribeToAuthStatus, getCurrentUser, GoogleUser, signInToDrive, signOutDrive } from './services/googleDriveService';
import { clearLogs as clearStorageLogs, syncPendingLogs, exportData } from './services/storageService';

// Lazy Components
const DashboardView = React.lazy(() => import('./components/DashboardView'));
const WidgetView = React.lazy(() => import('./components/WidgetView'));
const SettingsPanel = React.lazy(() => import('./components/SettingsPanel'));

const AppContent: React.FC = () => {
    const { viewMode, showSettings, setLogCount } = useApp();
    
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
