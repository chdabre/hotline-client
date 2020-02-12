#!/bin/sh

export PATH=/root/.nvm/versions/node/v13.5.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games
export GOOGLE_APPLICATION_CREDENTIALS=/root/hotline-client/google-cloud-credentials.json

cd /root/hotline-client || exit
git reset --hard HEAD
git pull
yarn

killall aplay
killall mplayer
killall node
aplay -Dplug:dmix -r 8000 -f S16_LE /dev/zero &
yarn start
