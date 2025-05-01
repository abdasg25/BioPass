import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const POLL_INTERVAL = 2000; // ms

const PasskeyQRLogin = ({ onSuccess }) => {
  const [qr, setQR] = useState(null);
  const [sessionKey, setSessionKey] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Step 1: Get QR code from backend
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
            
            // Get user data after authentication
            try {
              const userRes = await axios.get(`http://localhost:5001/api/auth/userinfo?userId=${res.data.userId}`);
              
              // Store user data in localStorage
              localStorage.setItem('user', JSON.stringify(userRes.data));
              localStorage.setItem('token', res.data.token);
              
              // Call the onSuccess callback if provided
              if (onSuccess) onSuccess();
              
              // Navigate to homepage after a short delay
              setTimeout(() => navigate('/'), 1500);
            } catch (userErr) {
              console.error('Failed to fetch user data:', userErr);
              setError('Failed to fetch user data after authentication');
            }
            
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Error polling session status:', err);
        }
      }, POLL_INTERVAL);
    }
    return () => clearInterval(interval);
  }, [waiting, sessionKey, navigate, onSuccess]);

  return (
    <div className="qr-login-container">
      <h3>Login with Passkey (QR Code)</h3>
      {error && <div className="error">{error}</div>}
      {qr && (
        <div className="qr-section">
          <img src={qr} alt="Scan this QR code with your registered device" />
          <p>Scan this QR code with your registered device to login.</p>
        </div>
      )}
      {waiting && !authenticated && <div className="status">Waiting for authentication...</div>}
      {authenticated && <div className="success">Authenticated! Redirecting to homepage...</div>}
    </div>
  );
};

export default PasskeyQRLogin;
