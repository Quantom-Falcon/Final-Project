const express = require('express');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const { OpenAI } = require('openai');

const app = express();

// Serve static frontend
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.json());

// Set up file upload (PDF, image support)
const upload = multer({ storage: multer.memoryStorage() });

// OpenAI setup (key from Render environment)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


// ---------------------------
// 📄 Upload Resume Endpoint (PDF, PNG, JPEG)
// ---------------------------
app.post('/api/upload-resume', upload.single('resumeFile'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    let extractedText = '';

    if (file.mimetype === 'application/pdf') {
      const data = await pdfParse(file.buffer);
      extractedText = data.text;
    } else if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpeg'
    ) {
      const result = await Tesseract.recognize(file.buffer, 'eng');
      extractedText = result.data.text;
    } else {
      return res.status(400).json({ error: "Unsupported file type." });
    }

    res.json({ extractedText });
  } catch (err) {
    console.error("File parsing error:", err);
    res.status(500).json({ error: "Failed to extract text from file." });
  }
});


// ---------------------------
// 🤖 Rewrite Resume with OpenAI
// ---------------------------
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
