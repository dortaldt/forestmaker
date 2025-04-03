#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "\n${BLUE}=== Setting up HTTPS for Forest Maker Development ===${NC}\n"

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo -e "${YELLOW}mkcert is not installed. Installing it now...${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install mkcert
        brew install nss # for Firefox
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo -e "${YELLOW}Please install mkcert manually for your Linux distribution.${NC}"
        echo -e "See: https://github.com/FiloSottile/mkcert#installation"
        exit 1
    else
        echo -e "${YELLOW}Unsupported operating system. Please install mkcert manually.${NC}"
        echo -e "See: https://github.com/FiloSottile/mkcert#installation"
        exit 1
    fi
fi

# Make sure we're in the project root
cd "$(dirname "$0")/.."

echo -e "${GREEN}Creating certificates directory...${NC}"
mkdir -p certificates

echo -e "${GREEN}Installing local certificate authority...${NC}"
mkcert -install

echo -e "${GREEN}Generating certificates for local development...${NC}"
cd certificates
mkcert localhost 127.0.0.1 ::1 "$(hostname).local"

# Install required npm packages
cd ..
echo -e "${GREEN}Installing required npm packages...${NC}"
npm install --save http-proxy concurrently

echo -e "\n${GREEN}HTTPS setup complete!${NC}"
echo -e "${YELLOW}To start development with HTTPS access:${NC}"
echo -e "  npm run mobile-dev"
echo -e "\n${YELLOW}This will start both the Next.js dev server and the HTTPS proxy.${NC}"
echo -e "${YELLOW}Access your app from mobile at:${NC}"
echo -e "  https://YOUR-IP-ADDRESS:4000"
echo -e "\n${YELLOW}Find your IP address with:${NC}"
echo -e "  npm run find-ip"
echo -e "\n${YELLOW}Note: You may need to accept certificate warnings on your mobile device${NC}\n" 