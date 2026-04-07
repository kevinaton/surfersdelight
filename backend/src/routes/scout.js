import express from 'express';
import axios from 'axios';
import { getQualityScore, calculateUtilityScore } from '../utils/scoring.js';
import { getRickKaneInsight } from '../services/gemini.js';
import { getCrowdFriction } from '../services/crowd.js';
import { getTrafficData } from '../services/routing.js';
import { logSessionData } from '../utils/logger.js';

const router = express.Router();

/**
 * Fetch real-time marine data from Open-Meteo.
 * Includes a "seaward nudge" logic: if the exact coordinates return null (due to being on land),
 * it tries nearby coordinates to find the nearest water/sea point.
 */
const fetchMarineData = async (lat, lon) => {
  const nudges = [
    { dLat: 0, dLon: 0 },      // 1. Original
    { dLat: 0.05, dLon: 0 },   // 2. North
    { dLat: -0.05, dLon: 0 },  // 3. South
    { dLat: 0, dLon: 0.05 },   // 4. East
    { dLat: 0, dLon: -0.05 },  // 5. West
    { dLat: 0.05, dLon: -0.05 } // 6. North-West (Specific for Macajalar Bay/CDO)
  ];

  for (const nudge of nudges) {
    try {
      const nLat = lat + nudge.dLat;
      const nLon = lon + nudge.dLon;
      const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${nLat}&longitude=${nLon}&current=wave_height,wave_period,wave_direction,wind_wave_height,wind_wave_period,wind_wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction`;
      
      const response = await axios.get(url);
      
      // Check if we have valid numerical data for wave height
      if (response.data?.current?.wave_height !== null && response.data?.current?.wave_height !== undefined) {
        if (nudge.dLat !== 0 || nudge.dLon !== 0) {
          console.log(`[Marine API] Nudge successful for (${lat}, ${lon}) -> moved to (${nLat.toFixed(4)}, ${nLon.toFixed(4)})`);
        }
        return response.data;
      } else {
        console.log(`[Marine API] No water data at (${nLat.toFixed(4)}, ${nLon.toFixed(4)}), trying next nudge...`);
      }
    } catch (error) {
      console.error(`[Marine API] Error at (${(lat + nudge.dLat).toFixed(4)}, ${(lon + nudge.dLon).toFixed(4)}):`, error.message);
    }
  }
  
  console.error(`[Marine API] Failed to find water data for (${lat}, ${lon}) after all nudges.`);
  return null;
};

/**
 * Stateless Scout: Frontend sends spots and home location directly.
 */
router.post('/current', async (req, res) => {
  const { userName, spots, home_location, sensitivity = 5 } = req.body;
  
  console.log(`Scout Request for User: ${userName} from ${home_location?.name || 'Unknown'}`);
  
  const userOrigin = home_location && home_location.lat 
    ? { lat: home_location.lat, lon: home_location.lon }
    : { lat: 21.3069, lon: -157.8583 }; // Fallback to Honolulu

  const spotsToScout = spots || [];
  
  if (spotsToScout.length === 0) {
    return res.json({ 
      timestamp: new Date().toISOString(), 
      topSpots: [], 
      message: "No spots found. Add some in settings, braddah!",
      userContext: { sensitivity, spotsTracked: 0 }
    });
  }

  const raw_api_logs = [];

  const results = await Promise.all(spotsToScout.map(async (spot) => {
    try {
      console.log(`Scouting ${spot.name}...`);
      // 1. Fetch Real Marine Data
      const marineResponse = await fetchMarineData(spot.lat, spot.lon);
      const marine = marineResponse?.current;
      const waveHeight = marine ? (marine.swell_wave_height || 1.5) * 3.28 : 5; 
      const period = marine ? (marine.swell_wave_period || 12) : 14;
      
      // 2. Fetch Crowd Friction
      const crowdFriction = await getCrowdFriction(spot.venueId || 'mock_venue');

      // 3. Fetch Real Traffic Data
      const traffic = await getTrafficData(userOrigin, { lat: spot.lat, lon: spot.lon });

      // 4. Calculate Scores
      const qScore = getQualityScore(waveHeight, period, 8, true); 
      const uScore = calculateUtilityScore(qScore, traffic.friction, crowdFriction, sensitivity);

      // 5. Build Spot Data (NO individual Gemini call here)
      const spotData = {
        name: spot.name,
        waveHeight: parseFloat(waveHeight.toFixed(1)),
        period: period,
        windSpeed: 8,
        isOffshore: true
      };

      // Log Raw Data for this spot
      raw_api_logs.push({
        spotName: spot.name,
        marine_raw: marineResponse,
        traffic_raw: traffic,
        crowd_raw: { friction: crowdFriction },
        scoring: { qualityScore: qScore, utilityScore: uScore }
      });

      return {
        ...spotData,
        lat: spot.lat,
        lon: spot.lon,
        qualityScore: qScore,
        utilityScore: uScore,
        travelTimeInSeconds: traffic.travelTimeInSeconds,
        travelTimeText: `${Math.round(traffic.travelTimeInSeconds / 60)} min`,
        points: traffic.points,
        friction: {
          crowd: crowdFriction,
          traffic: traffic.friction
        }
      };
    } catch (spotErr) {
      console.error(`Error scouting ${spot.name}:`, spotErr.message);
      return null;
    }
  }));

  const filteredResults = results.filter(r => r !== null);
  
  // Sorting with tie-breakers: 
  // 1. Utility Score (Primary)
  // 2. Quality Score (Secondary)
  // 3. Travel Time (Tertiary - lower is better)
  filteredResults.sort((a, b) => {
    if (b.utilityScore !== a.utilityScore) {
      return b.utilityScore - a.utilityScore;
    }
    if (b.qualityScore !== a.qualityScore) {
      return b.qualityScore - a.qualityScore;
    }
    return a.travelTimeInSeconds - b.travelTimeInSeconds;
  });

  // Capture everything to data.json
  logSessionData({
    user_inputs: {
      userName,
      home_location,
      sensitivity,
      spotsTracked: spotsToScout.length
    },
    api_responses: {
      scout_results: raw_api_logs
    },
    final_output: filteredResults
  });

  res.json({
    timestamp: new Date().toISOString(),
    topSpots: filteredResults,
    userContext: {
      sensitivity,
      spotsTracked: spotsToScout.length,
      origin: home_location?.name || 'Default (Honolulu)'
    }
  });
});

export default router;
