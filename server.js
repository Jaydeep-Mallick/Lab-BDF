// Same server, rewritten with Express
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// GET / -> welcome text
app.get('/', (req, res) => {
  res.status(200).send('Welcome to my Express server!');
});

// GET /about -> JSON with name and section
app.get('/about', (req, res) => {
  res.status(200).json({
    name: 'YOUR NAME HERE',
    section: 'YOUR SECTION HERE',
  });
});

// GET /time -> current date and time
app.get('/time', (req, res) => {
  res.status(200).send(`Current date and time: ${new Date()}`);
});

// Any other path -> 404 (must come AFTER all other routes)
app.use((req, res) => {
  res.status(404).send('404 - Page Not Found');
});

// Start the server only when run directly (node server.js);
// export the app so hosts like Vercel can use it too.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Express server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
