import React, { useState, useEffect } from 'react';
import { supabase } from './config/supabase';
import Auth from './components/Auth';
import Chat from './components/Chat';
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
    <div className="App">
      {!user ? <Auth /> : <Chat user={user} onLogout={handleLogout} />}
    </div>
  );
}

export default App;
