import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.post('/save', async (req, res) => {
  const { userName, preferences } = req.body;

  if (!supabase) {
    return res.status(500).json({ error: "Supabase not configured." });
  }

  try {
    // Upsert by user_name, let the DB handle the ID
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({ 
        user_name: userName,
        ...preferences,
        updated_at: new Date()
      }, { onConflict: 'user_name' });

    if (error) throw error;
    res.json({ status: 'ok', data });
  } catch (error) {
    console.error("Supabase Save Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/by-name/:userName', async (req, res) => {
  const { userName } = req.params;

  if (!supabase) {
    return res.json({ status: 'mock', preferences: { friction_sensitivity: 5, spots: [] } });
  }

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_name', userName)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Supabase Fetch Error:", error.message);
      throw error;
    }
    res.json(data || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
