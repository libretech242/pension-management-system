import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Landing.css';

const Landing = () => {
  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className="hero">
          <h1>Welcome to <span className="highlight">PensionPro</span></h1>
          <p className="tagline">Secure Your Future, Simplify Your Present</p>
          <p className="hero-description">
            Take control of your retirement journey with our modern pension management platform
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="button primary">Get Started</Link>
            <Link to="/login" className="button secondary">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
