const express = require('express');
const router = express.Router();
const supabaseService = require('../services/supabaseService');
const auth = require('../middleware/auth');

// Get all tasks
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabaseService.getTasks();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync events
router.post('/sync', auth, async (req, res) => {
  try {
    const { events } = req.body;
    const { data, error } = await supabaseService.syncEvents(events, req.user.id);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
