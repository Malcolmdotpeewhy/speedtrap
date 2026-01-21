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
