import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PasskeyQRLogin from './PasskeyQRLogin';
import Navbar from './NavBar';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showQR, setShowQR] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://10.7.76.50:5002/api/auth/login', {
        email,
        password
      });
      if (response.data.success) {
        // Store the entire user object for consistent access everywhere
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
        navigate('/');
      } else {
        setError(response.data.message || 'Login failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-container">
        <h2>Login with Email</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit">Login</button>
        </form>
        {/* Divider */}
        <div style={{ margin: '20px 0', textAlign: 'center' }}>
          <span>or</span>
        </div>
        {/* Passkey QR login integration */}
        <div style={{ marginBottom: '10px' }}>
          <button type="button" onClick={() => setShowQR(true)}>
            Login with Passkey (QR Code)
          </button>
        </div>
        {showQR && (
          <div style={{ border: '1px solid #ccc', padding: 10, marginTop: 10 }}>
            <PasskeyQRLogin onSuccess={() => setShowQR(false)} />
          </div>
        )}
      </div>
    </>
  );
};

export default Login;