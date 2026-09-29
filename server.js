// Minimal backend for the AI tutor. Needs Node 18+ (no npm install required).
// Run:  ANTHROPIC_API_KEY=your_key node server.js     (Windows PowerShell: $env:ANTHROPIC_API_KEY="your_key"; node server.js)
// For local testing only: CORS is open to every origin. Restrict it before putting this online.
const http = require("http");

http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");
  if (req.method === "OPTIONS") return res.end();
  if (req.method !== "POST") return res.end(JSON.stringify({ reply: "StudyMate server is running" }));

  let body = "";
  for await (const chunk of req) body += chunk;
  try {
    const { messages, context } = JSON.parse(body);
    const m = messages.slice(-12);
    while (m[0] && m[0].role !== "user") m.shift(); // API needs the first message to be from the user

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-5", // change to any model available on your account
        max_tokens: 800,
        system: "You are a patient study tutor. Explain simply, give short examples, and check the student's understanding." +
                (context ? "\n\nThe student's notes:\n" + context : ""),
        messages: m
      })
    });
    const d = await r.json();
    res.end(JSON.stringify({ reply: (d.content && d.content[0] && d.content[0].text) || (d.error && d.error.message) || "No reply" }));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ reply: "Server error. Check your API key and the server console." }));
  }
}).listen(3000, () => console.log("StudyMate server on http://localhost:3000"));
