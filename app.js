const express = require('express');
const path = require('path');
const { OpenAI } = require('openai');

const app = express();

app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/api/rewrite-resume', async (req, res) => {
  const { resume, job } = req.body;

  if (!resume || !job) {
    return res.status(400).json({ error: "Missing resume or job description." });
  }

  try {
    const prompt = `
You are an AI resume assistant. Rewrite the following resume to better match the job description. Focus on improving keyword alignment, skills, and phrasing — but keep the original experiences.

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
    res.json({ improvedResume });

  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({ error: "Failed to rewrite resume using OpenAI." });
  }
});

module.exports = app;
