const express = require('express');
const path = require('path');
const { OpenAI } = require('openai');

const app = express();
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.json());

const apiKey = process.env.OPENAI_API_KEY;
let openai = null;

if (apiKey && apiKey.startsWith("sk-")) {
  openai = new OpenAI({ apiKey });
  console.log("✅ OpenAI API key loaded");
} else {
  console.log("⚠️ No valid OpenAI API key, returning mock responses.");
}

// --------------------------------------------
// POST /api/rewrite-resume
// --------------------------------------------
app.post("/api/rewrite-resume", async (req, res) => {
  const { resume, job } = req.body;

  if (!resume || !job) {
    return res.status(400).json({ error: "Missing resume or job description." });
  }

  // Use mock if OpenAI isn't available
  if (!openai) {
    return res.json({
      improvedResume: `[MOCK RESPONSE]\n\n${resume}\n\n(Tailored to job: ${job.slice(0, 80)}...)`,
    });
  }

  try {
    const prompt = `
You are a professional resume assistant. Rewrite the following resume to better match the job description.
Use strong language, relevant keywords, and make it more impressive.

Resume:
${resume}

Job Description:
${job}

Rewritten Resume:
`;

    const result = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    });

    const improvedResume = result.choices[0].message.content.trim();
    res.json({ improvedResume });

  } catch (err) {
    console.error("❌ OpenAI error:", err.message);
    res.status(500).json({ error: "Failed to rewrite resume." });
  }
});

module.exports = app;
