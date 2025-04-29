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
// Registration - Generate options
// Email/Password Signup
// /api/auth/signup
router.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
  
    try {
      const existing = await User.findOne({ email });
      if (existing)
        return res.status(400).json({ success: false, message: 'Email already registered.' });
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ email, password: hashedPassword });
      await user.save();
  
      // Issue JWT on signup (optional: you can force login instead)
      const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
      res.json({
        success: true,
        message: 'Signup successful.',
        user: { email: user.email, id: user._id },
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

module.exports = router;    