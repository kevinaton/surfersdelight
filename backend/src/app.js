import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import scoutRoutes from './routes/scout.js';
import itineraryRoutes from './routes/itinerary.js';
import chatRoutes from './routes/chat.js';
import geocodingRoutes from './routes/geocoding.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/scout', scoutRoutes);
app.use('/api/itinerary', itineraryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/geocoding', geocodingRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Rick Kane is ready to shred!' });
});

export default app;
