import { Routes, Route } from 'react-router-dom'
import Layout from './pages/layout/layout';
import Login from './pages/auth/Login/Login';
import Signup from './pages/auth/Signup/SignUp';
import NotFound from './pages/notFound/notFound';

function AppRoutes() {

  return (
    <Routes>
      <Route path='/' element={ <Layout />}  className="layout"/>
      <Route path='/chats/:userId' element={ <Layout />} className="layout"/>
      <Route path='/signin' element={<Login />} />
      <Route path='/signup' element={<Signup />} />
      <Route path='*' element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;