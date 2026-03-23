import express from 'express';
import { getVictoryLapSpots } from '../services/places.js';

const router = express.Router();

router.get('/:spotName', async (req, res) => {
  const { spotName } = req.params;
  const { lat, lon } = req.query; // Expecting coordinates in query
  
  if (!lat || !lon) {
    return res.status(400).json({ error: "Missing lat/lon coordinates" });
  }

  const spots = await getVictoryLapSpots(lat, lon);

  res.json({
    spotName,
    recommendations: spots.length > 0 ? spots : [
      {
        name: "Local Juice Stand",
        type: "Refuel",
        distance: "0.5km",
        insight: "Keep it simple, braddah. Grab a fresh juice and soak in the North Shore vibes.",
        icon: "Coffee"
      }
    ]
  });
});

export default router;
