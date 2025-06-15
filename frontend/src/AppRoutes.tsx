import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './pages/layout/layout';
import Login from './pages/auth/Login/Login';
import Signup from './pages/auth/Signup/SignUp';
import NotFound from './pages/notFound/notFound';
import { WebSocketProvider } from './websocketContext';
import KeysPage from './pages/keys/keys';

function AppRoutes() {
  const location = useLocation();
  const isAuthRoute = location.pathname === '/signin' || location.pathname === '/signup';

  return (
    <>
      {isAuthRoute ? (
        <Routes>
          <Route path='/signin' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='*' element={<NotFound />} />
        </Routes>
      ) : (
        <WebSocketProvider>
          <Routes>
            <Route path='/' element={<Layout />} />
            <Route path='/chats/:userId' element={<Layout />} />
            <Route path='*' element={<NotFound />} />
            {
              window.innerWidth > 768 ? (
                <Route path='/keys' element={<Layout />} />
              ) : (
                <Route path='/keys' element={<KeysPage />} />
              )}
          </Routes>
        </WebSocketProvider>
      )}
    </>
  );
}

export default AppRoutes;
