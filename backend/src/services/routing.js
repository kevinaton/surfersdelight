import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.TOMTOM_API_KEY;
const BASE_URL = 'https://api.tomtom.com/routing/1/calculateRoute';

/**
 * Calculates traffic friction using TomTom.
 * Friction is (delayInSeconds / freeFlowTravelTimeInSeconds) normalized 0-1.
 */
export const getTrafficFriction = async (origin, destination) => {
  if (!API_KEY || API_KEY === 'PLACEHOLDER_UNTIL_PROVIDED') {
    // Traffic Proxy Logic (Simulation)
    const hour = new Date().getHours();
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);
    return isRushHour ? 0.8 : 0.1; // 80% friction during rush hour
  }

  const locations = `${origin.lat},${origin.lon}:${destination.lat},${destination.lon}`;
  
  try {
    const url = `${BASE_URL}/${locations}/json?key=${API_KEY}&traffic=true&travelMode=car`;
    const response = await axios.get(url);

    if (response.data.routes && response.data.routes[0]) {
      const summary = response.data.routes[0].summary;
      const delay = summary.trafficDelayInSeconds || 0;
      const totalTime = summary.travelTimeInSeconds;
      const freeFlowTime = totalTime - delay;

      // Friction is the ratio of delay to total trip
      const friction = Math.min(1, delay / freeFlowTime);
      return parseFloat(friction.toFixed(2));
    }
    
    return 0.1;
  } catch (error) {
    console.error("TomTom Routing API Error:", error.response?.data || error.message);
    return 0.2;
  }
};
