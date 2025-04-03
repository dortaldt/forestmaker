#!/usr/bin/env node

const os = require('os');
const interfaces = os.networkInterfaces();
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

console.log('\n');
console.log(`${colors.bold}${colors.blue}=== Forest Maker Local Network Access ====${colors.reset}`);
console.log('\n');
console.log(`${colors.yellow}Use one of these URLs to access your app from mobile devices:${colors.reset}`);
console.log('\n');

// Find all possible network interfaces
let hasFound = false;
Object.keys(interfaces).forEach((interfaceName) => {
  interfaces[interfaceName].forEach((iface) => {
    // Skip internal/non-ipv4 addresses
    if (iface.family !== 'IPv4' || iface.internal !== false) {
      return;
    }
    
    // Display this as a potential URL to use
    console.log(`${colors.green}https://${iface.address}:4000${colors.reset}`);
    hasFound = true;
  });
});

if (!hasFound) {
  console.log(`${colors.yellow}No external network interfaces found. Make sure you're connected to a network.${colors.reset}`);
}

console.log('\n');
console.log(`${colors.yellow}IMPORTANT: You may need to accept certificate warnings on your mobile device.${colors.reset}`);
console.log(`${colors.yellow}This is normal for locally-generated certificates.${colors.reset}`);
console.log('\n'); 