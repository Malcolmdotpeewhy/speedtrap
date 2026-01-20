import { useState, useEffect, useMemo } from 'react';
import { resetAI } from '../services/geminiService';

export const useSettings = () => {
  const initialPrefs = useMemo(() => ({
    threshold: Number(localStorage.getItem('alert_threshold')) || 5,
    alertsEnabled: localStorage.getItem('alerts_enabled') !== 'false',
    chimesEnabled: localStorage.getItem('chimes_enabled') !== 'false',
    loggingEnabled: localStorage.getItem('data_logging_enabled') === 'true',
    cloudEnabled: localStorage.getItem('cloud_sync_enabled') === 'true',
    showPolice: localStorage.getItem('show_police') !== 'false',
    showContext: localStorage.getItem('show_context') !== 'false',
    opacity: Number(localStorage.getItem('widget_opacity')) || 1,
    scale: Number(localStorage.getItem('widget_scale')) || 1,
    clickThrough: localStorage.getItem('widget_click_through') === 'true',
    apiKey: localStorage.getItem('gemini_api_key') || '',
    widgetPos: (() => {
      const saved = localStorage.getItem('widget_position');
      return saved ? JSON.parse(saved) : { x: 20, y: 60 };
    })()
  }), []);

  const [threshold, setThreshold] = useState<number>(initialPrefs.threshold);
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(initialPrefs.alertsEnabled);
  const [chimesEnabled, setChimesEnabled] = useState<boolean>(initialPrefs.chimesEnabled);
  const [loggingEnabled, setLoggingEnabled] = useState<boolean>(initialPrefs.loggingEnabled);
  const [cloudEnabled, setCloudEnabled] = useState<boolean>(initialPrefs.cloudEnabled);
  const [showPolice, setShowPolice] = useState<boolean>(initialPrefs.showPolice);
  const [showContext, setShowContext] = useState<boolean>(initialPrefs.showContext);
  const [opacity, setOpacity] = useState<number>(initialPrefs.opacity);
  const [scale, setScale] = useState<number>(initialPrefs.scale);
  const [clickThrough, setClickThrough] = useState<boolean>(initialPrefs.clickThrough);
  const [widgetPos, setWidgetPos] = useState(initialPrefs.widgetPos);
  const [apiKey, setApiKey] = useState<string>(initialPrefs.apiKey);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
    resetAI();
  }, [apiKey]);
  useEffect(() => localStorage.setItem('alert_threshold', String(threshold)), [threshold]);
  useEffect(() => localStorage.setItem('alerts_enabled', String(alertsEnabled)), [alertsEnabled]);
  useEffect(() => localStorage.setItem('chimes_enabled', String(chimesEnabled)), [chimesEnabled]);
  useEffect(() => localStorage.setItem('data_logging_enabled', String(loggingEnabled)), [loggingEnabled]);
  useEffect(() => localStorage.setItem('cloud_sync_enabled', String(cloudEnabled)), [cloudEnabled]);
  useEffect(() => localStorage.setItem('show_police', String(showPolice)), [showPolice]);
  useEffect(() => localStorage.setItem('show_context', String(showContext)), [showContext]);
  useEffect(() => localStorage.setItem('widget_opacity', String(opacity)), [opacity]);
  useEffect(() => localStorage.setItem('widget_scale', String(scale)), [scale]);
  useEffect(() => localStorage.setItem('widget_click_through', String(clickThrough)), [clickThrough]);
  useEffect(() => localStorage.setItem('widget_position', JSON.stringify(widgetPos)), [widgetPos]);

  return {
    threshold, setThreshold,
    alertsEnabled, setAlertsEnabled,
    chimesEnabled, setChimesEnabled,
    loggingEnabled, setLoggingEnabled,
    cloudEnabled, setCloudEnabled,
    showPolice, setShowPolice,
    showContext, setShowContext,
    opacity, setOpacity,
    scale, setScale,
    clickThrough, setClickThrough,
    widgetPos, setWidgetPos,
    apiKey, setApiKey
  };
};
