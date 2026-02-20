const express = require('express');
const http = require('http');
const path = require('path');
const LaunchDarkly = require('launchdarkly-node-server-sdk');

const app = express();
const server = http.createServer(app);
// dynamic user key for context
const uuid = require('uuid');
const userKey = uuid.v4();


const PORT = process.env.PORT || 3000;
const LD_SDK_KEY = process.env.LD_SDK_KEY;

// Initialize the LaunchDarkly client only if SDK key is provided
let ldClient;
if (LD_SDK_KEY) {
  ldClient = LaunchDarkly.init(LD_SDK_KEY);
}
let context = {
  key: userKey,
  custom: {
    groups: 'beta_testers'
  }
};

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for serving the index.html file (main landing page)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for serving the welcome.html file (for backwards compatibility)
app.get('/welcome', (req, res) => {
  if (ldClient) {
    ldClient.variation('welcome-page', context, false).then(showFeature => {
      if (showFeature) {
        console.log('Showing feature for user welcome page');
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
      } else {
        res.redirect('/');
      }
    });
  } else {
    // If no LaunchDarkly client, always show welcome page
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Route for serving the mushroom game
app.get('/mushroom-game', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mushroom-game.html'));
});

// Route for serving the barista game
app.get('/barista', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'barista.html'));
});

// Route for serving the snake game
app.get('/snake-game', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'snake-game.html'));
});

// Serve the modules from public/modules folder
app.use('/modules', express.static(path.join(__dirname, 'public', 'modules')));

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});