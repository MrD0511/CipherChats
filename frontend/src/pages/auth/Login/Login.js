import React, { useState } from "react";
import "./Login.scss";
import axiosInstance from "../../../axiosInstance";
import { useNavigate } from 'react-router-dom'

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [errorMsg , setErrorMsg] = useState("")
  const navigate = useNavigate()

  const validateEmail = (email) => {
    if (email === "") {
      setEmailError("Email required");
      return;
    }else{
      setEmailError("")
    }
  };

  const validatePassword = (password) => {
    if (password === "") {
      setPasswordError("Password required");
      return;
    }else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setEmailError("Email required");
      setPasswordError("Password required");
    } else {
      try{
        const response = await axiosInstance.post('/signin',{
          "identifier" : email,
          "password" : password
        });
        localStorage.setItem('access_token',response.data.access_token)
        navigate('/')
      }catch(error){
          if (error.response) {
            setErrorMsg(error.response.data.detail || 'An error occurred');
          } else {
            setErrorMsg('Network error. Please try again later.');
          }
      }
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        {errorMsg && <p className="error">{errorMsg}</p>}
        <div className="form-group">
          <label>Email</label>
          <input
            type="text"
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
        <button type="submit">Login</button>

        <div className="links">
          <a href="/" className="forgot-password">
            Forgot Password?
          </a>
          <a href="/signup" className="signup-link">
            Don’t have an account? Sign up
          </a>
        </div>
      </form>
    </div>
  );
};

export default Login;
