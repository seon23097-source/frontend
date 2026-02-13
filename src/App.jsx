import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Setup from './components/Setup';
import InitialSetup from './components/InitialSetup';
import Dashboard from './components/Dashboard';
import { authAPI, isAuthenticated } from './utils/api';
import './index.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [hasPassword, setHasPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { hasPassword: passwordExists } = await authAPI.checkSetup();
      setHasPassword(passwordExists);
      setIsLoggedIn(isAuthenticated());
    } catch (error) {
      console.error('인증 상태 확인 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)' }}>로딩 중...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/setup" 
          element={
            !hasPassword ? (
              <Setup onComplete={() => {
                setHasPassword(true);
              }} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/login" 
          element={
            !isLoggedIn ? (
              <Login onLogin={() => setIsLoggedIn(true)} />
            ) : (
              <Navigate to="/initial-setup" replace />
            )
          } 
        />
        <Route 
          path="/initial-setup" 
          element={
            isLoggedIn ? (
              <InitialSetup onComplete={() => {
                window.location.href = '/';
              }} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/*" 
          element={
            isLoggedIn ? (
              <Dashboard />
            ) : (
              <Navigate to={!hasPassword ? "/setup" : "/login"} replace />
            )
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
