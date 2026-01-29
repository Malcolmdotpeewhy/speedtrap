import React, { useState } from 'react';
import { useApp } from '../contexts/AppProvider';
import { Cloud, Check } from 'lucide-react';
import GlassButton from './GlassButton';

// "Palette" requirement: 44x44px touch targets.
// "UX" requirement: Clear focus rings.
// "UX" requirement: Micro-feedback.

// Helper Component for Toggle with Feedback
const Toggle: React.FC<{
    label: string;
    checked: boolean;
    onChange: (val: boolean) => void;
    description?: string;
    ariaLabel?: string;
}> = ({ label, checked, onChange, description, ariaLabel }) => {
    const [justChanged, setJustChanged] = useState(false);

    const handleClick = () => {
        onChange(!checked);
        setJustChanged(true);
        setTimeout(() => setJustChanged(false), 800);
    };

    return (
        <button
            onClick={handleClick}
            className="w-full flex items-center justify-between p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel || `Toggle ${label}`}
        >
            <div className="flex flex-col items-start text-left">
                <span className="font-bold text-slate-200">{label}</span>
                {description && <span className="text-xs text-slate-500">{description}</span>}
            </div>
            <div className="flex items-center gap-2">
                 {justChanged && <span className="text-[10px] font-bold text-emerald-400 uppercase animate-fade-in-out">Saved</span>}
                 <div className={`w-12 h-7 rounded-full transition-colors relative ${checked ? 'bg-blue-600' : 'bg-slate-600'}`}>
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${checked ? 'left-6' : 'left-1'}`} />
                 </div>
            </div>
        </button>
    );
};

interface SettingsPanelProps {
    signInToDrive: () => void;
    signOutDrive: () => void;
    exportData: () => void;
    clearLogs: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
    signInToDrive, signOutDrive, exportData, clearLogs
}) => {
    const {
        threshold, setThreshold,
        alertsEnabled, setAlertsEnabled,
        chimesEnabled, setChimesEnabled,
        loggingEnabled, setLoggingEnabled,
        cloudEnabled, setCloudEnabled,
        showPolice, setShowPolice,
        showContext, setShowContext,
        isGoogleSignedIn, googleUser,
        isSyncing, handleManualSync,
        logCount, setLogCount,
        setShowSettings,
        apiKey, setApiKey,
        // Widget specific
        opacity, setOpacity,
        scale, setScale,
        clickThrough, setClickThrough,
        isLocked, setIsLocked,
        viewMode
    } = useApp();

    const [exportState, setExportState] = useState<'idle' | 'success'>('idle');
    const [syncState, setSyncState] = useState<'idle' | 'success'>('idle');

    const handleExport = async () => {
        await exportData();
        setExportState('success');
        setTimeout(() => setExportState('idle'), 2000);
    };

    const handleSyncClick = async () => {
        await handleManualSync();
        setSyncState('success');
        setTimeout(() => setSyncState('idle'), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex justify-end animate-fade-in">
            <div className="w-full max-w-md h-full bg-slate-900 border-l border-white/10 shadow-2xl overflow-y-auto pb-10">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900/95 backdrop-blur z-10 border-b border-white/5 p-4 flex items-center justify-between">
                    <h2 className="text-xl font-black italic tracking-tighter text-white">SYSTEM<span className="text-blue-500">CONFIG</span></h2>
                    <GlassButton
                        onClick={() => setShowSettings(false)}
                        label="Close Settings"
                        className="rounded-full bg-slate-800 hover:bg-slate-700 border-none"
                        icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>}
                    />
                </div>

                <div className="p-6 space-y-8">

                    {/* Alerts Section */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Alerts & Feedback</h3>

                        <div className="p-4 bg-slate-800/50 rounded-xl">
                            <label className="block text-sm font-bold text-slate-300 mb-2">Speed Threshold (+{threshold} mph)</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="0" max="15" step="1"
                                    value={threshold}
                                    onChange={(e) => setThreshold(Number(e.target.value))}
                                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 min-h-[44px]"
                                    aria-label="Adjust Speed Threshold"
                                />
                                <span className="text-xl font-mono font-bold text-blue-400 w-8 text-center">{threshold}</span>
                            </div>
                        </div>

                        <Toggle
                            label="Audio Alerts"
                            checked={alertsEnabled}
                            onChange={setAlertsEnabled}
                            description="Beep when speeding"
                        />
                        <Toggle
                            label="Milestone Chimes"
                            checked={chimesEnabled}
                            onChange={setChimesEnabled}
                            description="Chime on limit change"
                        />
                    </section>

                    {/* Display Section */}
                    <section className="space-y-4">
                         <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Display & Intelligence</h3>
                         <Toggle
                            label="Police Districts"
                            checked={showPolice}
                            onChange={setShowPolice}
                            description="Show local jurisdiction"
                        />
                         <Toggle
                            label="Context Engine"
                            checked={showContext}
                            onChange={setShowContext}
                            description="Show reasoning for speed limit"
                        />
                    </section>

                    {/* Widget Specific */}
                    {viewMode === 'widget' && (
                        <section className="space-y-4 border-t border-white/5 pt-6">
                            <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">Widget Configuration</h3>

                            <div className="space-y-4 p-4 bg-blue-900/10 rounded-xl border border-blue-500/20">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2">Opacity ({Math.round(opacity * 100)}%)</label>
                                    <input
                                        type="range" min="0.2" max="1" step="0.1"
                                        value={opacity}
                                        onChange={(e) => setOpacity(Number(e.target.value))}
                                        className="w-full accent-blue-500 min-h-[44px]"
                                        aria-label="Widget Opacity"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2">Scale ({scale}x)</label>
                                    <input
                                        type="range" min="0.5" max="1.5" step="0.1"
                                        value={scale}
                                        onChange={(e) => setScale(Number(e.target.value))}
                                        className="w-full accent-blue-500 min-h-[44px]"
                                        aria-label="Widget Scale"
                                    />
                                </div>
                                <Toggle
                                    label="Lock Position"
                                    checked={isLocked}
                                    onChange={setIsLocked}
                                    description="Prevent dragging"
                                />
                                <Toggle
                                    label="Click-Through"
                                    checked={clickThrough}
                                    onChange={setClickThrough}
                                    description="Ignore touches (Control via Dashboard)"
                                />
                            </div>
                        </section>
                    )}

                    {/* API Configuration */}
                    <section className="space-y-4 border-t border-white/5 pt-6">
                        <h3 className="text-xs font-black text-purple-500 uppercase tracking-widest mb-2">API Configuration</h3>
                        <div className="p-4 bg-slate-800/50 rounded-xl space-y-2">
                            <label className="block text-sm font-bold text-slate-300">Gemini API Key</label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter your Gemini API Key"
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 focus:border-blue-500 focus:outline-none min-h-[44px]"
                            />
                            <p className="text-[10px] text-slate-500">
                                Required for Speed Limits & Road Info. Your key is stored locally on this device.
                            </p>
                        </div>
                    </section>

                    {/* Data Section */}
                    <section className="space-y-4 border-t border-white/5 pt-6">
                        <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">Data & Cloud</h3>

                        <Toggle
                            label="Data Logging"
                            checked={loggingEnabled}
                            onChange={setLoggingEnabled}
                            description="Record telemetry locally"
                        />

                        {loggingEnabled && (
                            <>
                                <div className="p-4 bg-slate-800 rounded-xl space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-300">Logged Points</span>
                                        <span className="text-emerald-400 font-mono font-bold">{logCount}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleExport}
                                            className={`flex-1 text-white text-xs font-bold py-3 rounded-lg min-h-[44px] transition-all duration-300 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                                                exportState === 'success' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-700 hover:bg-slate-600'
                                            }`}
                                        >
                                            {exportState === 'success' ? (
                                                <>
                                                    <Check className="w-4 h-4" aria-hidden="true" />
                                                    <span>Exported!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Export JSON</span>
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if(confirm('Clear all logs?')) {
                                                    clearLogs();
                                                    setLogCount(0);
                                                }
                                            }}
                                            className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-200 text-xs font-bold py-3 rounded-lg min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-800 rounded-xl space-y-4">
                                     <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-200">Google Drive Sync</span>
                                        <Toggle
                                            label=""
                                            checked={cloudEnabled}
                                            onChange={setCloudEnabled}
                                            ariaLabel="Google Drive Sync"
                                        />
                                     </div>

                                     {cloudEnabled && (
                                         <div className="space-y-3 pt-2 border-t border-white/5">
                                             {!isGoogleSignedIn ? (
                                                 <button
                                                    onClick={signInToDrive}
                                                    className="w-full bg-white text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                                 >
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" /></svg>
                                                    Sign In
                                                 </button>
                                             ) : (
                                                 <div className="space-y-3">
                                                     <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-lg">
                                                         {googleUser?.picture && (
                                                             <img src={googleUser.picture} alt="Profile" className="w-8 h-8 rounded-full" />
                                                         )}
                                                         <div className="flex-1 min-w-0">
                                                             <div className="text-sm font-bold truncate">{googleUser?.name}</div>
                                                             <div className="text-[10px] text-emerald-400">Connected</div>
                                                         </div>
                                                         <button
                                                            onClick={signOutDrive}
                                                            className="text-xs text-red-400 hover:text-red-300 px-2 py-2 min-h-[44px] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                                         >
                                                             Sign Out
                                                         </button>
                                                     </div>
                                                     <button
                                                        onClick={handleSyncClick}
                                                        disabled={isSyncing}
                                                        className={`w-full font-bold py-3 rounded-lg flex items-center justify-center gap-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors duration-300 ${
                                                            syncState === 'success'
                                                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                                                : 'bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white'
                                                        }`}
                                                     >
                                                         {syncState === 'success' ? (
                                                             <>
                                                                <Check className="w-4 h-4" aria-hidden="true" />
                                                                Synced!
                                                             </>
                                                         ) : isSyncing ? (
                                                             <>
                                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true"></div>
                                                                Syncing...
                                                             </>
                                                         ) : (
                                                             <>
                                                                <Cloud className="w-4 h-4" aria-hidden="true" />
                                                                Sync Now
                                                             </>
                                                         )}
                                                     </button>
                                                 </div>
                                             )}
                                         </div>
                                     )}
                                </div>
                            </>
                        )}
                    </section>

                    <div className="text-center text-[10px] text-slate-600 pt-8 pb-4">
                        SPEEDLIMIT PRO v1.0 • STARK UPGRADE
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
