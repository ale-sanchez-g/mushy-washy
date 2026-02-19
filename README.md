# Mushy Washy Games

## Description

Welcome to Mushy Washy! A collection of educational games including:

1. **Blue Mushroom Game** - A classic basket collection game
2. **Barista Error Budget Game** - An SRE education game teaching error budgeting concepts

![Game Image](public/assets/blueMushroom.jpeg)

## Games

### Blue Mushroom Game

Press and hold the up key to move your basket and collect your mushrooms. The more mushrooms you collect, the heavier your basket becomes.

### Barista Error Budget Game 🎓

An educational game designed to teach Site Reliability Engineering (SRE) concepts, specifically error budgeting.

**Game Features:**
- **Choose Your SLO**: Select from multiple Service Level Objective targets:
  - 100% - Perfect (No errors allowed)
  - 99.95% - Very High (5 errors per 10,000 orders)
  - 99.9% - High (10 errors per 10,000 orders)
  - 80% - Relaxed (2,000 errors per 10,000 orders)

- **Progressive Difficulty**: Start with simple coffee orders and progress through increasingly complex drinks:
  - Level 1: Simple orders (Regular Coffee, Black Coffee)
  - Level 2: Medium complexity (Cappuccino, Latte, Americano)
  - Level 3-4: Complex specialty drinks (Oat Milk Latte, Double Shot Espresso, Caramel Macchiato)

- **Error Budget Tracking**: Watch your error budget deplete as you fail orders. The game demonstrates how tighter SLOs leave less room for experimentation and mistakes.

- **Speed Progression**: Orders arrive faster as you advance through levels, simulating increased production load.

**Learning Objectives:**
- Understand the relationship between SLO targets and error budgets
- Experience how high SLO targets restrict experimentation
- Learn that lower error budgets make innovation harder
- See real-time impact of failed requests on system reliability

## Installation

To install the game, follow these steps:

1. Clone the repository: `git clone https://github.com/yourusername/bluemushroomgame.git`
2. Navigate to the project directory: `cd bluemushroomgame`
3. Install the dependencies: `npm install`
4. Start the server: `npm start`

## Usage

To play the games:

1. Start the server: `npm start`
2. Open your browser and navigate to:
   - Welcome page: `http://localhost:3000/welcome`
   - Blue Mushroom Game: `http://localhost:3000/`
   - Barista Game: `http://localhost:3000/barista`

## Server Routes

The server uses Express.js and serves static files from the 'public' directory.

- `/` - Blue Mushroom Game
- `/welcome` - Welcome page with game selection
- `/barista` - Barista Error Budget Game

## Feature Flags

The server uses the LaunchDarkly SDK for feature flagging. Each user is assigned a unique key and is part of the 'beta_testers' group. Feature flags can be used to enable or disable features for specific users or groups of users.

## Github Actions

Configuring the default GITHUB_TOKEN permissions

By default, when you create a new repository in your personal account, GITHUB_TOKEN only has read access for the contents and packages scopes. If you create a new repository in an organization, the setting is inherited from what is configured in the organization settings.

On GitHub.com, navigate to the main page of the repository.

Under your repository name, click  Settings. If you cannot see the "Settings" tab, select the  dropdown menu, then click Settings.

Screenshot of a repository header showing the tabs. The "Settings" tab is highlighted by a dark orange outline.
In the left sidebar, click  Actions, then click General.

Under "Workflow permissions", choose whether you want the GITHUB_TOKEN to have read and write access for all scopes (the permissive setting), or just read access for the contents and packages scopes (the restricted setting).

Click Save to apply the settings.

## Contributing

If you want to contribute to this project, please submit a pull request.

## License

This project is licensed under the MIT License.