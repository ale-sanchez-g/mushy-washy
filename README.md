# Blue Mushroom Game

## Description

Welcome to Mushy Washy! This is a game where you move your basket to collect mushrooms. The more mushrooms you collect, the heavier your basket becomes.

![Game Image](public/assets/blueMushroom.jpeg)

## Instructions

Press and hold the up key to move your basket and collect your mushrooms.

## Installation

To install the game, follow these steps:

1. Clone the repository: `git clone https://github.com/yourusername/bluemushroomgame.git`
2. Navigate to the project directory: `cd bluemushroomgame`
3. Install the dependencies: `npm install`
4. Start the server: `npm start`

## Usage

To play the game, open the `welcome.html` file in your web browser.

## Server Routes

The server uses Express.js and serves static files from the 'public' directory.

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