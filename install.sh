#!/bin/bash
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 
   exit 1
fi

# Detect OS
# $os_version variables aren't always in use, but are kept here for convenience
if grep -qs "ubuntu" /etc/os-release; then
	os="ubuntu"
	os_version=$(grep 'VERSION_ID' /etc/os-release | cut -d '"' -f 2 | tr -d '.')
	group_name="nogroup"
elif [[ -e /etc/debian_version ]]; then
	os="debian"
	os_version=$(grep -oE '[0-9]+' /etc/debian_version | head -1)
	group_name="nogroup"
elif [[ -e /etc/centos-release ]]; then
	os="centos"
	os_version=$(grep -oE '[0-9]+' /etc/centos-release | head -1)
	group_name="nobody"
elif [[ -e /etc/fedora-release ]]; then
	os="fedora"
	os_version=$(grep -oE '[0-9]+' /etc/fedora-release | head -1)
	group_name="nobody"
else
	echo "This installer seems to be running on an unsupported distribution.
Supported distributions are Ubuntu, Debian, CentOS, and Fedora."
	exit
fi

if [[ "$os" == "ubuntu" && "$os_version" -lt 1804 ]]; then
	echo "Ubuntu 18.04 or higher is required to use this installer.
This version of Ubuntu is too old and unsupported."
	exit
fi

if [[ "$os" == "debian" && "$os_version" -lt 9 ]]; then
	echo "Debian 9 or higher is required to use this installer.
This version of Debian is too old and unsupported."
	exit
fi

if [[ "$os" == "centos" && "$os_version" -lt 7 ]]; then
	echo "CentOS 7 or higher is required to use this installer.
This version of CentOS is too old and unsupported."
	exit
fi
clear

echo
echo " 
################################################
#                UPDATING REPO                 #
################################################
"
echo
apt-get update upgrade
apt-get -y install wget
clear

# Get public IP and sanitize with grep
get_public_ip=$(grep -m 1 -oE '^[0-9]{1,3}(\.[0-9]{1,3}){3}$' <<< "$(wget -T 10 -t 1 -4qO- "http://ip1.dynupdate.no-ip.com/" || curl -m 10 -4Ls "http://ip1.dynupdate.no-ip.com/")")
PORT_API=3003
PORT_ADMIN=9003
read -p "Public IPv4 address / hostname [$get_public_ip]: " public_ip
# If the checkip service is unavailable and user didn't provide input, ask again
until [[ -n "$get_public_ip" || -n "$public_ip" ]]; do
	echo "Invalid input."
	read -p "Public IPv4 address / hostname: " public_ip
done
[[ -z "$public_ip" ]] && public_ip="$get_public_ip"


# Get bundle id
get_shared_secret_key="InstagramAPI!@#"
read -p "Shared Secret key [InstagramAPI!@#]: " shared_secret_key
[[ -z "$shared_secret_key" ]] && shared_secret_key="$get_shared_secret_key"

echo -n "Username of Insagram: "
read username

echo -n "Password of Insagram: "
read password

echo " 
################################################
#                INSTALL NODEJS                #
################################################
"

apt-get -y install curl software-properties-common
curl -sL https://deb.nodesource.com/setup_14.x | sudo bash -
apt-get -y install nodejs
clear

echo " 
################################################
#           Installing YARN & PM2              #
################################################
"
npm install yarn pm2 -g
clear

echo " 
################################################
#             Installing MONGODB               #
################################################
"
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | apt-key add -


if [[ "$os" == "debian" && "$os_version" == 10 ]]; then
	echo "deb http://repo.mongodb.org/apt/debian buster/mongodb-org/4.4 main" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list
fi
if [[ "$os" == "debian" && "$os_version" == 9 ]]; then
	echo "deb http://repo.mongodb.org/apt/debian stretch/mongodb-org/4.4 main" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list
fi

if [[ "$os" == "ubuntu" && "$os_version" == 1804 ]]; then
	echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.4 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list
fi
if [[ "$os" == "ubuntu" && "$os_version" == 1604 ]]; then
	echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/4.4 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list
fi
if [[ "$os" == "ubuntu" && "$os_version" == 2004 ]]; then
	echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list
fi

apt-get -y update
apt-get -y install mongodb-org

service mongod restart
clear

#CREATE STARTING SCRIPT SERVER
cat > .env <<EOF
NODE_ENV=production
SECRET_KEY = '$shared_secret_key'
USERNAME = '$username'
PASSWORD = '$password'
PORT=$PORT_API

EOF
mv .env server/.env
cat > start_server.sh <<EOF
cd server
yarn
pm2 start index.js --no-automation --name InstaBooster-API -- start
EOF


#CREATE STARTING SCRIPT ADMIN
cat > .env <<EOF
NODE_ENV=production
PORT=$PORT_ADMIN
HASH_CODE='$shared_secret_key'
PROXY_API=http://$public_ip:$PORT_API/instagram/api
API=http://$public_ip:$PORT_API/instagram/api
EOF
mv .env admin/.env

cat > start_admin.sh <<EOF
cd admin
yarn && yarn build
pm2 start server/index.js --no-automation --name InstaBooster-Admin -- start
EOF

chmod +x start_server.sh
chmod +x start_admin.sh

./start_server.sh
./start_admin.sh

echo " 
################################################
#             Congratulations!                 #
################################################

Your StrongVPN server is running.
   1. API: http://$public_ip:$PORT_API/instagram/api/
   2. CMS Admin: http://$public_ip:$PORT_ADMIN/
   3. Shared Secret Key: $shared_secret_key
"