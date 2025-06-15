import React, { useState } from "react";
import axiosInstance from "../../../axiosInstance";
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc'; 
import { auth, googleProvider } from "../../../firebase";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
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

  const checkUsernameAvailability = async (username: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      // Simulate some usernames being taken
      const takenUsernames = ['admin', 'user', 'test', 'demo'];
      return !takenUsernames.includes(username.toLowerCase());
    } catch (error) {
      return false;
    }
  };

  const validateUsername = async (username: string) => {
    if (!username.trim()) {
      setUsernameError('Required');
    } else if (username.length < 3) {
      setUsernameError('Min 3 characters');
    } else {
      const usernameAvailable = await checkUsernameAvailability(username);
      if (!usernameAvailable) {
        setUsernameError('Username unavailable');
      } else {
        setUsernameError("");
      }
    }
  };

  const validatePassword = (password: string) => {
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

  const validateConfirmPassword = (password: string, confirmPassword: string) => {
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      }catch(error: Error | any) {
          setLoading(false)
          if (error.response) {
            setErrorMsg(error.response.data.detail || 'An error occurred');
          } else {
            setErrorMsg('Network error. Please try again later.');
          }
      }
    }
  };

  const handleGoogleSignup = async () => {

    auth.signInWithPopup(googleProvider).then( async (result: any) => {

      const id_token = await result.user.getIdToken();

      const data = {
        "id_token" : id_token
      }

      const response = await axiosInstance.post('/auth/googleAuth', data)

      localStorage.setItem('access_token', response.data.access_token);
      navigate('/');

    }).catch((error) => {
      console.error(error)
    })

  }

  return (
    <>
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes glitch {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
          25%, 75% { 
            opacity: 0.9;
            transform: skew(-5deg);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-twinkle {
          animation: twinkle 2s infinite;
        }
        
        .animate-glitch {
          animation: glitch 3s infinite;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .text-gradient-primary {
          background: linear-gradient(to right, #8a2be2, #4a90e2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .bg-gradient-primary {
          background: linear-gradient(to right, #8a2be2, #4a90e2);
        }
        
        .star {
          position: absolute;
          width: 2px;
          height: 2px;
          background-color: white;
          border-radius: 50%;
          animation: twinkle 2s infinite;
        }
        
        .glow-violet:focus {
          box-shadow: 0 0 8px #8a2be2;
        }
        
        .shadow-violet {
          box-shadow: 0 4px 15px rgba(138, 43, 226, 0.3);
        }
        
        .shadow-violet-hover:hover {
          box-shadow: 0 0 15px rgba(74, 144, 226, 0.5);
        }
      `}</style>
      
      <div className="flex justify-center items-center flex-col min-h-screen bg-black p-2 relative overflow-hidden">
        {/* Brand Name */}
        <div className="mt-10 mb-4 text-4xl font-bold tracking-widest z-10" 
             style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
          <span className="text-gradient-primary animate-glitch">Cipher</span>
          <span className="text-blue-400 animate-float">Chat</span>
        </div>

        {/* Signup Form */}
        <form 
          onSubmit={handleSubmit}
          className="w-full flex justify-center items-center"
        >
          <div 
            className="z-10 bg-gray-900 rounded-lg shadow-violet max-w-sm w-full text-center p-6"
            style={{ backgroundColor: '#0f131e' }}
          >
            <h2 className="mb-6 text-gradient-primary font-bold tracking-wide text-xl">Sign Up</h2>
            
            {errorMsg && <div className="text-red-500 mb-4 text-sm">{errorMsg}</div>}
            
            {/* Name Field */}
            <div className="mb-4 text-left">
              <label className="block mb-2 text-gray-300 text-sm">Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-gray-600 rounded-lg bg-gray-900 text-gray-300 text-base transition-all duration-300 focus:outline-none focus:border-violet-600 glow-violet"
                style={{ backgroundColor: '#0f131e' }}
              />
            </div>

            {/* Email Field */}
            <div className="mb-4 text-left">
              <label className="block mb-2 text-gray-300 text-sm">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  validateEmail(e.target.value);
                }}
                className={`w-full p-3 border rounded-lg bg-gray-900 text-gray-300 text-base transition-all duration-300 focus:outline-none glow-violet ${
                  emailError ? 'border-red-500' : 'border-gray-600 focus:border-violet-600'
                }`}
                style={{ backgroundColor: '#0f131e' }}
              />
              {emailError && <span className="text-red-500 mt-2 text-sm block">{emailError}</span>}
            </div>

            {/* Username Field */}
            <div className="mb-4 text-left">
              <label className="block mb-2 text-gray-300 text-sm">Username</label>
              <input
                type="text"
                placeholder="Enter a username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  validateUsername(e.target.value);
                }}
                className={`w-full p-3 border rounded-lg bg-gray-900 text-gray-300 text-base transition-all duration-300 focus:outline-none glow-violet ${
                  usernameError ? 'border-red-500' : 'border-gray-600 focus:border-violet-600'
                }`}
                style={{ backgroundColor: '#0f131e' }}
              />
              {usernameError && <span className="text-red-500 mt-2 text-sm block">{usernameError}</span>}
            </div>

            {/* Password Field */}
            <div className="mb-4 text-left">
              <label className="block mb-2 text-gray-300 text-sm">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  validatePassword(e.target.value);
                }}
                className={`w-full p-3 border rounded-lg bg-gray-900 text-gray-300 text-base transition-all duration-300 focus:outline-none glow-violet ${
                  passwordError ? 'border-red-500' : 'border-gray-600 focus:border-violet-600'
                }`}
                style={{ backgroundColor: '#0f131e' }}
              />
              {passwordError && <span className="text-red-500 mt-2 text-sm block text-xs">{passwordError}</span>}
            </div>

            {/* Confirm Password Field */}
            <div className="mb-6 text-left">
              <label className="block mb-2 text-gray-300 text-sm">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  validateConfirmPassword(password, e.target.value);
                }}
                className={`w-full p-3 border rounded-lg bg-gray-900 text-gray-300 text-base transition-all duration-300 focus:outline-none glow-violet ${
                  confirmPasswordError ? 'border-red-500' : 'border-gray-600 focus:border-violet-600'
                }`}
                style={{ backgroundColor: '#0f131e' }}
              />
              {confirmPasswordError && <span className="text-red-500 mt-2 text-sm block">{confirmPasswordError}</span>}
            </div>

            {/* Sign Up Button */}
            <button
              disabled={loading}
              className="bg-gradient-primary text-white border-none p-3 rounded-lg cursor-pointer text-base font-bold w-full transition-all duration-300 shadow-violet-hover hover:-translate-y-1 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mb-4"
            >
              {loading ? 'Signing Up...' : 'Sign Up'}
            </button>

            {/* Separator */}
            <div className="my-4 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-400" style={{ backgroundColor: '#0f131e' }}>or</span>
              </div>
            </div>

            {/* Google Signup Button */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="flex justify-center items-center gap-2 bg-gradient-primary rounded-lg p-3 w-full transition-all duration-300 shadow-violet-hover hover:-translate-y-1 text-white font-medium mb-4"
            >
              <FcGoogle className="text-xl" />
              Sign up with Google
            </button>

            {/* Links */}
            <div className="text-center">
              <a href="/signin" className="text-violet-600 no-underline text-sm transition-colors duration-300 hover:text-violet-500">
                Already have an account? Log in
              </a>
            </div>
          </div>
        </form>

        {/* Animated Stars */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="star animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </>
  );
};

export default Signup;