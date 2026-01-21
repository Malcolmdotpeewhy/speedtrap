import React, { Suspense, useEffect, useState } from 'react';
import { AppProvider, useApp } from './contexts/AppProvider';
import { initGoogleDrive, subscribeToAuthStatus, getCurrentUser, GoogleUser, signInToDrive, signOutDrive } from './services/googleDriveService';
import { clearLogs as clearStorageLogs, syncPendingLogs, exportData } from './services/storageService';
import LoadingScreen from './components/LoadingScreen';

// Lazy Components
const DashboardView = React.lazy(() => import('./components/DashboardView'));
const WidgetView = React.lazy(() => import('./components/WidgetView'));
const SettingsPanel = React.lazy(() => import('./components/SettingsPanel'));

const AppContent: React.FC = () => {
    const { viewMode, showSettings, setLogCount } = useApp();
    
    return (
        <Suspense fallback={<LoadingScreen />}>
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
