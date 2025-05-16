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
const OtpToken = require('../models/OtpToken');
const nodemailer = require('nodemailer');
require('dotenv').config()

const fs = require('fs');
const path = require('path');

const privateKey = fs.readFileSync(path.join(__dirname, 'keys', 'private_key.pem'), 'utf8');
const publicKey = fs.readFileSync(path.join(__dirname, 'keys', 'public_key.pem'), 'utf8');

  
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Username, email and password are required.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered.' });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ success: false, message: 'Username already taken.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      authenticated: false
    });

    await newUser.save();

    // Generate OTP and save
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OtpToken.create({ email, otp, expiresAt });

    // Send OTP via email
    const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your BioPass OTP Code</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; background-color: #f9fafb;">
      <table role="presentation" style="width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        <!-- Header -->
        <tr>
          <td style="padding: 24px; background-color: #4f46e5; text-align: center;">
            <table role="presentation" style="margin: 0 auto;">
              <tr>
                <td>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#ffffff">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </td>
                <td style="padding-left: 8px;">
                  <span style="font-size: 24px; font-weight: 700; color: #ffffff;">BioPass</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding: 32px 24px; text-align: center;">
            <h1 style="font-size: 24px; font-weight: 600; color: #111827; margin: 0 0 16px;">Your OTP Code</h1>
            <p style="font-size: 16px; color: #4b5563; margin: 0 0 24px;">Use the following one-time password to complete your authentication. It expires in 5 minutes.</p>
            <div style="display: inline-block; padding: 16px 24px; background-color: #f3f4f6; border-radius: 8px; margin: 16px 0;">
              <span style="font-size: 28px; font-weight: 700; color: #4f46e5; letter-spacing: 4px;">${otp}</span>
            </div>
            <div style="margin: 16px 0;">
              <a href="javascript:void(0)" onclick="navigator.clipboard.writeText('${otp}')" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 500; text-decoration: none; border-radius: 8px; transition: background-color 0.2s;">Copy OTP</a>
            </div>
            <p style="font-size: 14px; color: #6b7280; margin: 24px 0 0;">If you didn't request this code, please ignore this email or contact support.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding: 16px 24px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280; margin: 0;">&copy; 2025 BioPass. All rights reserved.</p>
            <p style="font-size: 12px; color: #6b7280; margin: 8px 0 0;">
              <a href="/support" style="color: #4f46e5; text-decoration: none;">Support</a> | 
              <a href="/privacy" style="color: #4f46e5; text-decoration: none;">Privacy Policy</a>
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  await transporter.sendMail({
    from: `"BioPass" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP Code',
    html: htmlTemplate,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8'
      }
  });

    return res.json({
      success: true,
      message: 'User created. OTP sent to email for verification.'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});


router.post('/verify-otp-signup', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP required.' });
  }

  try {
    const token = await OtpToken.findOne({ email, otp });

    if (!token) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });

    // Mark user as verified
    await User.updateOne({ email }, { $set: { authenticated: true } });

    // Delete OTP token
    await OtpToken.deleteOne({ email });

    return res.json({ success: true, message: 'Email verified successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
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
      const userId = user._id;
      let deviceId = ''; // Initialize with empty string

try {
  const device = await Device.findOne({ userId });
  if (device) {
    deviceId = device.deviceId; // Only set deviceId if device exists
  }
} catch (error) {
  console.error('Error fetching device:', error);
  // deviceId remains empty string if there's an error
}
      // Issue JWT
      const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
      res.json({
        success: true,
        user: { email: user.email, userId: `${user._id}`, username: user.username,deviceId:deviceId },
        token
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  });


router.post('/biometric-login', async (req, res) => {
  const {email} = req.body;
  
  if(!email){
    return res.status(400).json({ success: false, message: 'Email is required.' });
  } try {
      const user = await User.findOne({ email });
      if (!user)
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

}
)


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




function encryptPayload(payload) {
  const algorithm = 'aes-256-cbc';
  const iv = crypto.randomBytes(16);
  const secretKeyHex = process.env.QR_SECRET_KEY;  // your 64-char hex string
  const secretKey = Buffer.from(secretKeyHex, 'hex');
  console.log("[DEBUG] SECRET KEY - ",secretKey);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);

  let encrypted = cipher.update(JSON.stringify(payload));
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Combine IV and encrypted data
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}
  

router.post('/generate-qr-session', async (req, res) => {
  try {
    const sessionKey = uuidv4();
    console.log('[DEBUG] Creating QRSession with sessionKey:', sessionKey);

    const payloadObj = { sessionKey };
    const payloadString = JSON.stringify(payloadObj);
    console.log('[DEBUG] Payload before encryption:', payloadString);

    const encryptedPayload = encryptPayload(payloadString); // make sure it encrypts string input
    if (!encryptedPayload) {
      console.error('[ERROR] Encrypted payload is undefined or null');
      return res.status(500).json({ error: 'Encryption failed' });
    }

    // Get payload size in bytes
    const getPayloadSizeInBytes = (payloadStr) => {
      const [ivHex, encryptedHex] = payloadStr.split(':');
      return (ivHex.length + encryptedHex.length) / 2; // each 2 hex chars = 1 byte
    };

    const payloadSizeBytes = getPayloadSizeInBytes(encryptedPayload);
    console.log('[DEBUG] Encrypted payload size (bytes):', payloadSizeBytes);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await QRSession.create({ sessionKey, createdAt: new Date(), expiresAt });
    const qrPayload = JSON.stringify({ sessionKey: encryptedPayload });
    qrcode.toDataURL(qrPayload, (err, url) => {
      if (err) {
        console.error('[ERROR] QR code generation error:', err);
        return res.status(500).json({ error: 'QR code generation failed' });
      }

      console.log('[DEBUG] QR Code URL generated successfully');
      res.json({ 
        qr: url, 
        payload: payloadObj,  // return plain payload (optional for debug)
        encryptedPayload,     // return encrypted payload too (optional)
        sizeBytes: payloadSizeBytes
      });
    });
  } catch (error) {
    console.error('[FATAL] Error in generate-qr-session:', error);
    res.status(500).json({ error: 'Failed to generate QR session' });
  }
});








// Generate authentication options for QR code login





        
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


function decryptPayload(encryptedPayload) {
  const algorithm = 'aes-256-cbc';
  const secretKeyHex = process.env.QR_SECRET_KEY; // 64-character hex string (32 bytes)
  const secretKey = Buffer.from(secretKeyHex, 'hex');

  try {
    if (!encryptedPayload || !encryptedPayload.includes(':')) {
      throw new Error('Invalid payload format. Expected "iv:encryptedData"');
    }

    const [ivHex, encryptedHex] = encryptedPayload.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedData = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return JSON.parse(decrypted.toString()); // since you encrypted JSON.stringify(payload)
  } catch (err) {
    console.error('[Decryption Error]', err.message);
    return null;
  }
}
// POST /activate-qr-session
router.post('/activate-qr-session', authMiddleware, async (req, res) => {
  const { sessionKey: encryptedSessionKey, deviceId,email } = req.body;
const decrypted = decryptPayload(encryptedSessionKey);
console.log("DECRYPTED SESSION KEY FROM FRONTEND",decrypted);
if (!decrypted && !decrypted.sessionKey) {
  return res.status(400).json({ success: false, message: 'Invalid or tampered QR payload' });
}
const decryptedObj = JSON.parse(decrypted);
const sessionKey = decryptedObj.sessionKey;
console.log("decrypted session key",decrypted.sessionKey);

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

// routes/auth.js
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

router.post('/request-reset', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'Email not found' });

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  await OtpToken.deleteMany({ email }); // Clear old OTPs
  await OtpToken.create({ email, otp, expiresAt });
  console.log(process.env.EMAIL_USER);
  console.log(process.env.EMAIL_PASS);
  const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your BioPass OTP Code</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; background-color: #f9fafb;">
      <table role="presentation" style="width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        <!-- Header -->
        <tr>
          <td style="padding: 24px; background-color: #4f46e5; text-align: center;">
            <table role="presentation" style="margin: 0 auto;">
              <tr>
                <td>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#ffffff">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </td>
                <td style="padding-left: 8px;">
                  <span style="font-size: 24px; font-weight: 700; color: #ffffff;">BioPass</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding: 32px 24px; text-align: center;">
            <h1 style="font-size: 24px; font-weight: 600; color: #111827; margin: 0 0 16px;">Your OTP Code</h1>
            <p style="font-size: 16px; color: #4b5563; margin: 0 0 24px;">Use the following one-time password to complete your authentication. It expires in 5 minutes.</p>
            <div style="display: inline-block; padding: 16px 24px; background-color: #f3f4f6; border-radius: 8px; margin: 16px 0;">
              <span style="font-size: 28px; font-weight: 700; color: #4f46e5; letter-spacing: 4px;">${otp}</span>
            </div>
            <div style="margin: 16px 0;">
              <a href="javascript:void(0)" onclick="navigator.clipboard.writeText('${otp}')" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 500; text-decoration: none; border-radius: 8px; transition: background-color 0.2s;">Copy OTP</a>
            </div>
            <p style="font-size: 14px; color: #6b7280; margin: 24px 0 0;">If you didn't request this code, please ignore this email or contact support.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding: 16px 24px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280; margin: 0;">&copy; 2025 BioPass. All rights reserved.</p>
            <p style="font-size: 12px; color: #6b7280; margin: 8px 0 0;">
              <a href="/support" style="color: #4f46e5; text-decoration: none;">Support</a> | 
              <a href="/privacy" style="color: #4f46e5; text-decoration: none;">Privacy Policy</a>
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  await transporter.sendMail({
    from: `"BioPass" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP Code',
    html: htmlTemplate,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8'
      }
  });

  res.json({ success:true,message: 'OTP sent' });
});
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const record = await OtpToken.findOne({ email, otp });

  if (!record) return res.status(400).json({ message: 'Invalid OTP' });
  if (record.expiresAt < new Date()) {
    await OtpToken.deleteOne({ _id: record._id });
    return res.status(400).json({ message: 'OTP expired' });
  }

  res.json({ success:true,message: 'OTP verified' });
});

router.post('/reset-password', async (req, res) => {
  const { email,newPassword } = req.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.updateOne({ email }, { password: hashedPassword });

  res.json({ success:true,message: 'Password reset successful' });
});

module.exports = router;