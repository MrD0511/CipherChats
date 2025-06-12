import React from 'react';
import { Link } from 'react-router-dom';
import './notFound.scss';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1 className="animated-text">404</h1>
        <p className="animated-text">Oops! The page you're looking for has vanished into the digital void.</p>
        <div className="illustration">
          <div className="circle"></div>
          <div className="clip">
            <div className="paper">
              <div className="face">
                <div className="eyes">
                  <div className="eye eye-left"></div>
                  <div className="eye eye-right"></div>
                </div>
                <div className="rosyCheeks rosyCheeks-left"></div>
                <div className="rosyCheeks rosyCheeks-right"></div>
                <div className="mouth"></div>
              </div>
            </div>
          </div>
        </div>
        <Link to="/" className="home-button">Return to Home</Link>
      </div>
      <div className="stars">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="star" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`
          }}></div>
        ))}
      </div>
    </div>
  );
};

export default NotFound;