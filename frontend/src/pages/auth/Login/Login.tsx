import React, { useState } from "react";
import "./Login.scss";
import axiosInstance from "../../../axiosInstance";
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc'; 
import { auth, googleProvider } from "../../../firebase";


const Login = () => {

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    if (email === "") {
      setEmailError("Email required");
    } else {
      setEmailError("");
    }
  };

  const validatePassword = (password: string) => {
    if (password === "") {
      setPasswordError("Password required");
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      setEmailError("Email required");
      setPasswordError("Password required");
    } else {
      try {
        setLoading(true);
        const response = await axiosInstance.post('/auth/signin', {
          "identifier": email,
          "password": password
        });
        localStorage.setItem('access_token', response.data.access_token);
        navigate('/');
      } catch (error: Error | any) {
        setLoading(false);
        if (error.response) {
          setErrorMsg(error.response.data.detail || 'An error occurred');
        } else {
          setErrorMsg('Network error. Please try again later.');
        }
      }
    }
  };

  const handleGoogleLogin = () => {
    // Implement Google login logic here

    auth.signInWithPopup(googleProvider).then( async (result: any) => {

      const id_token = await result.user.getIdToken();

      const data = {
        "id_token" : id_token
      }

      const response = await axiosInstance.post('/auth/googleAuth', data)

      localStorage.setItem('access_token', response.data.access_token);
      navigate('/');

    }).catch((err)=>{
      console.error(err)
    })
  };

  return (
    <div className="login-container">
      <div className='brand-name'>
        <span className="cipher">CipherChat</span>
        {/* <span className="chat">Chat</span> */}
      </div>
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        {errorMsg && <p className="error">{errorMsg}</p>}
        <div className="form-group">
          <label>Email or Username</label>
          <input
            type="text"
            placeholder="Enter your email or username"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              validateEmail(e.target.value);
            }}
            className={emailError ? "errorField" : ""}
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
            className={passwordError ? "errorField" : ""}
          />
          {passwordError && <span className="error">{passwordError}</span>}
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </button>
        
        <div className="separator">
          <span>or</span>
        </div>

        <button type="button" className="google-login" onClick={handleGoogleLogin}>
          <FcGoogle className="google-icon" />
          Sign in with Google
        </button>

        <div className="links">
          <a href="/" className="forgot-password">
            Forgot Password?
          </a>
          <a href="/signup" className="signup-link">
            Don't have an account? Sign up
          </a>
        </div>
      </form>
      {/* <div className="stars">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="star" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`
          }}></div>
        ))}
      </div> */}
    </div>
  );
};

export default Login;