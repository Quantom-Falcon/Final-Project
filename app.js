const express = require('express');
const path = require('path');
const { OpenAI } = require('openai');

const app = express();

app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.json());

// Initialize OpenAI client only if key is set
const apiKey = process.env.OPENAI_API_KEY;
let openai = null;

if (apiKey && apiKey.startsWith("sk-")) {
  openai = new OpenAI({ apiKey });
  console.log("✅ OpenAI API key loaded");
} else {
  console.log("⚠️ OpenAI API key is missing or invalid. GPT calls will be skipped.");
}

// ------------------------------------
// 🤖 Rewrite Resume Endpoint
// ------------------------------------
app.post('/api/rewrite-resume', async (req, res) => {
  const { resume, job } = req.body;

  if (!resume || !job) {
    return res.status(400).json({ error: "Missing resume or job description." });
  }

  // Use mock response if OpenAI is not configured
  if (!openai) {
    console.log("⚠️ OpenAI client not initialized. Returning mock response.");
    return res.json({
      improvedResume: `🔧 [MOCK RESPONSE]\n\n${resume}\n\n(Tailored to job: ${job.slice(0, 80)}...)`
    });
  }

  try {
    console.log("📤 Sending prompt to OpenAI...");

    const prompt = `
You are an AI resume assistant. Rewrite the following resume to better match the job description.
Focus on keyword alignment, skill enhancement, and phrasing.
Keep the original experiences but make it more relevant and compelling.

Resume:
${resume}

Job Description:
${job}

Rewritten Resume:
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    });

    const improvedResume = completion.choices[0].message.content.trim();

    console.log("✅ OpenAI returned improved resume.");
    res.json({ improvedResume });

  } catch (error) {
    console.error("❌ OpenAI error:", error);
    res.status(500).json({ error: "Failed to rewrite resume using OpenAI." });
  }
});

module.exports = app;
