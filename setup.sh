#!/usr/bin/env bash

if [ "$1" = "" ]; then
 echo "Domain required"
 exit
fi
if [ "$2" = "" ]; then
 echo "Email required"
 exit
fi
  
PRESSL="
server {
  listen 80;
  server_name $1;
  root /usr/share/nginx/html;
  index index.html;

  location /api {
    proxy_http_version 1.1;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header Host \$http_host;
    proxy_set_header X-NginX-Proxy true;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_max_temp_file_size 0;
    proxy_pass http://localhost:8080;
    proxy_redirect off;
    proxy_read_timeout 240s;
   }
}
"
service firewalld stop
yum -y remove firewalld
iptables -F
iptables -X
yum update -y
curl -sL https://rpm.nodesource.com/setup_11.x | bash -
yum -y install libX11 libXcomposite libXcursor libXdamage libXext libXi libXtst cups-libs libXScrnSaver libXrandr alsa-lib pango atk at-spi2-atk gtk3 nodejs python-devel unzip cmake make
yum -y install epel-release
yum -y install nginx
yum -y groupinstall "Development Tools"
mkdir /home/public
mkdir /home/private
mkdir /home/private/storage

chmod -R 755 /home/public
echo "$1" > /home/public/index.html
rm -rf /etc/nginx/sites-*
echo "$PRESSL" > /etc/nginx/conf.d/server.conf
systemctl enable nginx
systemctl start nginx
service nginx reload
setenforce 0
mv /home/public/* /usr/share/nginx/html/


wget https://dl.eff.org/certbot-auto
chmod a+x certbot-auto
./certbot-auto --nginx --domain $1 --noninteractive --agree-tos --email $2 --redirect
cd /home/private
service nginx reload
npm i -g pm2
npm i node-lmdb fs-extra node-fetch user-agents puppeteer@3.1.0 moment shelljs node-cron
pm2 startup
clear
pm2 start /home/private/api.js
pm2 save
echo Bot Initiated