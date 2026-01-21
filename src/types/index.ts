import { RoadInfo } from './serviceTypes';

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
  // Use a partial type or intersection if possible, but for now explicitly documenting the any
  // full_data includes RoadInfo + telemetry
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  full_data: RoadInfo & { telemetry: any };
  synced?: boolean;
  driveId?: string;
  gps_accuracy?: number; // Added accuracy field
}
