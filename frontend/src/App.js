import './App.scss';
import {BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './pages/layout/layout';
import Login from './pages/auth/Login/Login';
import Signup from './pages/auth/Signup/SignUp';
import NotFound from './pages/notFound/notFound';

function App() {



  return (
    <Router>
      <Routes>
        <Route path='/' element={<Layout />}  className="layout"/>
        <Route path='/chats/:userId' element={<Layout />} className="layout"/>
        <Route path='/signin' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='*' element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;