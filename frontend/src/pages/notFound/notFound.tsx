import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const [glitchText, setGlitchText] = useState("404");
  const navigate = useNavigate();
  // Subtle glitch effect for 404 text
  useEffect(() => {
    const glitchTexts = ["404", "4Ø4", "404", "ERR", "404"];
    let index = 0;
    
    const glitchInterval = setInterval(() => {
      setGlitchText(glitchTexts[index]);
      index = (index + 1) % glitchTexts.length;
    }, 3000); // Much slower

    return () => clearInterval(glitchInterval);
  }, []);

  const handleGoHome = () => {
    console.log("Navigate to home page");
    navigate("/");
  };

  const handleGoBack = () => {
    console.log("Navigate back");
    navigate(-1); // Go back to the previous page
  };

  return (
    <>
      <style>{`
        @keyframes subtleGlitch {
          0%, 90%, 100% { 
            transform: translate(0);
            filter: hue-rotate(0deg);
          }
          5% { 
            transform: translate(-1px, 1px);
            filter: hue-rotate(180deg);
          }
        }

        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes softPulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }

        .subtle-glitch {
          animation: subtleGlitch 6s infinite;
          text-shadow: 
            0.02em 0 0 rgba(138, 43, 226, 0.3),
            -0.02em 0 0 rgba(74, 144, 226, 0.3);
        }

        .gentle-float {
          animation: gentleFloat 8s ease-in-out infinite;
        }

        .fade-in {
          animation: fadeIn 1s ease-out;
        }

        .soft-pulse {
          animation: softPulse 4s ease-in-out infinite;
        }

        .text-gradient-primary {
          background: linear-gradient(135deg, #8a2be2, #4a90e2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtle-glow {
          box-shadow: 0 0 15px rgba(138, 43, 226, 0.2);
        }

        .minimal-circuit {
          background-image: 
            radial-gradient(circle at 25% 25%, rgba(138, 43, 226, 0.1) 1px, transparent 1px),
            radial-gradient(circle at 75% 75%, rgba(74, 144, 226, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>

      <div className="relative min-h-screen bg-gray-900 overflow-hidden flex items-center justify-center">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 minimal-circuit opacity-50"></div>
        
        {/* A few gentle floating elements */}
        <div className="absolute top-20 left-20 w-16 h-16 border border-purple-400 rounded-full opacity-30 gentle-float"></div>
        <div className="absolute bottom-32 right-32 w-12 h-12 border border-blue-400 rounded-lg opacity-30 gentle-float" style={{ animationDelay: '2s' }}></div>

        {/* Main Content */}
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          
          {/* Brand Name */}
          <div className="mb-12 fade-in">
            <div className="text-2xl md:text-3xl font-bold tracking-wide mb-2">
              <span className="text-gradient-primary">Cipher</span>
              <span className="text-blue-300">Chat</span>
            </div>
          </div>

          {/* Clean 404 */}
          <div className="mb-8 fade-in" style={{ animationDelay: '0.2s' }}>
            <h1 className="text-7xl md:text-8xl font-bold text-gradient-primary subtle-glitch mb-4">
              {glitchText}
            </h1>
            <div className="text-red-300 text-lg md:text-xl font-mono mb-2">
              Page Not Found
            </div>
          </div>

          {/* Simple Error Message */}
          <div className="mb-12 fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="bg-gray-800 bg-opacity-60 rounded-lg p-6 border border-gray-600 subtle-glow max-w-xl mx-auto">
              <h2 className="text-xl md:text-2xl font-semibold text-gradient-primary mb-3">
                Connection Lost
              </h2>
              <p className="text-gray-300 text-base mb-3">
                The page you're looking for couldn't be found. It may have been moved or deleted.
              </p>
            </div>
          </div>

          {/* Clean Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center fade-in" style={{ animationDelay: '0.6s' }}>
            <button
              onClick={handleGoHome}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 min-w-40"
            >
              Go Home
            </button>
            <button
              onClick={handleGoBack}
              className="bg-transparent border border-blue-400 text-blue-400 px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:bg-blue-400 hover:text-gray-900 min-w-40"
            >
              Go Back
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default NotFound;