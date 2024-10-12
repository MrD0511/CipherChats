import React, { useState } from "react";
import "./SignUp.scss";
import axiosInstance from "../../../axiosInstance";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from 'react-icons/fc'; // Import Google icon

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username,setUsername] = useState("")
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [usernameError, setUsernameError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [errorMsg , setErrorMsg] = useState("")
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()

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

  const check_username_availbility = async (username) => {
    try {
      const response = await axiosInstance.get(`/auth/check_username/${username}`);
      if (response.status === 200) {  // Corrected this part
        return true;
      }
    } catch (error) {
      return false;
    }
  };

  const validateUsername = async (username) => {
    if (!username.trim()) {
      setUsernameError('Required');
    } else if (username.length < 3) {
      setUsernameError('Min 3 characters');
    } else {
      // Await for the async username validation here
      const usernameAvailable = await check_username_availbility(username);
      if (!usernameAvailable) {
        setUsernameError('Username unavailable');
      }else{
        setUsernameError("")
      }
    }
  }

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setEmailError("Email required");
      setPasswordError("Password required");
      setConfirmPasswordError("Please confirm your password");
    } else {
      try{
        setLoading(true)
        const response = await axiosInstance.post('/auth/signup',{
          "username" : name,
          "password" : password,
          "name" : name,
          "email" : email
        });
        localStorage.setItem('access_token',response.data.access_token)
        navigate('/')
      }catch(error){
          setLoading(false)
          if (error.response) {
            setErrorMsg(error.response.data.detail || 'An error occurred');
          } else {
            setErrorMsg('Network error. Please try again later.');
          }
      }
    }
  };

  return (
    <div className="signup-container">
      <div className='brand-name'>
        <span className="cipher">Cipher</span>
        <span className="chat">Chat</span>
      </div>
      <form className="signup-form" onSubmit={handleSubmit}>
        <h2>Sign Up</h2>
        <div className="error">{errorMsg}</div>
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
            <label >Username</label>
            <input
            type="text"
            placeholder="Enter a username"
            value = {username}
            onChange={ (e) => {
              setUsername(e.target.value);
              validateUsername(e.target.value);
            }}
            className={usernameError && "errorField"}
            />
            {usernameError && <span className="error">{usernameError}</span>}
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
        <button type="submit" disabled={loading} >
          {loading ? "Signing Up ..." : "Sign Up"}
        </button>

        <div className="separator">
          <span>or</span>
        </div>

        <button type="button" className="google-login" >
          <FcGoogle className="google-icon" />
          Sign in with Google
        </button>

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
