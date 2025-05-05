import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './NavBar';

const MobileOnboarding = () => {
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the current device is mobile
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|windows phone/i.test(userAgent);
    setIsMobile(isMobileDevice);
  }, []);

  const handleRegisterDevice = () => {
    navigate('/passkey-register');
  };

  const handleSetupDesktop = () => {
    navigate('/scan-qr');
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <h2>Set Up Your Authentication Device</h2>
        
        {isMobile ? (
          <div className="onboarding-section">
            <h3>This seems to be a mobile device</h3>
            <p>
              To use WhatsApp-style authentication, you'll need to register this device
              as your primary authentication device.
            </p>
            <div className="steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Register this device</h4>
                  <p>Set up this device as your authentication device using biometrics</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Use it to log in elsewhere</h4>
                  <p>When you want to log in on another device, scan the QR code with this device</p>
                </div>
              </div>
            </div>
            <button className="btn primary-btn" onClick={handleRegisterDevice}>
              Register This Device
            </button>
          </div>
        ) : (
          <div className="onboarding-section">
            <h3>This seems to be a desktop device</h3>
            <p>
              For WhatsApp-style authentication, you should first register a mobile device,
              then use it to log in here.
            </p>
            <div className="options">
              <div className="option">
                <h4>Option 1: Register this device directly</h4>
                <p>You can register this device directly if you prefer not to use the mobile login flow</p>
                <button className="btn secondary-btn" onClick={handleRegisterDevice}>
                  Register This Device
                </button>
              </div>
              <div className="option">
                <h4>Option 2: Already have a registered mobile?</h4>
                <p>If you've already registered your mobile device, you can scan a QR code to log in here</p>
                <button className="btn primary-btn" onClick={handleSetupDesktop}>
                  Set Up Desktop Login
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MobileOnboarding;