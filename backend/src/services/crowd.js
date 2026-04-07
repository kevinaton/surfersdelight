import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.BESTTIME_PRIVATE_KEY;
const BASE_URL = 'https://besttime.app/api/v1';

/**
 * Fetches real-time crowd data for a specific venue near a surf spot.
 * For the PoC, we will use local landmarks as proxies for beach crowds.
 */
export const getCrowdFriction = async (venueId) => {
  if (!API_KEY || API_KEY === 'MOCK_KEY' || venueId === 'mock_venue') {
    return 0.2; // Default mock friction
  }

  try {
    // BestTime.app "Forecast" or "Live" request
    // For PoC simplicity, we'll use a 0-1 friction score based on live%
    const url = `${BASE_URL}/forecasts/live?api_key_private=${API_KEY}&venue_id=${venueId}`;
    const response = await axios.post(url);
    console.log(`[BestTime Crowds] Raw Analysis for ${venueId}:`, JSON.stringify(response.data.analysis || response.data, null, 2));

    if (response.data.status === 'OK' && response.data.analysis) {
      const liveIntensity = response.data.analysis.venue_live_busyness_60 || 0;
      return liveIntensity / 100; // Normalize 0-1
    }
    
    return 0.3; // Fallback
  } catch (error) {
    console.error("BestTime API Error:", error.response?.data || error.message);
    return 0.2; // Fallback
  }
};
