import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AlternativeRegistrationMethod = ({ username }) => {
  const [password, setPassword] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setMessage('');
    setMessageType('');
    
    try {
      // First verify password
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
      
      // Register device using a simpler method
      const response = await axios.post('http://10.7.76.50:5002/api/auth/register-alternative-device', {
        username,
        deviceName: deviceName || 'Mobile Device'
      });
      
      if (response.data.success) {
        setMessage('Device registered successfully!');
        setMessageType('success');
        
        // Store device token in localStorage
        if (response.data.deviceToken) {
          localStorage.setItem('deviceToken', response.data.deviceToken);
        }
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setMessage('Registration failed: ' + (response.data.error || 'Unknown error'));
        setMessageType('error');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setMessage('Error: ' + (err.response?.data?.error || err.message));
      setMessageType('error');
    }
    
    setVerifying(false);
  };

  return (
    <div className="alt-registration">
      <h3>Alternative Device Registration</h3>
      <p>For browsers without WebAuthn support, you can register your device this way:</p>
      
      <form onSubmit={handleRegister} className="auth-form">
        <div className="form-group">
          <label htmlFor="deviceName">Device Name (optional):</label>
          <input 
            id="deviceName"
            type="text" 
            value={deviceName} 
            onChange={e => setDeviceName(e.target.value)} 
            placeholder="My Phone" 
          />
        </div>
        
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
      
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}
      
      <div className="note">
        <p><strong>Note:</strong> This method provides a simpler form of authentication. 
        For the best security, consider using a desktop browser with WebAuthn support.</p>
      </div>
    </div>
  );
};

export default AlternativeRegistrationMethod;