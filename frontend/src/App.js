import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import PasskeyRegister from './components/PasskeyRegister';
import ScanQRAndRespond from './components/ScanQRAndRespond';
import MobileOnboarding from './components/MobileOnboarding';
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
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <MobileOnboarding />
            </ProtectedRoute>
          } />
          <Route path="/passkey-register" element={
            <ProtectedRoute>
              <PasskeyRegister />
            </ProtectedRoute>
          } />
          <Route path="/scan-qr" element={
            <ProtectedRoute>
              <ScanQRAndRespond />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  );
}

export default App;