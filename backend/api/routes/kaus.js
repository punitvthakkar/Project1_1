const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// PUT /api/kaus/:sessionId/finalize - Finalize KAUs for session
router.put('/:sessionId/finalize', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { kauCategories } = req.body; // Array of kau categories to finalize

    if (!Array.isArray(kauCategories)) {
      return res.status(400).json({ error: 'kauCategories must be an array' });
    }

    // Validate session exists
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update finalized to true for selected KAUs
    const { error: updateError } = await supabase
      .from('kaus')
      .update({ finalized: true })
      .eq('session_id', session.id)
      .in('category', kauCategories);

    if (updateError) throw updateError;

    res.json({ message: 'KAUs finalized successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to finalize KAUs' });
  }
});

module.exports = router;
