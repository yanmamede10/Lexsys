import './App.css';

import Main from './pages/main/Main';
import Login from './pages/login/Login';
import Token from './auth/Token';

import { BrowserRouter, Routes, Route, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from 'react';

function Layout() {
  const navigate = useNavigate();

  useEffect(() => {
    (async function () {
      const verifyAcc = await Token.verifyAccessToken();
      const verifyRef = await Token.verifyRefreshToken();
      if (!verifyAcc) {
        if (!verifyRef) {
          navigate('/login');
        } else {
          Token.refreshToken();
        }
      }
    }());
  }, []);

  return (
    <div id="app-container">
      <Outlet />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Main />} />
          <Route path="login" element={<Login />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
