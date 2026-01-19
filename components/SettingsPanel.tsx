
import React from 'react';
import { GoogleUser } from '../services/googleDriveService';

interface SettingsPanelProps {
  alertsEnabled: boolean;
  setAlertsEnabled: (val: boolean) => void;
  chimesEnabled: boolean;
  setChimesEnabled: (val: boolean) => void;
  showPolice: boolean;
  setShowPolice: (val: boolean) => void;
  showContext: boolean;
  setShowContext: (val: boolean) => void;
  threshold: number;
  setThreshold: (val: number) => void;
  loggingEnabled: boolean;
  setLoggingEnabled: (val: boolean) => void;
  cloudEnabled: boolean;
  setCloudEnabled: (val: boolean) => void;
  isGoogleSignedIn: boolean;
  googleUser: GoogleUser | null;
  logCount: number;
  isSyncing: boolean;
  handleManualSync: () => void;
  signInToDrive: () => void;
  signOutDrive: () => void;
  exportData: () => void;
  clearLogs: () => void;
  setLogCount: (val: number) => void;
  setShowSettings: (val: boolean) => void;
  isLocked: boolean;
  setIsLocked: (val: boolean) => void;
  clickThrough: boolean;
  setClickThrough: (val: boolean) => void;
  opacity: number;
  setOpacity: (val: number) => void;
  scale: number;
  setScale: (val: number) => void;
  setWidgetPos: (val: { x: number, y: number }) => void;
  viewMode: 'full' | 'widget';
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  alertsEnabled, setAlertsEnabled,
  chimesEnabled, setChimesEnabled,
  showPolice, setShowPolice,
  showContext, setShowContext,
  threshold, setThreshold,
  loggingEnabled, setLoggingEnabled,
  cloudEnabled, setCloudEnabled,
  isGoogleSignedIn, googleUser,
  logCount, isSyncing, handleManualSync,
  signInToDrive, signOutDrive,
  exportData, clearLogs, setLogCount,
  setShowSettings,
  isLocked, setIsLocked,
  clickThrough, setClickThrough,
  opacity, setOpacity,
  scale, setScale,
  setWidgetPos,
  viewMode
}) => {
  const [showSyncSuccess, setShowSyncSuccess] = React.useState(false);
  const [showClearedFeedback, setShowClearedFeedback] = React.useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = React.useState(false);

  const onSync = async () => {
    await handleManualSync();
    setShowSyncSuccess(true);
    setTimeout(() => setShowSyncSuccess(false), 3000);
  };

  const onClear = () => {
    if (confirm('Clear all logs?')) {
      clearLogs();
      setLogCount(0);
      setShowClearedFeedback(true);
      setTimeout(() => setShowClearedFeedback(false), 3000);
    }
  };

  const onSave = () => {
    setShowSavedFeedback(true);
    setTimeout(() => {
        setShowSettings(false);
        setShowSavedFeedback(false);
    }, 800);

    localStorage.setItem('alerts_enabled', alertsEnabled.toString());
    localStorage.setItem('chimes_enabled', chimesEnabled.toString());
    localStorage.setItem('alert_threshold', threshold.toString());
    localStorage.setItem('data_logging_enabled', loggingEnabled.toString());
    localStorage.setItem('show_police', showPolice.toString());
    localStorage.setItem('show_context', showContext.toString());
    localStorage.setItem('cloud_sync_enabled', cloudEnabled.toString());
  };

  return (
    <div className={`fixed inset-x-0 bottom-0 bg-slate-900 border-t border-white/10 rounded-t-[3rem] p-10 z-50 transition-transform duration-500`}>
      <div className="w-16 h-2 bg-slate-800 rounded-full mx-auto mb-8 cursor-pointer" onClick={() => setShowSettings(false)}></div>

      {viewMode === 'widget' ? (
        <div className="space-y-4">
          <h3 className="text-sm font-black text-white uppercase mb-4">Widget Settings</h3>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-400 font-bold block">Lock Position</span>
              <span className="text-[10px] text-slate-500">Disable widget dragging</span>
            </div>
            <button
              onClick={() => setIsLocked(!isLocked)}
              aria-label={isLocked ? "Unlock widget position" : "Lock widget position"}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isLocked ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300'}`}
            >
                {isLocked ? 'LOCKED' : 'UNLOCKED'}
            </button>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-400 font-bold block">Click-Through</span>
              <span className="text-[10px] text-slate-500">Interact with apps behind widget</span>
            </div>
            <button onClick={() => {
                const newVal = !clickThrough;
                setClickThrough(newVal);
                localStorage.setItem('widget_click_through', String(newVal));
            }}
            aria-label={clickThrough ? "Disable click-through" : "Enable click-through"}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${clickThrough ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                {clickThrough ? 'ON' : 'OFF'}
            </button>
          </div>

          <div>
            <div className="flex justify-between mb-1"><span className="text-xs text-slate-400 font-bold">Opacity</span><span className="text-xs text-white">{Math.round(opacity * 100)}%</span></div>
            <input type="range" min="0.2" max="1" step="0.1" value={opacity} onChange={(e) => {setOpacity(parseFloat(e.target.value)); localStorage.setItem('widget_opacity', e.target.value);}} className="w-full h-1 bg-slate-700 rounded-lg appearance-none accent-blue-500"/>
          </div>

          <div>
            <div className="flex justify-between mb-1"><span className="text-xs text-slate-400 font-bold">Scale</span><span className="text-xs text-white">{scale}x</span></div>
            <input type="range" min="0.5" max="1.5" step="0.1" value={scale} onChange={(e) => {setScale(parseFloat(e.target.value)); localStorage.setItem('widget_scale', e.target.value);}} className="w-full h-1 bg-slate-700 rounded-lg appearance-none accent-blue-500"/>
          </div>

          <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10">
              <span className="text-xs text-slate-400 font-bold">Troubleshoot</span>
              <button onClick={() => { setWidgetPos({x: 20, y: 60}); localStorage.removeItem('widget_position'); }} className="px-2 py-1 bg-red-900/50 text-red-300 rounded text-[10px] font-bold uppercase">
                  Reset Pos
              </button>
          </div>

          <button onClick={() => setShowSettings(false)} className="w-full py-2 bg-blue-600 rounded-lg text-xs font-black uppercase">Close</button>
        </div>
      ) : (
        <>
        <h3 className="text-2xl font-black mb-8 uppercase text-white">Config & Storage</h3>
        <div className="space-y-6 overflow-y-auto max-h-[60vh] pb-10">

          {/* Main Controls */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div><p className="font-bold text-lg">Speed Alerts</p><p className="text-xs text-slate-500">Audio chime over limit</p></div>
                <button onClick={() => setAlertsEnabled(!alertsEnabled)} className={`w-16 h-9 rounded-full relative transition-colors ${alertsEnabled ? 'bg-blue-600' : 'bg-slate-800'}`}>
                <div className={`absolute top-1.5 w-6 h-6 bg-white rounded-full transition-all ${alertsEnabled ? 'left-8' : 'left-1.5'}`}></div>
                </button>
            </div>
            <div className="flex justify-between items-center">
                <div><p className="font-bold text-lg">Milestone Chimes</p><p className="text-xs text-slate-500">Tone on limit changes</p></div>
                <button onClick={() => setChimesEnabled(!chimesEnabled)} className={`w-16 h-9 rounded-full relative transition-colors ${chimesEnabled ? 'bg-blue-600' : 'bg-slate-800'}`}>
                <div className={`absolute top-1.5 w-6 h-6 bg-white rounded-full transition-all ${chimesEnabled ? 'left-8' : 'left-1.5'}`}></div>
                </button>
            </div>
            <div className="flex justify-between items-center">
                <div><p className="font-bold text-lg">Police District</p><p className="text-xs text-slate-500">Show local jurisdiction</p></div>
                <button onClick={() => setShowPolice(!showPolice)} className={`w-16 h-9 rounded-full relative transition-colors ${showPolice ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                <div className={`absolute top-1.5 w-6 h-6 bg-white rounded-full transition-all ${showPolice ? 'left-8' : 'left-1.5'}`}></div>
                </button>
            </div>
            <div className="flex justify-between items-center">
                <div><p className="font-bold text-lg">Verified Info</p><p className="text-xs text-slate-500">Show data source context</p></div>
                <button onClick={() => setShowContext(!showContext)} className={`w-16 h-9 rounded-full relative transition-colors ${showContext ? 'bg-blue-600' : 'bg-slate-800'}`}>
                <div className={`absolute top-1.5 w-6 h-6 bg-white rounded-full transition-all ${showContext ? 'left-8' : 'left-1.5'}`}></div>
                </button>
            </div>
            <div className="pt-4 border-t border-white/5">
                <div className="flex justify-between mb-4"><p className="font-bold text-lg">Alert Buffer</p><p className="font-black text-3xl text-blue-500">+{threshold} MPH</p></div>
                <input type="range" min="1" max="20" value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value))} className="w-full h-3 bg-slate-800 rounded-xl appearance-none accent-blue-500"/>
            </div>
          </div>

          {/* Data Logging Section */}
          <div className="pt-6 border-t border-white/10">
            <h4 className="text-sm font-black uppercase text-slate-400 mb-4 tracking-widest">Data Logging Strategy</h4>
            <div className="bg-slate-800/50 rounded-2xl p-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <p className="font-bold text-white">Auto-Log Routes</p>
                        <p className="text-[10px] text-slate-400">Save JSON metadata to /Gemini_API_Data</p>
                    </div>
                    <button onClick={() => setLoggingEnabled(!loggingEnabled)} className={`w-12 h-7 rounded-full relative transition-colors ${loggingEnabled ? 'bg-red-500' : 'bg-slate-600'}`}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${loggingEnabled ? 'left-6' : 'left-1'}`}></div>
                    </button>
                </div>

                <div className="flex justify-between items-center mb-4 border-t border-white/10 pt-3">
                    <div>
                        <p className="font-bold text-white">Google Drive Cloud</p>
                        <p className="text-[10px] text-slate-400">Mirror data to personal cloud storage</p>
                    </div>
                    <button onClick={() => {
                        const newState = !cloudEnabled;
                        setCloudEnabled(newState);
                        localStorage.setItem('cloud_sync_enabled', newState.toString());
                        if (newState && !isGoogleSignedIn) {
                            signInToDrive();
                        }
                    }} className={`w-12 h-7 rounded-full relative transition-colors ${cloudEnabled ? 'bg-sky-500' : 'bg-slate-600'}`}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${cloudEnabled ? 'left-6' : 'left-1'}`}></div>
                    </button>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-300 font-mono bg-black/30 p-3 rounded-lg">
                    <span>Logs Stored:</span>
                    <span className="font-bold text-blue-400">{logCount} Files</span>
                </div>

                {cloudEnabled && (
                    <div className="mt-4">
                        {isGoogleSignedIn && googleUser ? (
                            <div className="bg-slate-700/50 rounded-xl p-3 flex items-center gap-3 border border-white/10">
                                <img src={googleUser.picture} className="w-8 h-8 rounded-full border border-white/20" alt="Avatar" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-bold text-white truncate">{googleUser.name}</div>
                                    <button onClick={signOutDrive} className="text-[9px] text-red-400 hover:text-red-300 uppercase font-bold tracking-wider">Disconnect</button>
                                </div>
                                <button
                                  onClick={onSync}
                                  disabled={isSyncing}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${isSyncing ? 'bg-slate-600 text-slate-400' : showSyncSuccess ? 'bg-emerald-500 text-white' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white'}`}
                                >
                                    {isSyncing ? 'Syncing...' : showSyncSuccess ? 'Synced!' : 'Sync Now'}
                                </button>
                            </div>
                        ) : (
                            <button onClick={signInToDrive} className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95">
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                <span className="text-xs font-bold tracking-wide">Sign in with Google</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <button onClick={exportData} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    Export Archive
                </button>
                <button onClick={onClear} className={`px-4 py-3 rounded-xl font-bold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${showClearedFeedback ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400'}`}>
                    {showClearedFeedback ? 'Cleared!' : 'Clear'}
                </button>
            </div>
            <p className="text-[9px] text-slate-500 mt-3 text-center">
                Logs are organized by Date / Location as specified in Data Strategy v1.
            </p>
          </div>

          <button onClick={onSave} className={`w-full py-5 rounded-[2rem] font-black uppercase shadow-xl active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${showSavedFeedback ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
            {showSavedFeedback ? 'Settings Saved!' : 'Save Preferences'}
          </button>
        </div>
        </>
      )}
    </div>
  );
};

export default SettingsPanel;
