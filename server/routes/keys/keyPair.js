const crypto = require('crypto');
const fs = require('fs');

// Generate the key pair
crypto.generateKeyPair('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'pkcs1', // 'pkcs1' or 'spki'
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs1', // 'pkcs1' or 'pkcs8'
    format: 'pem',
    cipher: 'aes-256-cbc', // optional: encrypt private key
    passphrase: ''         // optional passphrase
  }
}, (err, publicKey, privateKey) => {
  if (err) throw err;

  // Save to files
  fs.writeFileSync('server_public.pem', publicKey);
  fs.writeFileSync('server_private.pem', privateKey);

  console.log('Public and private keys generated.');
});
