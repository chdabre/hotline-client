# Hotline Client

Node.js Client for a one-way Chat network based on rotary phones and Telegram

Server: https://github.com/chdabre/hotline-server

## Installation

**Prerequisites**
- This Project is intended to be run on an Orange Pi Zero with Armbian Buster
- The Software needs root access to run.

**Device setup**
- Install Armbian Buster
- Connect to WiFi using serial port at 115200 baud. Command: `nmcli d wifi connect my_wifi password <password>`
- run apt update & apt upgrade
- apt install `mplayer opus-tools`
- install nvm, node 13.5.0, yarn

**Installation**
- Clone the repository to the `/root` directory
- The system relies on the Google Cloud TTS API. Before installing, download your Google API key from the Google Cloud Dashboard and place it in the project root directory with the name `google-cloud-credentials.json`
- run `install.sh`.
- Copy the file `config-example.js` and rename it to `config.js`.
- Configure your client ID in the config file.
