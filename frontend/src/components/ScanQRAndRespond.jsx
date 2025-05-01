import React, { useState } from 'react';
import axios from 'axios';
import { QrReader } from 'react-qr-reader';
import Navbar from './NavBar';

// Helper functions for ArrayBuffer conversions
function bufferToBase64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlToBuffer(baseurl) {
  let base64 = baseurl.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

const ScanQRAndRespond = () => {
  const [scanning, setScanning] = useState(true);
  const [sessionKey, setSessionKey] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('scanning');
  
  const handleScan = async (data) => {
    if (data && data.text && scanning) {
      setScanning(false);
      try {
        const parsed = JSON.parse(data.text);
        if (!parsed.sessionKey) {
          setStatus('error');
          setMessage('Invalid QR code format');
          return;
        }
        
        setSessionKey(parsed.sessionKey);
        setStatus('authenticating');
        setMessage('QR code detected! Authenticating...');
        
        // Get the user from localStorage
        const userString = localStorage.getItem('user');
        if (!userString) {
          setStatus('error');
          setMessage('You must be logged in to authenticate via QR');
          return;
        }
        
        const user = JSON.parse(userString);
        
        // Get authentication options for this session key
        const optionsRes = await axios.post('http://localhost:5001/api/auth/generate-authentication-options', {
          sessionKey: parsed.sessionKey
        });
        
        const options = optionsRes.data;
        options.challenge = base64urlToBuffer(options.challenge);
        
        if (options.allowCredentials) {
          options.allowCredentials = options.allowCredentials.map(cred => ({
            ...cred,
            id: base64urlToBuffer(cred.id)
          }));
        }
        
        // Create WebAuthn credential
        const credential = await navigator.credentials.get({
          publicKey: options
        });
        
        // Format the credential for transport
        const credentialData = {
          id: credential.id,
          type: credential.type,
          rawId: bufferToBase64url(credential.rawId),
          response: {
            authenticatorData: bufferToBase64url(credential.response.authenticatorData),
            clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
            signature: bufferToBase64url(credential.response.signature),
            userHandle: credential.response.userHandle ? 
              bufferToBase64url(credential.response.userHandle) : null
          }
        };
        
        // Send the credential to verify the session
        const verifyRes = await axios.post('http://localhost:5001/api/auth/verify-qr-session', {
          sessionKey: parsed.sessionKey,
          credential: credentialData
        });
        
        if (verifyRes.data.verified) {
          setStatus('success');
          setMessage('Authentication successful! You can close this window.');
        } else {
          setStatus('error');
          setMessage('Authentication failed. Please try again.');
        }
      } catch (err) {
        console.error('Error during QR authentication:', err);
        setStatus('error');
        setMessage(`Error: ${err.response?.data?.error || err.message}`);
      }
    }
  };

  return (
    <div>
      <Navbar />
      <h2>Scan QR and Respond</h2>
      <div>
        {scanning ? (
          <QrReader
            onResult={handleScan}
            style={{ width: '100%' }}
          />
        ) : (
          <div>
            <div>Session Key: {sessionKey}</div>
            <div>Status: {status}</div>
            <div>{message}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanQRAndRespond;
