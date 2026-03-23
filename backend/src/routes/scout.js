import express from 'express';
import axios from 'axios';
import { getQualityScore, calculateUtilityScore } from '../utils/scoring.js';
import { getRickKaneInsight } from '../services/gemini.js';
import { getCrowdFriction } from '../services/crowd.js';
import { getTrafficFriction } from '../services/routing.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();
const MOCK_USER_ID = process.env.MOCK_USER_ID;

/**
 * Fetch real-time marine data from Open-Meteo
 */
const fetchMarineData = async (lat, lon) => {
  try {
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_period,wave_direction,wind_wave_height,wind_wave_period,wind_wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction`;
    const response = await axios.get(url);
    return response.data.current;
  } catch (error) {
    console.error("Open-Meteo Error:", error.message);
    return null;
  }
};

router.get('/current', async (req, res) => {
  const { userName } = req.query;
  console.log(`Scout Request for User: ${userName}`);
  
  // 1. Fetch User Preferences from Supabase by Name
  let sensitivity = 5;
  let userSpots = [];

  if (supabase && userName) {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_name', userName)
      .single();

    if (error) console.error("Supabase Fetch Error:", error.message);

    if (data) {
      sensitivity = data.friction_sensitivity || 5;
      userSpots = data.spots || [];
      console.log(`Found ${userSpots.length} user spots in DB:`, userSpots.map(s => s.name));
    }
  }

  // 2. Define Spots
  // Filter based on user onboarding choices
  // If user has chosen spots, use those objects directly!
  const spotsToScout = userSpots.length > 0 ? userSpots : [];
  
  console.log(`Processing ${spotsToScout.length} spots...`);

  if (spotsToScout.length === 0) {
    return res.json({ 
      timestamp: new Date().toISOString(), 
      topSpots: [], 
      message: "No spots found. Add some in settings, braddah!",
      userContext: { sensitivity, spotsTracked: 0 }
    });
  }

  const results = await Promise.all(spotsToScout.map(async (spot) => {
    try {
      console.log(`Scouting ${spot.name}...`);
      // 3. Fetch Real Marine Data
      const marine = await fetchMarineData(spot.lat, spot.lon);
      const waveHeight = marine ? (marine.swell_wave_height || 1.5) * 3.28 : 5; 
      const period = marine ? (marine.swell_wave_period || 12) : 14;
      
      // 4. Fetch Crowd Friction (Use Mock ID if not provided)
      const crowdFriction = await getCrowdFriction(spot.venueId || 'mock_venue');

      // 5. Fetch Traffic Friction
      const userOrigin = { lat: 21.3069, lon: -157.8583 }; // Honolulu
      const trafficFriction = await getTrafficFriction(userOrigin, { lat: spot.lat, lon: spot.lon });

      // 6. Calculate Scores
      const qScore = getQualityScore(waveHeight, period, 8, true); 
      const uScore = calculateUtilityScore(qScore, trafficFriction, crowdFriction, sensitivity);

      // 7. Get Rick Kane Personality
      const spotData = {
        name: spot.name,
        waveHeight: parseFloat(waveHeight.toFixed(1)),
        period: period,
        windSpeed: 8,
        isOffshore: true
      };
      const insight = await getRickKaneInsight(spotData, uScore);

      return {
        ...spotData,
        lat: spot.lat,
        lon: spot.lon,
        qualityScore: qScore,
        utilityScore: uScore,
        rickKaneInsight: insight,
        friction: {
          crowd: crowdFriction,
          traffic: trafficFriction
        }
      };
    } catch (spotErr) {
      console.error(`Error scouting ${spot.name}:`, spotErr.message);
      return null;
    }
  }));

  const filteredResults = results.filter(r => r !== null);
  filteredResults.sort((a, b) => b.utilityScore - a.utilityScore);

  console.log(`Scout completed with ${filteredResults.length} results.`);

  res.json({
    timestamp: new Date().toISOString(),
    topSpots: filteredResults,
    userContext: {
      sensitivity,
      spotsTracked: userSpots.length
    }
  });
});

export default router;
