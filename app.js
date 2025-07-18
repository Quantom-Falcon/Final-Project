const express = require('express');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.json());

app.post('/api/rewrite-resume', (req, res) => {
  const { resume, job } = req.body;

  if (!resume || !job) {
    return res.status(400).json({ error: 'Missing resume or job description' });
  }

  // Placeholder AI logic
  const improvedResume = `🔧 AI-enhanced Resume 🔧\n\n${resume}\n\n🔍 Tailored for job: ${job.slice(0, 100)}...`;

  res.json({ improvedResume });
});

module.exports = app;
