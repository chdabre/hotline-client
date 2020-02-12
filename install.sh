#!/bin/sh

cd /root/hotline-client || exit
git pull
mkdir -p media
cp hotline.service /etc/systemd/system
systemctl daemon-reload
systemctl start hotline
