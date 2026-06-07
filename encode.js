// encode.js
const fs = require('fs');
const key = fs.readFileSync('./smart-deals-2202e-firebase-adminsdk-fbsvc-e5eb33b339.json', 'utf8');
const base64 = Buffer.from(key).toString('base64');
console.log(base64);
