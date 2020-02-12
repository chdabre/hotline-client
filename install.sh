#!/bin/sh

cd /root/hotline-client || exit
git pull
mkdir -p media
cp config-example.js config.js
cp hotline.service /etc/systemd/system
systemctl daemon-reload
systemctl restart hotline
