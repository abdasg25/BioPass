import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import VerifyOTP from './components/VerifyOtp';
import ProtectedRoute from './components/ProtectedRoute';
import './styles.css';

function App() {
  return (
    <div className="app">
      <div className="content">
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;