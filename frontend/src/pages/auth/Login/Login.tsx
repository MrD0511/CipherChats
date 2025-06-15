import React, { useState } from "react";
import axiosInstance from "../../../axiosInstance";
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc'; 
import { auth, googleProvider } from "../../../firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
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
          <span className="text-gradient-primary animate-glitch">CipherChat</span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full flex justify-center items-center">
          <div 
            className="z-10 bg-gray-900 rounded-lg shadow-violet max-w-sm w-full text-center p-6"
            style={{ backgroundColor: '#0f131e' }}
          >
            <h2 className="mb-8 text-gradient-primary font-bold tracking-wide text-xl">Login</h2>
            
            {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}
            
            {/* Email Field */}
            <div className="mb-6 text-left">
              <label className="block mb-2 text-gray-300 text-sm">Email or Username</label>
              <input
                type="text"
                placeholder="Enter your email or username"
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

            {/* Password Field */}
            <div className="mb-6 text-left">
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
              {passwordError && <span className="text-red-500 mt-2 text-sm block">{passwordError}</span>}
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-primary text-white border-none p-3 rounded-lg cursor-pointer text-base font-bold w-full transition-all duration-300 shadow-violet-hover hover:-translate-y-1 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            {/* Separator */}
            <div className="my-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-400" style={{ backgroundColor: '#0f131e' }}>or</span>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex justify-center items-center gap-2 bg-gradient-primary rounded-lg p-3 w-full transition-all duration-300 shadow-violet-hover hover:-translate-y-1 text-white font-medium"
            >
              <FcGoogle className="text-xl" />
              Sign in with Google
            </button>

            {/* Links */}
            <div className="mt-6 flex justify-between">
              <a href="/" className="text-violet-600 no-underline text-sm transition-colors duration-300 hover:text-violet-500">
                Forgot Password?
              </a>
              <a href="/signup" className="text-violet-600 no-underline text-sm transition-colors duration-300 hover:text-violet-500">
                Don't have an account? Sign up
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

export default Login;