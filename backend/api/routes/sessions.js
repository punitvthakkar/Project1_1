// Vercel serverless function for /api/sessions
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdf = require('pdf-parse');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);

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

  if (req.method === 'POST') {
    // Create session
    try {
      const { sessionId, title, fileBase64, fileType, isProfessor } = req.body;

      if (!sessionId || !title) {
        return res.status(400).json({ error: 'Session ID and title required' });
      }

      if (!isProfessor) {
        return res.status(403).json({ error: 'Only professors can create sessions' });
      }

      let documentText = '';
      if (fileBase64) {
        const buffer = Buffer.from(fileBase64, 'base64');
        if (fileType && fileType.includes('pdf')) {
          try {
            const data = await pdf(buffer);
            documentText = data.text;
          } catch (err) {
            console.error('PDF parsing error:', err);
            documentText = buffer.toString('utf-8');
          }
        } else {
          documentText = buffer.toString('ascii');
        }
      }

      // Gemini call
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
        .insert([{ session_id: sessionId, title, document_path: null }])
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
  } else if (req.method === 'GET') {
    // Dashboard (sessionId from query or path? Wait, the call is /api/sessions/:sessionId
    // In serverless, the :sessionId is not auto, need to parse url
    const url = req.url;
    const pathParts = url.split('/');
    const sessionId = pathParts[2]; // /api/sessions/:sessionId -> sessions, :sessionId

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // Get session
    try {
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('*, kaus(*)')
        .eq('session_id', sessionId)
        .single();

      if (sessionError || !session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Aggregate
      const { data: feedback, error: feedbackError } = await supabase
        .from('feedback')
        .select('submissions(session_id), missing_points')
        .eq('submissions.session_id', session.id);

      if (feedbackError) throw feedbackError;

      const gaps = {};
      feedback.forEach(f => {
        if (f.missing_points) {
          f.missing_points.split(';').forEach(point => {
            point = point.trim();
            gaps[point] = (gaps[point] || 0) + 1;
          });
        }
      });

      const topGaps = Object.entries(gaps).sort(([,a],[,b]) => b-a).slice(0,10);
      const suggestions = topGaps.map(([point]) => `Reinforce: ${point}`);

      res.json({ session, submissionsCount: feedback.length, topGaps, suggestions });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
