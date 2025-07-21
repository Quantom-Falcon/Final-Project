app.post('/api/upload-resume', upload.single('resumeFile'), async (req, res) => {
  const file = req.file;
  const job = req.body.jobDescription;

  if (!file || !job) {
    return res.status(400).json({ error: "Missing PDF file or job description." });
  }

  try {
    const pdfData = await pdfParse(file.buffer);
    const resume = pdfData.text?.trim();

    if (!resume || resume.length < 30) {
      return res.status(400).json({ error: "Resume text could not be extracted or is too short." });
    }

    // If OpenAI is not configured, return mock data
    if (!openai) {
      return res.json({
        improvedResume: `${resume}\n\n[MOCK: tailored for job: ${job.slice(0, 60)}...]`,
        score: 72,
        improvements: ["Too few action verbs", "Not tailored to job keywords"],
        suggestions: [
          "Include skills from job posting in bullet points",
          "Quantify past achievements (e.g., 'Increased conversions by 20%')",
          "Shorten summary to 2–3 strong lines"
        ]
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
  "improvedResume": "...",
  "score": 85,
  "improvements": ["...", "..."],
  "suggestions": ["...", "..."]
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

    // Try to parse the JSON returned by GPT
    const content = response.choices[0].message.content.trim();
    const jsonOutput = JSON.parse(content);

    return res.json(jsonOutput);

  } catch (err) {
    console.error("❌ Upload Resume Error:", err.message || err);
    return res.status(500).json({ error: "Failed to process and analyze resume." });
  }
});
