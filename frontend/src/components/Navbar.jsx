import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const user = localStorage.getItem('token');
  return (
    <nav>
      <div className="logo">
        <Link to="/">BioPass</Link>
      </div>
      <div className="nav-links">
        {!user && <Link to="/login">Login</Link>}
        {!user && <Link to="/signup">Sign Up</Link>}
        {user && <Link to="/passkey-register">Register Device</Link>}
        {user && <Link to="/scan-qr">Scan Qr Code</Link>}
      </div>
    </nav>
  );
};

export default Navbar;