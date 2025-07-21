const express = require('express');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');

const app = express();

app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.json());

// Setup multer for in-memory PDF upload
const upload = multer({ storage: multer.memoryStorage() });

// Initialize OpenAI client if API key is present
const apiKey = process.env.OPENAI_API_KEY;
let openai = null;

if (apiKey && apiKey.startsWith("sk-")) {
  openai = new OpenAI({ apiKey });
  console.log("✅ OpenAI API key loaded");
} else {
  console.log("⚠️ OpenAI API key is missing or invalid. GPT calls will be skipped.");
}

// ----------------------------------------
// 📄 Upload PDF Resume + Analyze with GPT
// ----------------------------------------
app.post('/api/upload-resume', upload.single('resumeFile'), async (req, res) => {
  const file = req.file;
  const job = req.body.jobDescription;

  if (!file || !job) {
    return res.status(400).json({ error: "Missing PDF file or job description." });
  }

  try {
    const pdfText = await pdfParse(file.buffer);
    const resume = pdfText.text;

    // If OpenAI is not configured, return mock response
    if (!openai) {
      return res.json({
        improvedResume: resume,
        score: 50,
        improvements: ["Mock: No clear formatting", "Mock: Skills are vague"],
        suggestions: ["Mock: Add project bullet points", "Mock: Quantify accomplishments"]
      });
    }

    const prompt = `
You are an AI resume reviewer. Your job is to analyze and rewrite resumes.

Instructions:
1. Rewrite the resume to better match the job description.
2. Score the original resume from 0–100.
3. List 3 areas needing improvement.
4. Give 3 specific suggestions to improve the resume.

Respond in this exact JSON format:
{
  "improvedResume": "...rewritten resume here...",
  "score": 85,
  "improvements": ["item 1", "item 2", "item 3"],
  "suggestions": ["tip 1", "tip 2", "tip 3"]
}

Resume:
${resume}

Job Description:
${job}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500
    });

    const jsonOutput = JSON.parse(response.choices[0].message.content.trim());

    res.json(jsonOutput);

  } catch (err) {
    console.error("❌ Error processing resume upload:", err);
    res.status(500).json({ error: "Failed to process and analyze the uploaded resume." });
  }
});

module.exports = app;
