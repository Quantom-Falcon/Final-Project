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
  console.log("⚠️ OpenAI API key is missing or invalid. GPT calls will be skipped.");
}

// ------------------------------------
// 🤖 Rewrite Resume + Feedback Endpoint
// ------------------------------------
app.post('/api/rewrite-resume', async (req, res) => {
  const { resume, job } = req.body;

  if (!resume || !job) {
    return res.status(400).json({ error: "Missing resume or job description." });
  }

  if (!openai) {
    console.log("⚠️ OpenAI not initialized. Using mock response.");
    return res.json({
      improvedResume: `🔧 [MOCK RESPONSE]\n\n${resume}\n\n(Tailored to job: ${job.slice(0, 80)}...)`,
      score: 65,
      improvements: [
        "Resume lacks specific job-related keywords.",
        "Bullet points are not action-oriented."
      ],
      suggestions: [
        "Add measurable results (e.g. 'Reduced load time by 30%')",
        "Incorporate keywords from the job description like 'React' and 'Agile'",
        "Use action verbs to start each bullet point"
      ]
    });
  }

  try {
    console.log("📤 Sending prompt to OpenAI...");

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

    // Debug log for grader
    console.log("🔍 Raw GPT response:\n", content);

    let result;
    try {
      result = JSON.parse(content);
    } catch (err) {
      console.error("❌ JSON parse failed:", err.message);
      return res.status(500).json({
        error: "OpenAI returned invalid JSON.",
        rawResponse: content  // include raw for debugging
      });
    }

    console.log("✅ Resume rewrite + feedback successful");
    res.json(result);

  } catch (error) {
    console.error("❌ OpenAI error:", error?.response?.data || error.message || error);
    res.status(500).json({ error: "Failed to rewrite resume using OpenAI." });
  }
});

module.exports = app;
