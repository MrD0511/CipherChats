import React, { useState } from "react";
import "./SignUp.scss";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const validateEmail = (email) => {
    if (email === "") {
      setEmailError("Email required");
      return;
    }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(String(email).toLowerCase())) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const validatePassword = (password) => {
    if (password === "") {
      setPasswordError("Password required");
      return;
    }
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!re.test(String(password))) {
      setPasswordError(
        "Password must be at least 8 characters long and include one uppercase letter, one lowercase letter, one number, and one special character"
      );
    } else {
      setPasswordError("");
    }
  };

  const validateConfirmPassword = (password, confirmPassword) => {
    if (confirmPassword === "") {
      setConfirmPasswordError("Please confirm your password");
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setEmailError("Email required");
      setPasswordError("Password required");
      setConfirmPasswordError("Please confirm your password");
    } else {
      console.log("Signing up:", { name, email, password });
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSubmit}>
        <h2>Sign Up</h2>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              validateEmail(e.target.value);
            }}
            className={emailError && "errorField"}
          />
          {emailError && <span className="error">{emailError}</span>}
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              validatePassword(e.target.value);
            }}
            className={passwordError && "errorField"}
          />
          {passwordError && <span className="error">{passwordError}</span>}
        </div>
        <div className="form-group">
          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              validateConfirmPassword(password, e.target.value);
            }}
            className={confirmPasswordError && "errorField"}
          />
          {confirmPasswordError && (
            <span className="error">{confirmPasswordError}</span>
          )}
        </div>
        <button type="submit">Sign Up</button>

        <div className="links">
          <a href='/signin' className="signup-link">
            Already have an account? Log in
          </a>
        </div>
      </form>
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

export default Signup;
