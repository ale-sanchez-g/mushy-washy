const express = require('express');
const http = require('http');
const path = require('path');
const LaunchDarkly = require('@launchdarkly/node-server-sdk');

const app = express();
const server = http.createServer(app);
// dynamic user key for context
const uuid = require('uuid');
const userKey = uuid.v4();


const PORT = process.env.PORT || 3000;
const LD_SDK_KEY = process.env.LD_SDK_KEY || "YOUR_SDK_KEY";

// Initialize the LaunchDarkly client
const ldClient = LaunchDarkly.init(LD_SDK_KEY);
let context = {
  key: userKey,
  custom: {
    groups: 'beta_testers'
  }
};

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for serving the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for serving the welcome.html file
app.get('/welcome', (req, res) => {
    ldClient.variation('welcome-page', context, false,
      (err, showFeature) => {
        if (showFeature) {
          // the code to run if the feature is off
          console.log('Showing feature for user welcome page');
          res.sendFile(path.join(__dirname, 'public', 'welcome.html'));    
        } else {
          res.redirect('/');
        }
  });
});

// Serve the modules from public/modules folder
app.use('/modules', express.static(path.join(__dirname, 'public', 'modules')));

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});