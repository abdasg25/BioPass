import React, { useState, useEffect } from 'react';
import axios from 'axios';

const POLL_INTERVAL = 2000; // ms

const PasskeyQRLogin = () => {
  const [qr, setQR] = useState(null);
  const [sessionKey, setSessionKey] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Get QR code from backend (no user input)
  useEffect(() => {
    async function fetchQR() {
      try {
        const { data } = await axios.post('http://localhost:5001/api/auth/generate-qr-session');
        setQR(data.qr);
        setSessionKey(JSON.parse(data.payload).sessionKey);
        setWaiting(true);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      }
    }
    fetchQR();
  }, []);

  // Step 2: Poll backend to check if authenticated
  useEffect(() => {
    let interval;
    if (waiting && sessionKey) {
      interval = setInterval(async () => {
        try {
          const res = await axios.post('http://localhost:5001/api/auth/poll-qr-session', { sessionKey });
          if (res.data.authenticated) {
            setAuthenticated(true);
            setWaiting(false);
            clearInterval(interval);
          }
        } catch (err) {}
      }, POLL_INTERVAL);
    }
    return () => clearInterval(interval);
  }, [waiting, sessionKey]);

  return (
    <div>
      <h3>Login with Passkey (QR Code)</h3>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {qr && (
        <div style={{ margin: '20px 0' }}>
          <img src={qr} alt="Scan this QR code with your registered device" />
          <div>Scan this QR code with your registered device to login.</div>
        </div>
      )}
      {waiting && !authenticated && <div>Waiting for authentication...</div>}
      {authenticated && <div style={{ color: 'green' }}>Authenticated! You are now logged in.</div>}
    </div>
  );
};

export default PasskeyQRLogin;
