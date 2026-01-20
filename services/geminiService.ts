
import { GoogleGenAI, Type } from "@google/genai";

let ai: any = null;

export const resetAI = () => {
  ai = null;
};

const getAI = () => {
  if (!ai) {
    // @ts-ignore
    const apiKey = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || (process.env.API_KEY as string);
    // If no key, we can't initialize. But throwing here might crash callers if they don't catch.
    // However, the original code crashed on top-level.
    // We'll return null and handle it in getSpeedLimitAtLocation.
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

    // Switching to gemini-2.5-flash to utilize Google Maps Grounding for precise road identification
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

      CRITICAL: The 'WHY' field must be a clear, human-readable sentence explaining the data source (e.g., "Verified via Google Maps & local DOT data").

      Format response exactly:
      LIMIT: [number]
      ROAD: [Official Road Name]
      TYPE: [Highway/Arterial/Residential]
      POLICE: [Abbreviation]
      WHY: [Meaningful data source explanation]
      PATH_AHEAD: [Distance in miles to next change]:[New Limit], [Distance to next change]:[New Limit]`,
      config: {
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

    const text = response.text || "";
    const limitMatch = text.match(/LIMIT:\s*(\d+)/i);
    const roadMatch = text.match(/ROAD:\s*(.+)/i);
    const typeMatch = text.match(/TYPE:\s*(.+)/i);
    const policeMatch = text.match(/POLICE:\s*(.+)/i);
    const whyMatch = text.match(/WHY:\s*(.+)/i);
    const pathMatch = text.match(/PATH_AHEAD:\s*(.+)/i);

    const futureSegments: PredictiveSegment[] = [];
    if (pathMatch) {
      const segments = pathMatch[1].split(',').map(s => s.trim());
      segments.forEach(s => {
        const [dist, lim] = s.split(':').map(Number);
        if (!isNaN(dist) && !isNaN(lim)) futureSegments.push({ distanceMiles: dist, limit: lim });
      });
    }

    return {
      limit: limitMatch ? parseInt(limitMatch[1], 10) : null,
      roadName: roadMatch ? roadMatch[1].trim() : "Identifying Road",
      roadType: typeMatch ? typeMatch[1].trim() : "Detecting",
      policeDistrict: policeMatch ? policeMatch[1].trim() : "",
      context: whyMatch ? whyMatch[1].trim() : "Synthesizing road data and local regulations...",
      confidence: "Maps Grounding Active",
      futureSegments
    };
  } catch (error: any) {
    console.error("Predictive Sync Error:", error);
    
    // Check for Quota Exceeded (429) to allow the app to back off
    if (
      error.status === 429 || 
      error.code === 429 || 
      (error.message && (error.message.includes('429') || error.message.includes('quota')))
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
