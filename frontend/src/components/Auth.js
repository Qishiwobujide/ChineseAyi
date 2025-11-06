import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import './Auth.css';

function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('注册成功！请检查您的电子邮件以确认您的帐户。');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>🎎 Zhang Ayi</h1>
        <h2>张阿姨 - 您的中文导师</h2>

        <form onSubmit={handleAuth}>
          <input
            type="email"
            placeholder="邮箱 / Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="密码 / Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? '处理中...' : isSignUp ? '注册 / Sign Up' : '登录 / Log In'}
          </button>
        </form>

        {message && <p className="message">{message}</p>}

        <p className="toggle-auth">
          {isSignUp ? '已有账户？' : '还没有账户？'}
          <button
            type="button"
            className="link-button"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? '登录' : '注册'}
          </button>
        </p>

        <div className="info-box">
          <p>💬 每天免费 12 条消息</p>
          <p>🎯 个性化中文学习</p>
          <p>✨ 实时纠正和建议</p>
        </div>
      </div>
    </div>
  );
}

export default Auth;
