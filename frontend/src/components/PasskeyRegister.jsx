import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Helper: base64url <-> ArrayBuffer
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

const PasskeyRegister = () => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Only allow access if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
    } else {
      // Optionally pre-fill username/displayName from stored user info
      try {
        const parsed = JSON.parse(user);
        setUsername(parsed.username || parsed.email || '');
        setDisplayName(parsed.name || parsed.displayName || '');
      } catch {
        setUsername(user);
      }
    }
  }, [navigate]);

  async function handleRegister(e) {
    e.preventDefault();
    setMessage('');
    setVerifying(true);
    // Step 1: Verify password with backend
    try {
      const verify = await axios.post('http://localhost:5001/api/auth/verify-password', { username, password });
      if (!verify.data.valid) {
        setMessage('Incorrect password.');
        setVerifying(false);
        return;
      }
    } catch (err) {
      setMessage('Password verification failed: ' + (err.response?.data?.message || err.message));
      setVerifying(false);
      return;
    }
    // Step 2: WebAuthn registration as before
    try {
      const res = await axios.post('http://localhost:5001/api/auth/generate-registration-options', { username, displayName });
      const options = res.data;
      options.challenge = base64urlToBuffer(options.challenge);
      options.user.id = base64urlToBuffer(options.user.id);
      if (options.excludeCredentials) {
        options.excludeCredentials = options.excludeCredentials.map(cred => ({
          ...cred,
          id: base64urlToBuffer(cred.id)
        }));
      }
      const credential = await navigator.credentials.create({ publicKey: options });
      const credentialData = {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        type: credential.type,
        response: {
          attestationObject: bufferToBase64url(credential.response.attestationObject),
          clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
        },
        transports: credential.response.getTransports ? credential.response.getTransports() : []
      };
      const verifyRes = await axios.post('http://localhost:5001/api/auth/verify-registration', { username, credential: credentialData });
      if (verifyRes.data.verified) setMessage('Device registered!');
      else setMessage('Registration failed.');
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.error || err.message));
    }
    setVerifying(false);
  }

  return (
    <div>
      <h2>Register Device (Passkey)</h2>
      <form onSubmit={handleRegister}>
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required />
        <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display Name" required />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
        <button type="submit" disabled={verifying}>{verifying ? 'Verifying...' : 'Register Device'}</button>
      </form>
      <div>{message}</div>
    </div>
  );
};

export default PasskeyRegister;