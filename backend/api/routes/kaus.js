// Vercel serverless function for /api/kaus
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Main handler
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'PUT') {
    // PUT /api/kaus/:sessionId/finalize
    const pathParts = req.url.split('/');
    if (pathParts[4] === 'finalize') {
      const sessionId = pathParts[3];
      try {
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
    } else {
      res.status(404).json({ error: 'Endpoint not found' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
