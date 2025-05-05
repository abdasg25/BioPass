import React, { useRef, useEffect, useState } from 'react';
import jsQR from 'jsqr';
import axios from 'axios';
import Navbar from './NavBar';

// Helper functions
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
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(true);
  const [sessionKey, setSessionKey] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('scanning');
  const [error, setError] = useState(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', true);
        await videoRef.current.play();
        requestAnimationFrame(scanQRCode);
      } catch (err) {
        console.error('Camera error:', err);
        setError('Camera access denied or not available.');
      }
    };

    if (scanning) startCamera();

    return () => {
      const stream = videoRef.current?.srcObject;
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [scanning]);

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && scanning) {
        handleScan(code.data);
      }
    }

    if (scanning) {
      requestAnimationFrame(scanQRCode);
    }
  };

  const handleScan = async (rawText) => {
    setScanning(false);
    try {
      const parsed = JSON.parse(rawText);
      if (!parsed.sessionKey) {
        setStatus('error');
        setMessage('Invalid QR code format');
        return;
      }

      setSessionKey(parsed.sessionKey);
      setStatus('authenticating');
      setMessage('QR code detected! Authenticating...');

      const userString = localStorage.getItem('user');
      if (!userString) {
        setStatus('error');
        setMessage('You must be logged in to authenticate via QR');
        return;
      }

      const optionsRes = await axios.post('http://10.7.76.50:5002/api/auth/generate-authentication-options', {
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

      console.log('Authentication options:', options);
      
      let credential;
      try {
        console.log('Requesting credential with options:', JSON.stringify(options, null, 2));
        credential = await navigator.credentials.get({
          publicKey: options
        });
        console.log('Raw credential received:', credential);
        
        // Log all properties of the credential
        if (credential) {
          console.log('Credential properties:', {
            id: credential.id,
            type: credential.type,
            rawId: credential.rawId ? 'present' : 'missing',
            response: credential.response ? {
              authenticatorData: credential.response.authenticatorData ? 'present' : 'missing',
              clientDataJSON: credential.response.clientDataJSON ? 'present' : 'missing',
              signature: credential.response.signature ? 'present' : 'missing',
              userHandle: credential.response.userHandle ? 'present' : 'missing'
            } : 'no response object'
          });
        }
      } catch (err) {
        console.error('Error getting credential:', err);
        throw new Error('Failed to get credential: ' + err.message);
      }

      if (!credential || !credential.response) {
        console.error('Invalid credential response:', credential);
        throw new Error('Invalid credential response from authenticator');
      }

      let credentialData;
      try {
        // First, verify all required fields exist
        if (!credential || !credential.response) {
          throw new Error('Credential or credential.response is missing');
        }

        const requiredFields = ['authenticatorData', 'clientDataJSON', 'signature'];
        const missingFields = requiredFields.filter(field => !credential.response[field]);
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required credential response fields: ${missingFields.join(', ')}`);
        }

        // Process the credential data
        credentialData = {
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
        console.log('Credential data prepared:', credentialData);
      } catch (err) {
        console.error('Error processing credential data:', err);
        console.error('Credential object structure:', {
          id: credential.id,
          type: credential.type,
          hasRawId: !!credential.rawId,
          responseKeys: credential.response ? Object.keys(credential.response) : 'no response',
          response: credential.response
        });
        throw new Error('Failed to process credential data: ' + err.message);
      }
      console.log(parsed.sessionKey);
      const verifyRes = await axios.post('http://10.7.76.50:5002/api/auth/verify-qr-session', {
        sessionKey: parsed.sessionKey,
        credential: credentialData
      });

      if (verifyRes.data.verified) {
        setStatus('success');
        setMessage('Authentication successful! The other device is now logged in.');
      } else {
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
      }

    } catch (err) {
      console.error('Error during QR authentication:', err);
      setStatus('error');
      setMessage(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const restartScanner = () => {
    setSessionKey('');
    setScanning(true);
    setError(null);
    setStatus('scanning');
    setMessage('');
  };

  const displaySessionInfo = () => {
    if (sessionKey && status === 'success') {
      return (
        <div className="session-info">
          <p>Session ID: {sessionKey.substring(0, 8)}...</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <h2>Scan QR Code to Authenticate</h2>
        <p>Use your mobile device to scan a QR code from another device to approve the login</p>

        <div className="qr-scanner-container">
          {error ? (
            <div className="error-container">
              <p>Camera Error: {error}</p>
              <p>Make sure you've granted camera permissions and try again.</p>
              <button className="btn primary-btn" onClick={restartScanner}>
                Try Again
              </button>
            </div>
          ) : scanning ? (
            <div className="scanner-wrapper">
              <video ref={videoRef} style={{ width: '100%', maxWidth: 400 }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <p>Position the QR code within the frame</p>
            </div>
          ) : (
            <div className={`status-container ${status}`}>
              <h3>{status === 'success' ? 'Success!' : status === 'error' ? 'Error' : 'Authenticating...'}</h3>
              <p>{message}</p>
              {displaySessionInfo()}
              {status !== 'authenticating' && (
                <button className="btn primary-btn" onClick={restartScanner}>
                  Scan Another Code
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ScanQRAndRespond;
