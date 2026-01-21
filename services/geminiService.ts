
import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

export const resetAI = () => {
  ai = null;
};

const getAI = () => {
  if (!ai) {
    const apiKey = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      ai = new GoogleGenAI({ apiKey });
    }
  }
  return ai;
};

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

export const getSpeedLimitAtLocation = async (lat: number, lng: number, bearing: number, roadName?: string): Promise<RoadInfo> => {
  try {
    const googleAI = getAI();
    if (!googleAI) {
      console.warn("Gemini API Key missing. Running in offline mode.");
      throw new Error("API_KEY_MISSING");
    }

    // Using JSON mode for reliable parsing
    const response = await googleAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a high-precision automotive route analyzer. 
      Location: (${lat}, ${lng}). Heading: ${bearing}° (approx). Current Road Trace: ${roadName || 'Scanning'}.

      TASKS:
      1. Use Google Maps to identifying the EXACT road name at these coordinates. Prioritize Route Numbers (e.g., I-5, US-101) or Official Names.
      2. Use Google Search to find the current legal speed limit for this specific road segment.
      3. Look ahead for the NEXT 5 miles of THIS road in the current direction.
      4. Identify any upcoming speed limit changes (milestones).
      5. Identify the local Police Jurisdiction or District.

      CRITICAL: The 'why' field must be a clear, human-readable sentence explaining the data source (e.g., "Verified via Google Maps & local DOT data").

      Return a JSON object with this structure:
      {
        "limit": number | null,
        "roadName": string,
        "roadType": string,
        "policeDistrict": string,
        "why": string,
        "futureSegments": [{ "distanceMiles": number, "limit": number }]
      }`,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });

    const text = response.text || "{}";
    let data: any = {};
    try {
        data = JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse Gemini JSON", text, e);
        // Fallback or retry could happen here
    }

    return {
      limit: typeof data.limit === 'number' ? data.limit : null,
      roadName: data.roadName || "Identifying Road",
      roadType: data.roadType || "Detecting",
      policeDistrict: data.policeDistrict || "",
      context: data.why || "Synthesizing road data...",
      confidence: "Maps Grounding Active",
      futureSegments: Array.isArray(data.futureSegments) ? data.futureSegments : []
    };
  } catch (error: unknown) {
    console.error("Predictive Sync Error:", error);
    
    // Check for Quota Exceeded (429)
    const err = error as { status?: number; code?: number; message?: string };
    if (
      err.status === 429 ||
      err.code === 429 ||
      (err.message && (err.message.includes('429') || err.message.includes('quota')))
    ) {
      throw new Error("QUOTA_EXCEEDED");
    }

    return { 
      limit: null, 
      roadName: "Sync Failed", 
      roadType: "Offline", 
      policeDistrict: "",
      context: "Currently utilizing cached data due to connection issues.", 
      confidence: "None", 
      futureSegments: [] 
    };
  }
};
