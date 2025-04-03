#!/usr/bin/env node

/**
 * Simple HTTPS proxy for Next.js development server
 * This allows you to access your Next.js app via HTTPS on mobile devices
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { createProxyServer } = require('http-proxy');

// Configuration
const NEXT_DEV_PORT = 3000;
const HTTPS_PORT = 4000;
const LOCAL_IP = getLocalIp();
const CERT_DIR = path.join(process.cwd(), 'certificates');

// ANSI colors for terminal output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Check if certificates exist
let certExists = false;
try {
  fs.accessSync(path.join(CERT_DIR, 'localhost+3.pem'));
  fs.accessSync(path.join(CERT_DIR, 'localhost+3-key.pem'));
  certExists = true;
} catch (err) {
  console.log(`${colors.red}No certificates found in ${CERT_DIR}${colors.reset}`);
  console.log(`${colors.yellow}Please run the setup-https.sh script first:${colors.reset}`);
  console.log(`${colors.yellow}  ./scripts/setup-https.sh${colors.reset}`);
  process.exit(1);
}

// HTTPS options
const httpsOptions = {
  key: fs.readFileSync(path.join(CERT_DIR, 'localhost+3-key.pem')),
  cert: fs.readFileSync(path.join(CERT_DIR, 'localhost+3.pem'))
};

// Create proxy server to forward to Next.js
const proxy = createProxyServer({
  target: {
    host: 'localhost',
    port: NEXT_DEV_PORT
  },
  ws: true // Support WebSockets
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.error(`${colors.red}Proxy error:${colors.reset}`, err);
  res.writeHead(500, { 'Content-Type': 'text/plain' });
  res.end('Something went wrong with the proxy.');
});

// Create HTTPS server
const httpsServer = https.createServer(httpsOptions, (req, res) => {
  // Forward to Next.js
  proxy.web(req, res);
});

// Handle WebSockets
httpsServer.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

// Start listening
httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
  console.log('\n');
  console.log(`${colors.bold}${colors.blue}==== HTTPS Proxy for Next.js ====${colors.reset}`);
  console.log('\n');
  console.log(`${colors.green}HTTPS proxy running at:${colors.reset}`);
  console.log(`${colors.bold}  https://localhost:${HTTPS_PORT}${colors.reset}`);
  
  if (LOCAL_IP) {
    console.log(`${colors.bold}  https://${LOCAL_IP}:${HTTPS_PORT}${colors.reset}`);
  }
  
  console.log('\n');
  console.log(`${colors.yellow}Make sure your Next.js server is running:${colors.reset}`);
  console.log(`${colors.yellow}  npm run dev${colors.reset}`);
  console.log('\n');
  console.log(`${colors.yellow}IMPORTANT: You'll need to accept the certificate warning on your mobile device${colors.reset}`);
  console.log('\n');
});

// Helper function to get local IP address
function getLocalIp() {
  const interfaces = require('os').networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
} 