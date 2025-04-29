import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const user = localStorage.getItem('user');
  return (
    <nav>
      <div className="logo">
        <Link to="/">LMS Passkey Auth</Link>
      </div>
      <div className="nav-links">
        {!user && <Link to="/login">Login</Link>}
        {!user && <Link to="/signup">Sign Up</Link>}
        {user && <Link to="/passkey-register">Register Device</Link>}
      </div>
    </nav>
  );
};

export default Navbar;