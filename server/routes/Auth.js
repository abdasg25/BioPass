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
        user: { email: user.email, id: user._id },
        token
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  });




router.post('/generate-registration-options', async (req, res) => {
  const { username, displayName } = req.body;
  
  const user = await User.findOne({ username });
  const userID = user ? user._id : uuidv4();
  
  const options = generateRegistrationOptions({
    rpName: 'BioPass',
    rpID: process.env.RP_ID || 'localhost',
    userID,
    userName: username,
    userDisplayName: displayName,
    attestationType: 'none',
  });

  if (!user) {
    const newUser = new User({
      username,
      displayName,
      currentChallenge: options.challenge
    });
    await newUser.save();
  } else {
    user.currentChallenge = options.challenge;
    await user.save();
  }

  res.json(options);
});

// Registration - Verify response
router.post('/verify-registration', async (req, res) => {
  const { username, credential } = req.body;
  
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  try {
    const verification = await verifyRegistrationResponse({
      credential,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: process.env.ORIGIN || 'http://localhost:3000',
      expectedRPID: process.env.RP_ID || 'localhost',
    });

    if (verification.verified) {
      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
      
      user.credentials.push({
        credentialID: credentialID.toString('base64'),
        credentialPublicKey: credentialPublicKey.toString('base64'),
        counter,
        transports: credential.transports || [],
      });
      
      user.currentChallenge = null;
      await user.save();
      
      return res.json({ verified: true });
    }
    
    return res.status(400).json({ error: 'Verification failed' });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
});

// Authentication - Generate options
router.post('/generate-authentication-options', async (req, res) => {
  const { username } = req.body;
  
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  const options = generateAuthenticationOptions({
    allowCredentials: user.credentials.map(cred => ({
      id: Buffer.from(cred.credentialID, 'base64'),
      type: 'public-key',
      transports: cred.transports,
    })),
    userVerification: 'required',
  });

  user.currentChallenge = options.challenge;
  await user.save();

  res.json(options);
});

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