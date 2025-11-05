import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './config/supabase';
import Auth from './components/Auth';
import Chat from './components/Chat';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentCancelled from './components/PaymentCancelled';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">加载中... Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Main chat route */}
          <Route
            path="/"
            element={
              !user ? (
                <Auth />
              ) : (
                <Chat user={user} onLogout={handleLogout} />
              )
            }
          />

          {/* Payment success route */}
          <Route
            path="/payment-success"
            element={
              user ? <PaymentSuccess /> : <Navigate to="/" replace />
            }
          />

          {/* Payment cancelled route */}
          <Route
            path="/payment-cancelled"
            element={
              user ? <PaymentCancelled /> : <Navigate to="/" replace />
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
