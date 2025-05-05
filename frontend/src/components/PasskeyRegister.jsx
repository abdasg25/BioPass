import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './NavBar';
import AlternativeRegistrationMethod from './AlternativeRegistrationMethod';
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

// Add this function at the top of your component to check compatibility
const checkWebAuthnSupport = () => {
  // Check if WebAuthn is supported at all
  if (!window.PublicKeyCredential) {
    return {
      supported: false,
      error: "Your browser doesn't support WebAuthn/passkeys."
    };
  }
  
  // Check if platform authenticator is available
  try {
    return {
      supported: true
    };
  } catch (e) {
    return {
      supported: false,
      error: "WebAuthn is not fully supported in this browser."
    };
  }
};
const PasskeyRegister = () => {
  // Add state for browser compatibility
  const [browserSupport, setBrowserSupport] = useState({ checking: true });
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [useAlternativeMethod, setUseAlternativeMethod] = useState(false);
  const navigate = useNavigate();

  // Check browser support on component mount
  useEffect(() => {
    if (typeof window.PublicKeyCredential !== 'undefined' &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'undefined') {
      
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => {
          if (available) {
            setBrowserSupport({ supported: true, checking: false });
          } else {
            setBrowserSupport({ 
              supported: false, 
              checking: false,
              error: "Your device doesn't have platform authenticator capability" 
            });
          }
        })
        .catch(err => {
          setBrowserSupport({ 
            supported: false, 
            checking: false, 
            error: `Error checking support: ${err.message}` 
          });
        });
    } else {
      // WebAuthn API not available at all
      setBrowserSupport({ 
        supported: false, 
        checking: false, 
        error: "Your browser doesn't support WebAuthn/passkeys" 
      });
    }
  }, []);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    
    if (!userString) {
      navigate('/login');
      return;
    }
    
    try {
      const userObj = JSON.parse(userString);
      if (!userObj.username) {
        navigate('/login');
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate('/login');
    }
  }, [navigate]);

  async function handleRegister(e) {
    e.preventDefault();
    
    // Check support first
    if (!browserSupport.supported) {
      setMessage(`Cannot register: ${browserSupport.error}`);
      setMessageType('error');
      return;
    }
    
    setMessage('');
    setMessageType('');
    setVerifying(true);
    
    try {
      // Get user info from localStorage
      const userObj = JSON.parse(localStorage.getItem('user'));
      const username = userObj.username;
      
      // Step 1: Verify password
      const verify = await axios.post('http://10.7.76.50:5002/api/auth/verify-password', { 
        username, 
        password 
      });
      
      if (!verify.data.valid) {
        setMessage('Incorrect password.');
        setMessageType('error');
        setVerifying(false);
        return;
      }
      
      setMessage('Password verified. Preparing registration...');
      
      // Step 2: Generate registration options
      const res = await axios.post('http://10.7.76.50:5002/api/auth/generate-registration-options', { 
        username, 
        displayName: userObj.displayName || userObj.name || username 
      });
      
      const options = res.data;
      
      // Process the challenge and user ID - convert from base64url to array buffer
      options.challenge = base64urlToBuffer(options.challenge);
      options.user.id = base64urlToBuffer(options.user.id);
      
      // Handle exclude credentials if present
      if (options.excludeCredentials && options.excludeCredentials.length) {
        options.excludeCredentials = options.excludeCredentials.map(cred => ({
          ...cred,
          id: base64urlToBuffer(cred.id)
        }));
      }
      
      setMessage('Waiting for your device authentication...');
      
      // Step 3: Create credential
      const credential = await navigator.credentials.create({
        publicKey: options 
      });
      
      // Step 4: Format credential for server verification
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
      console.log("ENTERING VERIFY-REG");
      // Step 5: Verify registration
      const verifyRes = await axios.post('http://10.7.76.50:5002/api/auth/verify-registration', { 
        username, 
        credential: credentialData 
      });
      
      if (verifyRes.data.verified) {
        setMessage('Device registered successfully! You can now use it for authentication.');
        setMessageType('success');
      } else {
        setMessage('Registration failed: ' + (verifyRes.data.error || 'Unknown error'));
        setMessageType('error');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setMessage('Error: ' + (err.response?.data?.error || err.message));
      setMessageType('error');
    }
    
    setVerifying(false);
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h2>Register Device (Passkey)</h2>
        <p>Register this device to use for passwordless login</p>
        
        {browserSupport.checking ? (
          <div className="compatibility-check">
            <p>Checking browser compatibility...</p>
          </div>
        ) : !browserSupport.supported ? (
          <div className="compatibility-error">
            <h3>Browser Compatibility Issue</h3>
            <p>{browserSupport.error}</p>
            <p>This browser doesn't fully support WebAuthn/passkeys.</p>
            
            <button 
              onClick={() => setUseAlternativeMethod(true)} 
              className="btn secondary-btn"
            >
              Use Alternative Method
            </button>
          </div>
        ) : useAlternativeMethod ? (
          <AlternativeRegistrationMethod username={JSON.parse(localStorage.getItem('user')).username} />
        ) : (
          // Your existing form
          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label htmlFor="password">Confirm your password:</label>
              <input 
                id="password"
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Enter your password" 
                required 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={verifying}
              className="btn primary-btn"
            >
              {verifying ? 'Registering...' : 'Register Device'}
            </button>
          </form>
        )}
        
        {message && !useAlternativeMethod && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}
      </div>
    </>
  );
};

export default PasskeyRegister;