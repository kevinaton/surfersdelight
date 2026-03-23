import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const API_KEY = process.env.GEOAPIFY_API_KEY;

router.get('/search', async (req, res) => {
  const { text } = req.query;
  
  if (!text) return res.json([]);

  try {
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&apiKey=${API_KEY}`;
    const response = await axios.get(url);
    
    const results = response.data.features.map(f => ({
      name: f.properties.formatted,
      lat: f.properties.lat,
      lon: f.properties.lon,
      city: f.properties.city,
      country: f.properties.country
    }));
    
    res.json(results);
  } catch (error) {
    console.error("Geocoding Error:", error.message);
    res.status(500).json({ error: "Failed to search locations" });
  }
});

export default router;
