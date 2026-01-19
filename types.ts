
export interface SpeedData {
  currentSpeed: number; // in mph
  limit: number | null;
  unit: 'mph' | 'kmh';
  roadName: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LogEntry {
  filename: string;
  path: string;
  timestamp: string;
  coordinates: Coordinates;
  road_context: string;
  full_data: any;
  synced?: boolean;
  driveId?: string;
  gps_accuracy?: number; // Added accuracy field
}
