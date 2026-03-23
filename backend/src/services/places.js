import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GEOAPIFY_API_KEY;
const BASE_URL = 'https://api.geoapify.com/v2/places';

/**
 * Finds local POIs near a surf spot.
 * Categories: catering.restaurant (Refuel), commercial.outdoor_and_sport (Gear)
 */
export const getVictoryLapSpots = async (lat, lon) => {
  if (!API_KEY || API_KEY === 'MOCK_KEY') {
    return [
      { name: "Ted's Bakery", type: "Refuel", distance: "0.3km", insight: "Mocked refuel spot." },
      { name: "Surf N Sea", type: "Gear", distance: "2.5km", insight: "Mocked gear shop." }
    ];
  }

  const categories = 'catering.restaurant,commercial.outdoor_and_sport';
  const radius = 5000; // 5km search

  try {
    const url = `${BASE_URL}?categories=${categories}&filter=circle:${lon},${lat},${radius}&limit=5&apiKey=${API_KEY}`;
    const response = await axios.get(url);

    if (response.data.features) {
      return response.data.features.map(f => ({
        name: f.properties.name || f.properties.street || "Local Spot",
        type: f.properties.categories.includes('catering') ? 'Refuel' : 'Gear Up',
        distance: `${(f.properties.distance / 1000).toFixed(1)}km`,
        insight: `Head to ${f.properties.name} to keep the stoke alive. It's just around the corner!`,
        lat: f.properties.lat,
        lon: f.properties.lon
      }));
    }
    
    return [];
  } catch (error) {
    console.error("Geoapify Places API Error:", error.response?.data || error.message);
    return [];
  }
};
