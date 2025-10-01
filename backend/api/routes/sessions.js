const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdf = require('pdf-parse');

const router = express.Router();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);

// POST /api/sessions - Create session, upload document, generate KAU
router.post('/', async (req, res) => {
  try {
    const { sessionId, title, fileBase64, fileType, isProfessor } = req.body; // fileBase64 for simplicity in POC

    if (!sessionId || !title) {
      return res.status(400).json({ error: 'Session ID and title required' });
    }

    if (!isProfessor) {
      return res.status(403).json({ error: 'Only professors can create sessions' });
    }

    // Decode base64 to text for AI
    let documentText = '';
    if (fileBase64) {
      const buffer = Buffer.from(fileBase64, 'base64');
      if (fileType && fileType.includes('pdf')) {
        try {
          const data = await pdf(buffer);
          documentText = data.text;
        } catch (err) {
          console.error('PDF parsing error:', err);
          documentText = buffer.toString('utf-8'); // fallback
        }
      } else {
        documentText = buffer.toString('ascii');
      }
    }

    // Call Gemini to extract KAUs
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
const kauSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      category: { type: "string" },
      description: { type: "string" }
    },
    required: ["category", "description"]
  }
};
const prompt = `Return ONLY valid JSON that matches this JSON Schema. Do not include any commentary.
Schema:
${JSON.stringify(kauSchema)}
Task: Analyze this lecture document/slides and extract 5-10 Key Areas of Understanding (KAU). Focus on pedagogical goals: Cover Bloom's Taxonomy levels (remember, understand, apply, analyze, evaluate, create). For each KAU, use a categorical tag like "Knowledge: Topic Name" and describe the learning objective or skill.
Input:
${documentText}`;

const response = await model.generateContent({
  contents: [{ role: "user", parts: [{ text: prompt }]}],
  generationConfig: { temperature: 0.3, maxOutputTokens: 1024, stopSequences: ["```"] }
});
const kauJson = JSON.parse(response.response.text());
const suggestedKaus = kauJson.slice(0, 10).map(k => ({
  category: k.category,
  description: k.description
}));

    // Insert session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert([{ session_id: sessionId, title, document_path: null }]) // TODO: Upload to storage
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Insert suggested KAUs
    const kauInsert = suggestedKaus.map(kau => ({
      session_id: session.id,
      category: kau.category,
      description: kau.description,
      finalized: false
    }));

    const { error: kauError } = await supabase.from('kaus').insert(kauInsert);
    if (kauError) throw kauError;

    res.json({ session, suggestedKaus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// GET /api/sessions/:sessionId/dashboard - Professor dashboard
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Get session info
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*, kaus(*)')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Aggregate feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select('submissions(session_id), missing_points')
      .eq('submissions.session_id', session.id);

    if (feedbackError) throw feedbackError;

    // Aggregate missing points (simple)
    const gaps = {};
    feedback.forEach(f => {
      if (f.missing_points) {
        const points = f.missing_points.split(';');
        points.forEach(point => {
          point = point.trim();
          if (gaps[point]) gaps[point]++;
          else gaps[point] = 1;
        });
      }
    });

    const topGaps = Object.entries(gaps).sort(([,a],[,b]) => b-a).slice(0,10);

    // AI suggestion for remediation (optional, for now return top gaps)
    const suggestions = topGaps.map(([point]) => `Reinforce: ${point}`);

    res.json({ session, submissionsCount: feedback.length, topGaps, suggestions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

module.exports = router;
