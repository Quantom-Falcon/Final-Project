const express = require('express');
const path = require('path');
const { OpenAI } = require('openai');
const multer = require('multer');
const pdfParse = require('pdf-parse');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.json());

const apiKey = process.env.OPENAI_API_KEY;
let openai = null;

if (apiKey && apiKey.startsWith("sk-")) {
  openai = new OpenAI({ apiKey });
  console.log("✅ OpenAI API key loaded");
} else {
  console.log("⚠️ OpenAI API key is missing or invalid. GPT calls will be skipped.");
}

// ------------------------------------
// 📝 Rewrite Resume (Plain Text Input)
// ------------------------------------
app.post('/api/rewrite-resume', async (req, res) => {
  const { resume, job } = req.body;

  if (!resume || !job) {
    return res.status(400).json({ error: "Missing resume or job description." });
  }

  return await handleRewrite(resume, job, res);
});

// ------------------------------------
// 📄 Upload PDF Resume + Job Description
// ------------------------------------
app.post('/api/upload-resume', upload.single('resumeFile'), async (req, res) => {
  const file = req.file;
  const job = req.body.job;

  if (!file || !job) {
    return res.status(400).json({ error: "Missing PDF resume or job description." });
  }

  try {
    const pdfData = await pdfParse(file.buffer);
    const extractedText = pdfData.text.trim();
    if (!extractedText) {
      return res.status(400).json({ error: "Could not extract text from the PDF." });
    }

    return await handleRewrite(extractedText, job, res);
  } catch (err) {
    console.error("❌ PDF extraction error:", err.message);
    return res.status(500).json({ error: "Failed to extract resume text from PDF." });
  }
});

// ------------------------------------
// ✨ Shared GPT Handler Function
// ------------------------------------
async function handleRewrite(resume, job, res) {
  if (!openai) {
    console.log("⚠️ OpenAI not initialized. Using mock response.");
    return res.json({
      improvedResume: `🔧 [MOCK RESPONSE]\n\n${resume}`,
      score: 65,
      improvements: ["Resume lacks job-specific keywords", "No measurable results"],
      suggestions: ["Add action verbs", "Include tools from job description", "Quantify accomplishments"]
    });
  }

  try {
    const prompt = `
You are a professional resume optimization assistant.

Analyze the resume in the context of the job description.

1. Rewrite the resume to better match the job description.
2. Give a score from 0 to 100 based on how well it fits the job.
3. List 3 specific improvement areas based on what is lacking.
4. Provide 3 concrete suggestions to improve the resume.

Return ONLY a valid JSON object like this:
{
  "improvedResume": "...",
  "score": 87,
  "improvements": ["..."],
  "suggestions": ["..."]
}

Do not return any explanations or extra formatting. Output only the JSON.
Resume:
${resume}

Job Description:
${job}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500
    });

    const content = completion.choices[0].message.content.trim();
    console.log("🔍 Raw GPT response:\n", content);

    let result;
    try {
      result = JSON.parse(content);
    } catch (err) {
      console.error("❌ JSON parse failed:", err.message);
      return res.status(500).json({
        error: "OpenAI returned invalid JSON.",
        rawResponse: content
      });
    }

    console.log("✅ Resume rewrite + feedback successful");
    res.json(result);
  } catch (error) {
    console.error("❌ OpenAI error:", error?.response?.data || error.message || error);
    return res.status(500).json({ error: "Failed to rewrite resume using OpenAI." });
  }
}

module.exports = app;
