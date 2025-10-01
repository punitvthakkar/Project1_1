// Vercel serverless function for /api/submissions
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

  const url = req.url; // for path params
  const pathParts = url.split('/');

  if (req.method === 'POST') {
    // Student submits
    try {
      const { sessionId, studentPlaceholder, filename, fileBase64 } = req.body;

      if (!sessionId || !filename || !fileBase64) {
        return res.status(400).json({ error: 'Session ID, filename, and file required' });
      }

      // Validate session ID
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single();

      if (sessionError || !session) {
        return res.status(404).json({ error: 'Invalid Session ID' });
      }

      // Get KAUs for the session
      const { data: kaus, error: kauError } = await supabase
        .from('kaus')
        .select('category, description')
        .eq('session_id', session.id)
        .eq('finalized', true);

      if (kauError) throw kauError;

      // Decode student submission
      const buffer = Buffer.from(fileBase64, 'base64');
      const studentText = buffer.toString('ascii'); // Simplify

      // Upload to Supabase Storage
      const filePath = `submissions/${sessionId}/${Date.now()}-${filename}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('closetheloop-files')
        .upload(filePath, buffer, {
          contentType: 'application/octet-stream', // TODO: proper MIME
          upsert: false
        });

      if (storageError) throw storageError;

      // Insert submission
      const { data: submission, error: subError } = await supabase
        .from('submissions')
        .insert([{
          session_id: session.id,
          student_placeholder: studentPlaceholder || 'Anonymous',
          filename,
          file_path: filePath
        }])
        .select()
        .single();

      if (subError) throw subError;

      // Prepare KAUs for prompt
      const kauList = kaus.map(k => `${k.category}: ${k.description}`).join('\n');

      // Call Gemini for feedback with structured output
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const feedbackSchema = {
        type: "object",
        properties: {
          highlights: { type: "string" },
          missingPoints: { type: "string" },
          reflectiveQuestions: { type: "string" },
          prescriptiveSuggestions: { type: "string" }
        },
        required: ["highlights", "missingPoints", "reflectiveQuestions", "prescriptiveSuggestions"]
      };
      const prompt = `Return ONLY valid JSON that matches this JSON Schema. Do not include any commentary.
Schema:
${JSON.stringify(feedbackSchema)}
Task: Evaluate the student's assignment submission pedagogically against these Key Areas of Understanding (KAUs). Use Bloom's Taxonomy to frame feedback. Provide in exactly 4 sections:

- highlights: Encouraging bullet points of strengths (e.g., application of knowledge).
- missingPoints: Constructive bullet points of gaps (e.g., needs deeper analysis).
- reflectiveQuestions: Socratic questions or hints to prompt self-reflection (e.g., "What would happen if...?").
- prescriptiveSuggestions: Teacher strategies to remedy class gaps, like differentiated instruction or active learning activities.

KAUs:
${kauList}

Student Submission:
${studentText}

Separate bullet points with semicolons; ensure empathetic, growth-oriented tone.`;

      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }]}],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
          stopSequences: ["```"]
        }
      });
      const feedbackJson = JSON.parse(response.response.text());
      const { highlights, missingPoints, reflectiveQuestions, prescriptiveSuggestions } = feedbackJson;

      // Insert feedback
      const { error: feedbackError } = await supabase
        .from('feedback')
        .insert([{
          submission_id: submission.id,
          highlights,
          missing_points: missingPoints,
          reflective_questions: reflectiveQuestions,
          prescriptive_suggestions: prescriptiveSuggestions
        }]);

      if (feedbackError) throw feedbackError;

      res.json({ submissionId: submission.id, feedback: { highlights, missingPoints, reflectiveQuestions, prescriptiveSuggestions } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to process submission' });
    }
  } else if (req.method === 'GET') {
    // Get feedback for a submission
    // path: /api/submissions/:id/feedback -> pathParts: ['', 'api', 'submissions', ':id', 'feedback']
    if (pathParts[4] === 'feedback') {
      const id = pathParts[3]; // submission id
      try {
        const { data: feedback, error } = await supabase
          .from('feedback')
          .select('*')
          .eq('submission_id', id)
          .single();

        if (error || !feedback) {
          return res.status(404).json({ error: 'Feedback not found' });
        }

        res.json(feedback);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch feedback' });
      }
    } else {
      res.status(404).json({ error: 'Endpoint not found' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
