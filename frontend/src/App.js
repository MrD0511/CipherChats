import './App.css';
import {BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './pages/layout/layout';
import Login from './pages/auth/Login/Login';
import Signup from './pages/auth/Signup/SignUp';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Layout />} />
        <Route path='/signin' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
      </Routes>
    </Router>
  );
}

export default App;