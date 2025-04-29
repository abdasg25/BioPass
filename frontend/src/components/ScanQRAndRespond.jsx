import React, { useState } from 'react';
import axios from 'axios';

// Helper functions for base64url conversion
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
  const [qrPayload, setQrPayload] = useState('');
  const [sessionKey, setSessionKey] = useState('');
  const [message, setMessage] = useState('');

  // Step 1: User pastes QR payload (from QR code)
  function handleParsePayload() {
    try {
      const data = JSON.parse(qrPayload);
      setSessionKey(data.sessionKey);
      setMessage('Ready to sign session key.');
    } catch (err) {
      setMessage('Invalid QR payload.');
    }
  }

  // Step 2: Use WebAuthn to sign the session key
  async function handleRespond() {
    setMessage('');
    try {
      // Get all credentials from navigator (let user pick)
      // We'll use dummy options except for challenge
      const options = {
        challenge: base64urlToBuffer(sessionKey),
        timeout: 60000,
        userVerification: 'required',
        allowCredentials: [] // Let browser pick
      };
      const assertion = await navigator.credentials.get({ publicKey: options });
      const credential = {
        id: assertion.id,
        rawId: bufferToBase64url(assertion.rawId),
        type: assertion.type,
        response: {
          authenticatorData: bufferToBase64url(assertion.response.authenticatorData),
          clientDataJSON: bufferToBase64url(assertion.response.clientDataJSON),
          signature: bufferToBase64url(assertion.response.signature),
          userHandle: assertion.response.userHandle ? bufferToBase64url(assertion.response.userHandle) : null
        }
      };
      // Send signed credential to backend
      const res = await axios.post('http://localhost:5001/api/auth/verify-qr-session', {
        sessionKey,
        credential
      });
      if (res.data.verified) setMessage('Challenge signed and login completed!');
      else setMessage('Verification failed.');
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.error || err.message));
    }
  }

  return (
    <div>
      <h2>Scan QR and Respond</h2>
      <div>
        <textarea
          placeholder="Paste QR payload here (from QR code)"
          value={qrPayload}
          onChange={e => setQrPayload(e.target.value)}
          rows={3}
          cols={50}
        />
        <button onClick={handleParsePayload}>Parse Payload</button>
      </div>
      {sessionKey && (
        <div>
          <div>Session Key: {sessionKey}</div>
          <button onClick={handleRespond}>Sign Session Key & Respond</button>
        </div>
      )}
      <div>{message}</div>
    </div>
  );
};

export default ScanQRAndRespond;
