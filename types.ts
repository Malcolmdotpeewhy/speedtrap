
export interface PredictiveSegment {
  distanceMiles: number;
  limit: number;
}

export interface RoadInfo {
  limit: number | null;
  roadName: string;
  roadType: string;
  policeDistrict: string;
  context: string;
  confidence: string;
  futureSegments: PredictiveSegment[];
}

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

export interface TelemetryData {
  bearing: number;
  gps_accuracy: number;
  gps_timestamp: number;
}

export interface LogEntry {
  filename: string;
  path: string;
  timestamp: string;
  coordinates: Coordinates;
  road_context: string;
  full_data: RoadInfo & { telemetry: TelemetryData };
  synced?: boolean;
  driveId?: string;
  gps_accuracy?: number; // Added accuracy field
}
