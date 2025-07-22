app.post('/api/rewrite-resume', async (req, res) => {
  const { resume, job } = req.body;

  if (!resume || !job) {
    return res.status(400).json({ error: "Missing resume or job description." });
  }

  // Use mock response if OpenAI is not configured
  if (!openai) {
    return res.json({
      improvedResume: `[MOCK] ${resume}`,
      score: 60,
      improvements: ["Mock: Lacks relevant keywords", "Mock: Poor formatting"],
      suggestions: [
        "Add metrics to your accomplishments (e.g., 'Increased conversions by 20%')",
        "Include more job-specific keywords from the job description",
        "Use action verbs at the beginning of bullet points"
      ]
    });
  }

  try {
    console.log("📤 Sending prompt to OpenAI...");

    const prompt = `
You are a resume analyst. Based on the resume and job description below, return the following in JSON format:

{
  "improvedResume": "Rewritten resume tailored to the job",
  "score": 85,
  "improvements": [
    "What's wrong with the original resume"
  ],
  "suggestions": [
    "What the user can do to improve it"
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

    const responseText = completion.choices[0].message.content.trim();
    const result = JSON.parse(responseText);

    console.log("✅ OpenAI returned full response.");
    res.json(result);

  } catch (error) {
    console.error("❌ OpenAI error:", error);
    res.status(500).json({ error: "Failed to process resume using OpenAI." });
  }
});
