const express = require('express');
const router = express.Router();
const User = require('../models/User');
const QRSession = require('../models/QRSession');
const Device = require('../models/Device');
const {
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const qrcode = require('qrcode');
const crypto = require('crypto');
const base64url = require('base64url'); 
const { isoUint8Array } = require('@simplewebauthn/server/helpers');

// Registration - Generate options
// Email/Password Signup
// /api/auth/signup
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  // Validate required fields
  if (!username || !email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username, email and password are required.' 
    });
  }

  try {
    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered.' 
      });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already taken.' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success response
    res.json({
      success: true,
      message: 'Signup successful.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error.' 
    });
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
        user: { email: user.email, userId: `${user._id}`, username: user.username },
        token
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  });



// Replace both userinfo routes with this single one:

// Get user info by username or ID
router.get('/userinfo', async (req, res) => {
  const { userId } = req.query
  
  if (!userId) { 
    return res.status(400).json({ message: 'Username or userId required.' });
  }
  
  try {
    let user;
    

      user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    res.json({
      userId: `${user._id}`,
      email: user.email,
      username: user.username 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});



// // Generate QR code with session key (no username/email)
router.post('/generate-qr-session', async (req, res) => {
  try {
    const sessionKey = uuidv4();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    await QRSession.create({ sessionKey, createdAt: new Date(), expiresAt });

    const payload = JSON.stringify({ sessionKey });
    console.log(payload);
    qrcode.toDataURL(payload, (err, url) => {
      if (err) {
        console.error('QR code generation error:', err);
        return res.status(500).json({ error: 'QR code generation failed' });
      }
      res.json({ 
        qr: url, 
        payload: JSON.parse(payload) // Send as object instead of string
      });
    });
  } catch (error) {
    console.error('Error in generate-qr-session:', error);
    res.status(500).json({ error: 'Failed to generate QR session' });
  }
});



// Generate authentication options for QR code login




// Mobile device: verify session by signing sessionKey with passkey
router.post('/verify-qr-session', async (req, res) => {
  const { sessionKey, credential } = req.body;
  
  // Validate session
  const session = await QRSession.findOne({ sessionKey });
  if (!session || session.expiresAt < Date.now()) {
    return res.status(400).json({ error: 'Session key invalid or expired' });
  }

  try {
    // Find user by credentialId
    const user = await User.findOne({ 'credentials.credentialID': credential.id });
    if (!user) {
      return res.status(400).json({ error: 'Credential not registered' });
    }

    const dbCred = user.credentials.find(c => c.credentialID === credential.id);
    if (!dbCred) {
      return res.status(400).json({ error: 'Credential not found' });
    }

    const verification = await verifyAuthenticationResponse({
      credential: {
        id: credential.id,
        rawId: credential.rawId,
        response: {
          authenticatorData: credential.response.authenticatorData,
          clientDataJSON: credential.response.clientDataJSON,
          signature: credential.response.signature,
          userHandle: credential.response.userHandle
        },
        type: 'public-key'
      },
      expectedChallenge: session.challenge || sessionKey,
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
      session.markModified && session.markModified('authenticatedUserId');
      await session.save();
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
  // console.log('[poll-qr-session] Incoming request:', req.body);

  if (!sessionKey) {
    // console.log('[poll-qr-session] sessionKey missing in request body');
    return res.status(400).json({ authenticated: false, error: 'sessionKey required' });
  }

  const session = await QRSession.findOne({ sessionKey });
  // console.log('[poll-qr-session] QRSession.findOne result:', session);
  
  // Session doesn't exist
  if (!session) {
    // console.log(`[poll-qr-session] No session found for sessionKey: ${sessionKey}`);
    return res.json({ 
      authenticated: false,
      error: 'Session not found'
    });
  }

  // Session expired
  if (session.expiresAt < Date.now()) {
    // console.log(`[poll-qr-session] Session expired for sessionKey: ${sessionKey}, expiresAt: ${session.expiresAt}, now: ${Date.now()}`);
    await QRSession.deleteOne({ sessionKey });
    return res.json({ 
      authenticated: false,
      error: 'Session expired'
    });
  }

  // Session is authenticated
  if (session.authenticated && session.authenticatedUserId) {
    // console.log(`[poll-qr-session] Session authenticated for sessionKey: ${sessionKey}, userId: ${session.authenticatedUserId}`);
    return res.json({ 
      authenticated: true,
      userId: session.authenticatedUserId,
      webSessionToken: session.webSessionToken  // Return to frontend
    });
  }

  // Session exists but not authenticated yet
  // console.log(`[poll-qr-session] Session exists but not authenticated yet for sessionKey: ${sessionKey}`);
  return res.json({ 
    authenticated: false,
    status: 'waiting_for_authentication'
  });
});





// Middleware to verify JWT
function authMiddleware(req, res, next) {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided.' });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ success: false, message: 'Invalid token.' });
    req.user = decoded;
    next();
  });
}

// POST /register-device
router.post('/register-device', authMiddleware, async (req, res) => {
  const { deviceId, email } = req.body;
  let user;
    

  user = await User.findOne({ email });
  const userId = user._id;
  if (!deviceId && !userId) {
    return res.status(400).json({ success: false, message: 'Device ID and User ID required.' });
  }
  try {
    const updatedDevice = await Device.findOneAndUpdate(
      { userId }, // Find by userId only
      {
        $set: { deviceId },          // Always update deviceId
        $setOnInsert: { userId }     // Set userId only if inserting a new doc
      },
      {
        upsert: true,
        new: true
      }
    );
    

    res.json({ success: true, message: 'Device registered/updated.', data: updatedDevice });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /activate-qr-session
router.post('/activate-qr-session', authMiddleware, async (req, res) => {
  const { sessionKey, deviceId, email } = req.body;
  console.log(req.body);
  console.log("Incoming /activate-qr-session request:");
  console.log("sessionKey:", sessionKey);
  console.log("deviceId:", deviceId);
  console.log("email:", email);

  if (!sessionKey || !deviceId || !email) {
    console.warn("Missing required fields.");
    return res.status(400).json({ success: false, message: 'SessionKey, deviceId, and email are required.' });
  } 

  const session = await QRSession.findOne({sessionKey});
  console.log("Fetched session:", session);

  if (!session) {
    console.warn("QR session not found in DB.");
    return res.status(400).json({ success: false, message: 'QR session invalid.' });
  }

  if (session.expiresAt < Date.now()) {
    console.warn("QR session expired. expiresAt:", session.expiresAt, "Current time:", new Date());
    return res.status(400).json({ success: false, message: 'QR session expired.' });
  }

  if (session.authenticated) {
    console.warn("QR session already used.");
    return res.status(403).json({ success: false, message: 'QR session already authenticated.' });
  }

  const device = await Device.findOne({ deviceId });
  console.log("Fetched device:", device);

  if (!device) {
    console.warn("Device not registered. deviceId:", deviceId);
    return res.status(403).json({ success: false, message: 'Device not registered.' });
  }

  const user = await User.findOne({ email });
  console.log("Fetched user:", user);

  if (!user) {
    console.warn("User not found. email:", email);
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  // Mark session as authenticated
  session.authenticated = true;
  session.authenticatedUserId = user._id;
  session.deviceId = deviceId;

  try {
    session.webSessionToken = jwt.sign(
      { id: req.userId, web: true },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  } catch (err) {
    console.error("Error generating JWT:", err);
    return res.status(500).json({ success: false, message: 'Token generation failed.' });
  }

  await session.save();
  console.log("Session updated and saved.");

  return res.json({
    success: true,
    webSessionToken: session.webSessionToken
  });
});


module.exports = router;