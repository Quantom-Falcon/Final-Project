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
// 🤖 Rewrite Resume + Feedback Endpoint
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
You are an expert resume reviewer and improvement assistant.

Please analyze and rewrite the following resume to better match the job description.

Then, return a response in this exact JSON format (no explanation, no markdown):

{
  "improvedResume": "Rewritten resume...",
  "score": 82,
  "improvements": [
    "Missing keywords",
    "Too vague in experience section",
    "No metrics used in achievements"
  ],
  "suggestions": [
    "Include keywords from the job description like React and TypeScript",
    "Add bullet points with measurable outcomes",
    "Tailor the summary to the job’s main responsibilities"
  ]
}

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

    // Parse JSON safely
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error("❌ Failed to parse JSON from GPT:", parseError.message);
      return res.status(500).json({ error: "OpenAI did not return valid JSON." });
    }

    console.log("✅ OpenAI returned structured response.");
    res.json(result);

  } catch (error) {
    console.error("❌ OpenAI error:", error.message);
    res.status(500).json({ error: "Failed to rewrite resume using OpenAI." });
  }
});

module.exports = app;
