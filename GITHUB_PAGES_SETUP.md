# GitHub Pages Deployment Guide

## Enabling GitHub Pages

After this PR is merged, the repository owner needs to enable GitHub Pages:

1. Go to the repository on GitHub: `https://github.com/ale-sanchez-g/mushy-washy`
2. Click on **Settings** (repository settings, not account settings)
3. In the left sidebar, click **Pages**
4. Under "Build and deployment":
   - **Source**: Select "GitHub Actions"
5. Save the settings

## Automatic Deployment

Once enabled, the workflow in `.github/workflows/deploy-pages.yml` will automatically:
- Trigger on every push to the `main` branch
- Build and deploy the `public` folder to GitHub Pages
- Make the games available at:
  - Landing page: `https://ale-sanchez-g.github.io/mushy-washy/`
  - Barista game: `https://ale-sanchez-g.github.io/mushy-washy/barista.html`
  - Mushroom game: `https://ale-sanchez-g.github.io/mushy-washy/mushroom-game.html`

## Local Testing

To test the static files locally without the Node.js server:

```bash
# Using Python 3
cd public
python3 -m http.server 8000

# Or using Python 2
cd public
python -m SimpleHTTPServer 8000

# Or using Node.js http-server (install globally first: npm install -g http-server)
cd public
http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

## File Structure

```
public/
├── index.html              # Landing page (main entry point)
├── barista.html            # Barista error budget game
├── mushroom-game.html      # Blue mushroom collection game
├── barista.js              # Barista game logic
├── baristaConfig.js        # Barista game configuration
├── game.js                 # Mushroom game logic
├── phaser.min.js           # Phaser game engine (local copy)
├── assets/                 # Images and CSS
│   ├── style.css
│   ├── blueMushroom.jpeg
│   └── basket.webp
└── modules/
    └── contextGenerator.js # LaunchDarkly context generator
```

All files use relative paths and work without a server backend.
