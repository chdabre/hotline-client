# Hotline Client

Node.js Client for a one-way Chat network based on rotary phones and Telegram

## Installation

**Prerequisites**
- This Project is intended to be run on an Orange Pi Zero with Armbian Buster
- Requires Node 12
- The Software needs root access to run.
- The system relies on the Google Cloud TTS API. Before installing, download your Google API key from the Google Cloud Dashboard and place it in the project root directory with the name `google-cloud-credentials.json`

**Installation**
- Clone the repository to the `/root` directory and run `install.sh`.
- Copy the file `config-example.js` and rename it to `config.js`.
- Configure your client ID in the config file.
