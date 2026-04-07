import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.TOMTOM_API_KEY;
const BASE_URL = 'https://api.tomtom.com/routing/1/calculateRoute';

/**
 * Calculates traffic data using TomTom.
 * Returns friction (delay ratio) and travelTimeInSeconds.
 */
export const getTrafficData = async (origin, destination) => {
  if (!API_KEY || API_KEY === 'PLACEHOLDER_UNTIL_PROVIDED') {
    // Traffic Proxy Logic (Simulation)
    const hour = new Date().getHours();
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);
    return {
      friction: isRushHour ? 0.8 : 0.1,
      travelTimeInSeconds: 3600, // 1 hour mock
      points: [
        { latitude: origin.lat, longitude: origin.lon },
        { latitude: destination.lat, longitude: destination.lon }
      ]
    };
  }

  const locations = `${origin.lat},${origin.lon}:${destination.lat},${destination.lon}`;
  
  try {
    // Adding departAt=now and routeType=fastest for maximum real-time accuracy
    const url = `${BASE_URL}/${locations}/json?key=${API_KEY}&traffic=true&travelMode=car&departAt=now&routeType=fastest`;
    const response = await axios.get(url);

    if (response.data.routes && response.data.routes[0]) {
      const summary = response.data.routes[0].summary;
      const points = response.data.routes[0].legs[0].points;
      console.log(`[TomTom Traffic] Live Summary for ${locations}:`, JSON.stringify(summary, null, 2));
      
      const delay = summary.trafficDelayInSeconds || 0;
      const totalTime = summary.travelTimeInSeconds;
      const freeFlowTime = totalTime - delay;

      // Improved Friction Logic:
      // If there is any delay, we add a 0.05 (5%) 'baseline' to represent the frustration 
      // of even minor stop-and-go traffic that TomTom might underrate.
      let friction = 0;
      if (delay > 0) {
        const rawFriction = delay / freeFlowTime;
        friction = Math.min(1, 0.05 + rawFriction); 
      }

      return {
        friction: parseFloat(friction.toFixed(2)),
        travelTimeInSeconds: totalTime,
        points: points
      };
    }
    
    return { friction: 0.1, travelTimeInSeconds: 1800, points: [] };
  } catch (error) {
    console.error("TomTom Routing API Error:", error.response?.data || error.message);
    return { friction: 0.2, travelTimeInSeconds: 1800, points: [] };
  }
};
