# 📚 StudyMate – AI Study Assistant

A study companion that runs in the browser: write notes, turn them into flashcards, quiz yourself, stay focused with a timer, and ask an AI tutor questions.

Plain HTML, CSS and JavaScript. The optional AI tutor uses a tiny Node server.

## Features

- **Notes**: create, save and delete notes. Everything is stored in your browser (`localStorage`).
- **Summarize**: an offline summary that picks the most important sentences (no AI needed).
- **Flashcards**: add cards by hand, or write `Term: meaning` lines in a note and click **Make flashcards**. Mark cards *Got it* or *Again*. A card counts as mastered after 3 "Got it" in a row.
- **Quiz**: multiple-choice questions built from your own flashcards (up to 10 at a time).
- **Focus timer**: 25 minute focus and 5 minute break cycles, with a count of today's sessions.
- **AI tutor**: chat with an AI that can also read your current note as context.
- Light and dark mode (follows your system setting), mobile friendly.

## Files

```
study-assistant/
├── index.html   # page structure
├── style.css    # styling (colour tokens at the top)
├── script.js    # all app logic + CONFIG.API_URL
├── server.js    # optional backend for the AI tutor
└── README.md
```

## Run the app

Keep the files together and open `index.html` in a browser. Notes, flashcards, quiz and timer work straight away.

## Turn on the AI tutor

The AI tutor needs an API key, and keys must never be placed in browser code. That is why `server.js` exists: it keeps the key on your computer and forwards questions to the Claude API.

1. Install Node.js 18 or newer.
2. Get an API key from the Anthropic Console.
3. In a terminal, inside this folder:
   - Mac/Linux: `ANTHROPIC_API_KEY=your_key node server.js`
   - Windows PowerShell: `$env:ANTHROPIC_API_KEY="your_key"; node server.js`
4. In `script.js`, set `const CONFIG = { API_URL: "http://localhost:3000" };`
5. Reload the page and open the **AI tutor** tab.

The model name is set in `server.js`. Change it if your account uses a different one.

**Before putting it online:** `server.js` currently allows requests from any website. Restrict the allowed origin and add rate limiting first, otherwise others could spend your API credit.

## Limits

- Data is saved per browser. Clearing site data deletes your notes and cards.
- The summary is a simple word-frequency method, so it works best on plain paragraphs.
- The AI tutor does not work until the server is running and the key is set.

## License

Free to use and modify for learning and personal projects.
