#!/usr/bin/env node
const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.log('Usage: node utils/hashPassword.js <plain-password>');
  console.log('Example: node utils/hashPassword.js "Admin@123"');
  process.exit(1);
}

const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log('\n======================================================');
console.log('Sunbird Solar CRM - Secure Password Hash Generator');
console.log('======================================================');
console.log(`Password:    [HIDDEN] (${password.length} characters)`);
console.log(`Bcrypt Hash: ${hash}`);
console.log('------------------------------------------------------');
console.log('Add this line to your backend/.env file:');
console.log(`INITIAL_ADMIN_PASSWORD_HASH=${hash}`);
console.log('======================================================\n');
