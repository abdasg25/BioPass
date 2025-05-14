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
        const { data } = await axios.post('http://localhost:5002/api/auth/generate-qr-session');
        console.log('QR Response:', data);
        
        if (data.qr) {
          setQR(data.qr);
          // Extract sessionKey from payload or directly from response
          const sessionKey = data.sessionKey || data.payload?.sessionKey;
          
          if (sessionKey) {
            setSessionKey(sessionKey);
            setWaiting(true);
          } else {
            throw new Error('Session key missing in response');
          }
        } else {
          throw new Error('QR code missing in response');
        }
      } catch (err) {
        console.error('Error in fetchQR:', err);
        setError(err.response?.data?.error || 'Failed to generate QR code. Please try again.');
      }
    }
    fetchQR();
  }, []);

  // Step 2: Poll backend to check if authenticated
  useEffect(() => {
    if (!waiting || !sessionKey) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await axios.post('http://localhost:5002/api/auth/poll-qr-session', { 
          sessionKey 
        });

        console.log('Poll response:', data);

        if (data.error === 'Session expired') {
          setError('QR code expired. Please refresh and try again.');
          setWaiting(false);
          clearInterval(interval);
          return;
        }

        if (data.authenticated) {
          setAuthenticated(true);
          setWaiting(false);
          
          // Store the web session token
          if (data.webSessionToken) {
            localStorage.setItem('token', data.webSessionToken);
            localStorage.setItem('userId',data.userId);
            let userId = data.userId;
            // Get user data using the token
            try {
              const userRes = await axios.get(`http://localhost:5002/api/auth/userinfo?userId=${userId}`);         
              localStorage.setItem('user', JSON.stringify(userRes.data));
              
              if (onSuccess) onSuccess();
              setTimeout(() => navigate('/'), 1500);
            } catch (userErr) {
              console.error('Failed to fetch user data:', userErr);
              setError('Login successful but failed to load user data');
            }
          } else {
            setError('Authentication token missing');
          }
          
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error polling session status:', err);
        if (err.response?.status === 404) {
          setError('Session expired or invalid');
          clearInterval(interval);
        }
      }
    }, POLL_INTERVAL);

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
      {waiting && !authenticated && (
        <div className="status">
          Waiting for authentication...
          <div className="loading-spinner"></div>
        </div>
      )}
      {authenticated && <div className="success">Authenticated! Redirecting...</div>}
    </div>
  );
};

export default PasskeyQRLogin;