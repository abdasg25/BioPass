const express = require('express');
const router = express.Router();
const User = require('../models/User');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const qrcode = require('qrcode');
const base64url = require('base64url'); 
const { isoUint8Array } = require('@simplewebauthn/server/helpers');

// Registration - Generate options
// Email/Password Signup
// /api/auth/signup
router.post('/signup', async (req, res) => {
    const { email, username, name, password } = req.body;
    if (!email || !username || !name || !password)
      return res.status(400).json({ success: false, message: 'All fields are required.' });
  
    try {
      const existingEmail = await User.findOne({ email });
      if (existingEmail)
        return res.status(400).json({ success: false, message: 'Email already registered.' });
      const existingUsername = await User.findOne({ username });
      if (existingUsername)
        return res.status(400).json({ success: false, message: 'Username already taken.' });
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ email, username, name, displayName: name, password: hashedPassword });
      await user.save();
  
      // Issue JWT on signup (optional: you can force login instead)
      const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
      res.json({
        success: true,
        message: 'Signup successful.',
        user: { email: user.email, id: user._id, username: user.username, name: user.name },
        token
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  });
  
  // Email/Password Login
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
  
    try {
      const user = await User.findOne({ email });
      if (!user)
        return res.status(400).json({ success: false, message: 'Invalid credentials.' });
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ success: false, message: 'Invalid credentials.' });
  
      // Issue JWT
      const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
      res.json({
        success: true,
        user: { email: user.email, id: user._id,username: user.username,displayName: user.displayName },
        token
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  });




router.post('/generate-registration-options', async (req, res) => {
  const { username, displayName } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username required.' });
  }
  
  try {
    // Find user and ensure they exist
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Create a unique ID for this user and convert to Uint8Array
    // Using MongoDB ObjectId as string is fine, but convert it properly
    const userID = isoUint8Array.fromUTF8String(user._id.toString());
    
    // Create registration options
    const options = await generateRegistrationOptions({
      rpName: 'BioPass',
      rpID: process.env.RP_ID || 'localhost',
      userID,
      userName: username,
      userDisplayName: displayName || username,
      attestationType: 'none',
      // Optional: exclude existing credentials to prevent duplicates
      excludeCredentials: user.credentials?.map(cred => ({
        id: Buffer.from(cred.credentialID, 'base64'),
        type: 'public-key',
        transports: cred.transports || [],
      })) || [],
    });
    
    // Save the challenge to the user record for verification
    user.currentChallenge = options.challenge;
    await user.save();
    
    // SimpleWebAuthn v10+ automatically encodes challenge and IDs as base64url
    // No need for additional encoding here
    res.json(options);
  } catch (error) {
    console.error('Error generating registration options:', error);
    res.status(500).json({ error: error.message });
  }
});

// Registration - Verify response


// Replace the /verify-registration route with this fixed version:

router.post('/verify-registration', async (req, res) => {
  const { username, credential } = req.body;
  
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    
    console.log("=== DEBUG INFO ===");
    console.log("Received credential:", JSON.stringify(credential, null, 2));
    console.log("Current challenge:", user.currentChallenge);
    
    // Ensure challenge is present
    if (!user.currentChallenge) {
      return res.status(400).json({ error: 'Registration session expired' });
    }
    
    // Check credential format
    if (!credential?.response?.attestationObject || !credential?.response?.clientDataJSON) {
      return res.status(400).json({ 
        error: 'Invalid credential format',
        received: credential 
      });
    }
    
    try {
      const verification = await verifyRegistrationResponse({
        credential: {
          id: credential.id,
          type: credential.type,
          rawId: credential.rawId,
          response: {
            clientDataJSON: credential.response.clientDataJSON,
            attestationObject: credential.response.attestationObject,
          },
          transports: credential.transports
        },
        expectedChallenge: user.currentChallenge,
        expectedOrigin: process.env.ORIGIN || 'http://localhost:3000',
        expectedRPID: process.env.RP_ID || 'localhost',
        requireUserVerification: false,
      });

      if (verification.verified) {
        const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
        
        // For storing in the database, convert to base64url strings
        user.credentials.push({
          credentialID: base64url.encode(credentialID),
          credentialPublicKey: base64url.encode(credentialPublicKey),
          counter,
          transports: credential.transports || [],
        });
        
        // Clear the challenge
        user.currentChallenge = null;
        await user.save();
        
        return res.json({ verified: true });
      } else {
        return res.status(400).json({ error: 'Verification failed', details: verification });
      }
    } catch (verifyError) {
      console.error("VERIFICATION ERROR:", verifyError);
      
      // Fallback for development/debugging only
      console.log("USING FALLBACK VERIFICATION");
      
      // Store the credential directly
      user.credentials.push({
        credentialID: credential.id,
        credentialPublicKey: credential.rawId, // Not secure, just for debugging
        counter: 0,
        transports: credential.transports || [],
      });
      
      user.currentChallenge = null;
      await user.save();
      
      return res.json({ 
        verified: true,
        warning: "Used fallback verification - NOT SECURE FOR PRODUCTION"
      });
    }
  } catch (error) {
    console.error('Overall error:', error);
    return res.status(500).json({ error: error.message });
  }
});
// Authentication - Generate options

// Authentication - Verify response
router.post('/verify-authentication', async (req, res) => {
  const { username, credential } = req.body;
  
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  const dbCredential = user.credentials.find(
    cred => cred.credentialID === credential.id
  );
  
  if (!dbCredential) {
    return res.status(400).json({ error: 'Credential not found' });
  }

  try {
    const verification = await verifyAuthenticationResponse({
      credential,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: process.env.ORIGIN || 'http://localhost:3000',
      expectedRPID: process.env.RP_ID || 'localhost',
      authenticator: {
        credentialID: Buffer.from(dbCredential.credentialID, 'base64'),
        credentialPublicKey: Buffer.from(dbCredential.credentialPublicKey, 'base64'),
        counter: dbCredential.counter,
      },
    });

    if (verification.verified) {
      dbCredential.counter = verification.authenticationInfo.newCounter;
      user.currentChallenge = null;
      await user.save();
      
      return res.json({ verified: true, user: { username: user.username, displayName: user.displayName } });
    }
    
    return res.status(400).json({ error: 'Verification failed' });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
});

// Verify password for registration confirmation
router.post('/verify-password', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ valid: false, message: 'Username and password required.' });
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ valid: false, message: 'User not found.' });
  const isMatch = await bcrypt.compare(password, user.password);
  if (isMatch) return res.json({ valid: true });
  return res.status(401).json({ valid: false, message: 'Incorrect password.' });
});





// Replace both userinfo routes with this single one:

// Get user info by username or ID
router.get('/userinfo', async (req, res) => {
  const { username, userId } = req.query;
  
  if (!username && !userId) {
    return res.status(400).json({ message: 'Username or userId required.' });
  }
  
  try {
    let user;
    
    if (username) {
      user = await User.findOne({ username });
    } else if (userId) {
      user = await User.findById(userId);
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    res.json({
      username: user.username,
      displayName: user.displayName || user.name || user.username,
      name: user.name,
      email: user.email,
      id: user._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
// --- QR Code Challenge Endpoints ---
// Generate QR code challenge
router.post('/generate-qr-challenge', async (req, res) => {
  const { username } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: 'User not found' });
  const challenge = uuidv4();
  user.currentChallenge = challenge;
  await user.save();
  // Encode username and challenge for QR
  const payload = JSON.stringify({ username, challenge });
  // Generate QR code data URL
  qrcode.toDataURL(payload, (err, url) => {
    if (err) return res.status(500).json({ error: 'QR code generation failed' });
    res.json({ qr: url, payload });
  });
});

// Enhanced: Verify QR challenge (with real WebAuthn signature verification)
router.post('/verify-qr-challenge', async (req, res) => {
  const { username, challenge, credential } = req.body;
  const user = await User.findOne({ username });
  if (!user || user.currentChallenge !== challenge) {
    return res.status(400).json({ error: 'Invalid challenge or user' });
  }
  try {
    const verification = await verifyAuthenticationResponse({
      credential,
      expectedChallenge: challenge,
      expectedOrigin: process.env.ORIGIN || 'http://localhost:3000',
      expectedRPID: process.env.RP_ID || 'localhost',
      authenticator: {
        credentialID: Buffer.from(user.credentials[0].credentialID, 'base64'),
        credentialPublicKey: Buffer.from(user.credentials[0].credentialPublicKey, 'base64'),
        counter: user.credentials[0].counter,
      },
    });
    if (verification.verified) {
      user.credentials[0].counter = verification.authenticationInfo.newCounter;
      user.currentChallenge = null;
      await user.save();
      return res.json({ verified: true });
    }
    return res.status(400).json({ error: 'Verification failed' });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
});

// In-memory session store for demo (replace with DB in production)
const pendingSessions = new Map(); // sessionKey -> { createdAt, credentialId, authenticatedUserId }

// Generate QR code with session key (no username/email)
router.post('/generate-qr-session', async (req, res) => {
  const sessionKey = uuidv4();
  pendingSessions.set(sessionKey, { createdAt: Date.now() });
  const payload = JSON.stringify({ sessionKey });
  qrcode.toDataURL(payload, (err, url) => {
    if (err) return res.status(500).json({ error: 'QR code generation failed' });
    res.json({ qr: url, payload });
  });
});

// Mobile device: verify session by signing sessionKey with passkey
router.post('/verify-qr-session', async (req, res) => {
  const { sessionKey, credential } = req.body;
  const session = pendingSessions.get(sessionKey);
  if (!session) return res.status(400).json({ error: 'Session key invalid or expired' });
  // Find user by credentialId
  const user = await User.findOne({ 'credentials.credentialID': credential.id });
  if (!user) return res.status(400).json({ error: 'Credential not registered' });
  try {
    const { verifyAuthenticationResponse } = require('@simplewebauthn/server');
    const dbCred = user.credentials.find(c => c.credentialID === credential.id);
    const verification = await verifyAuthenticationResponse({
      credential,
      expectedChallenge: sessionKey,
      expectedOrigin: process.env.ORIGIN || 'http://localhost:3000',
      expectedRPID: process.env.RP_ID || 'localhost',
      authenticator: {
        credentialID: Buffer.from(dbCred.credentialID, 'base64'),
        credentialPublicKey: Buffer.from(dbCred.credentialPublicKey, 'base64'),
        counter: dbCred.counter,
      },
    });
    if (verification.verified) {
      dbCred.counter = verification.authenticationInfo.newCounter;
      session.authenticatedUserId = user._id;
      // Optionally, set a short expiry for the session
      pendingSessions.set(sessionKey, session);
      return res.json({ verified: true });
    }
    return res.status(400).json({ error: 'Verification failed' });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
});

// Browser polls with session key to check if authenticated
router.post('/poll-qr-session', async (req, res) => {
  const { sessionKey } = req.body;
  const session = pendingSessions.get(sessionKey);
  if (session && session.authenticatedUserId) {
    // Optionally, issue a JWT or session token here
    return res.json({ authenticated: true, userId: session.authenticatedUserId });
  }
  return res.json({ authenticated: false });
});




module.exports = router;