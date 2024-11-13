import './App.scss';
import axiosInstance from './axiosInstance';
import { useEffect, useState } from 'react';
import {useNavigate } from 'react-router-dom';
import { lazy } from 'react';

const LoadingPage = lazy(()=>import('./pages/loadingPage/loadingPage'))
const AppRoutes = lazy(()=>import('./AppRoutes'))

function App() {
  
  const [isLoading, setIsLoading] = useState(true);
  const [timerExpired, setTimerExpired] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {

    // Call the backend to check if the user is logged in
      axiosInstance.get('/auth/check-session')
          .then(response => {
              setIsLoading(false);
          })
          .catch(() => {
            setIsLoading(false)
            navigate('/signin')
          });

          const timer = setTimeout(() => {
            setTimerExpired(true); // Set to true when the timer expires
          }, 2000); 
          
          return () => clearTimeout(timer);
          
        }, [navigate]);
        
  if(isLoading || !timerExpired) {
      return <LoadingPage />; // Show loading screen while checking auth
  }

  return (
    <AppRoutes />
  );
}

export default App;