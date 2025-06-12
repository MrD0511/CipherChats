import React, { useEffect, useState } from 'react';

const LoadingPage = () => {
  const [progress, setProgress] = useState(0);
  const [glitchText, setGlitchText] = useState('CIPHERLINK');

  // Simple glitch effect
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const glitched = 'CIPHERLINK'.split('')
          .map(char => Math.random() > 0.8 ? chars[Math.floor(Math.random() * chars.length)] : char)
          .join('');
        setGlitchText(glitched);
        
        // Reset after short delay
        setTimeout(() => setGlitchText('CIPHERLINK'), 100);
      }
    }, 2000);

    return () => clearInterval(glitchInterval);
  }, []);

  // Smooth progress animation
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2.0;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 30);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Subtle background gradient */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent"
        style={{ transform: 'translateY(-50%)' }}
      />

      <div className="relative z-10 w-full max-w-md px-4 sm:px-6">
        {/* Main title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-center mb-8 md:mb-12 tracking-wider">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-400">
            {glitchText}
          </span>
        </h1>

        {/* Progress bar container */}
        <div className="relative">
          <div className="h-1 w-full bg-gray-800/50 rounded-full overflow-hidden mb-4 sm:mb-6">
            {/* Progress bar with gradient */}
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-cyan-400 transition-all duration-300 ease-out"
              style={{ 
                width: `${progress}%`,
                boxShadow: '0 0 20px rgba(138, 43, 226, 0.3)'
              }}
            />
          </div>
          
          {/* Progress percentage */}
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
            <span className="text-xs sm:text-sm text-gray-400 font-mono">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Loading message */}
        <div className="mt-8 md:mt-12 text-center">
          <p className="text-gray-400 text-xs sm:text-sm tracking-widest uppercase">
            System Initializing
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {/* Top line */}
          <div 
            className="absolute top-0 left-1/2 h-1/3 w-px bg-gradient-to-b from-purple-500/0 via-purple-500/20 to-purple-500/0"
            style={{ transform: 'translateX(-50%)' }}
          />
          
          {/* Bottom line */}
          <div 
            className="absolute bottom-0 left-1/2 h-1/3 w-px bg-gradient-to-t from-purple-500/0 via-purple-500/20 to-purple-500/0"
            style={{ transform: 'translateX(-50%)' }}
          />
        </div>
      </div>

      {/* Circular gradient overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-cyan-500/5 rounded-full blur-3xl"
        style={{ 
          width: '150%',
          height: '150%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'pulse 4s ease-in-out infinite'
        }}
      />
    </div>
  );
};

export default LoadingPage;

