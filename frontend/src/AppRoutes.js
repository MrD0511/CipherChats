import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './pages/layout/layout';
import Login from './pages/auth/Login/Login';
import Signup from './pages/auth/Signup/SignUp';
import NotFound from './pages/notFound/notFound';
import { WebSocketProvider } from './websocketContext';

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
            <Route path='/' element={<Layout />} className="layout" />
            <Route path='/chats/:userId' element={<Layout />} className="layout" />
            <Route path='*' element={<NotFound />} />
          </Routes>
        </WebSocketProvider>
      )}
    </>
  );
}

export default AppRoutes;
