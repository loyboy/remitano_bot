Replace (domain.com) and (example@example.com) respectively. Before running install script, go to mailgun.com then replace the catchall callback domain to:

https://domain.com/api/messages

Create a $10 Centos 7 instance in your vultr account. Point (domain.com) to server. Open server console in vultr, login then type the following commands:

yum -y install unzip wget
cd /home

 { put your zip file in any location that you have the PUBLIC url } , for example:
wget https://dev.zoxza.media/remitano.zip
unzip remitano.zip

Run the following command:

bash setup.sh domain.com example@example.com

It'll take around 10 minutes. Once complete bot has been started and can be managed from:

https://domain.com/app/