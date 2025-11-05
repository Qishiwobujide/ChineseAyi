import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { supabase } from '../config/supabase';
import './Chat.css';

const API_URL = process.env.REACT_APP_API_URL;

function Chat({ user, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [messageLimit, setMessageLimit] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadProfile();
    loadMessageLimit();
  }, []);

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const loadProfile = async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data.profile);

      // Check if user needs questionnaire
      if (!response.data.profile.communication_type) {
        startQuestionnaire();
      } else {
        startPracticeSession();
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadMessageLimit = async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_URL}/user/message-limit`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessageLimit(response.data);
    } catch (error) {
      console.error('Error loading message limit:', error);
    }
  };

  const startQuestionnaire = async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.post(
        `${API_URL}/chat/session/start`,
        { sessionType: 'questionnaire' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessionId(response.data.session.id);
      setMessages([{
        role: 'assistant',
        content: response.data.initialMessage,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error starting questionnaire:', error);
    }
  };

  const startPracticeSession = async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.post(
        `${API_URL}/chat/session/start`,
        { sessionType: 'practice' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessionId(response.data.session.id);
      setMessages([{
        role: 'assistant',
        content: response.data.initialMessage,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error starting practice session:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const token = await getAuthToken();
      const response = await axios.post(
        `${API_URL}/chat/message`,
        {
          sessionId: sessionId,
          message: inputMessage
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const ayiMessage = {
        role: 'assistant',
        content: response.data.message,
        correction: response.data.correction,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, ayiMessage]);

      // Update message limit
      setMessageLimit({
        ...messageLimit,
        remainingFree: response.data.remainingFree,
        credits: response.data.credits,
        messagesUsed: messageLimit.messagesUsed + 1
      });

    } catch (error) {
      console.error('Error sending message:', error);
      if (error.response?.data?.limitReached) {
        alert('每日消息限制已达到！您可以购买积分以继续。\n\nDaily message limit reached! You can purchase credits to continue.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-left">
          <h1>🎎 Chinese Ayi</h1>
          <p>中文阿姨</p>
        </div>
        <div className="header-right">
          {messageLimit && (
            <div className="message-counter">
              <span className="counter-label">今日剩余:</span>
              <span className="counter-value">{messageLimit.remainingFree}/{messageLimit.dailyLimit}</span>
              {messageLimit.credits > 0 && (
                <span className="credits">💎 {messageLimit.credits}</span>
              )}
            </div>
          )}
          <button onClick={onLogout} className="logout-button">登出</button>
        </div>
      </div>

      <div className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-content">
              {msg.content}
            </div>
            {msg.correction && (
              <div className="correction">
                <strong>【纠正】</strong>
                <p>原句："{msg.correction.original}"</p>
                <p>更地道："{msg.correction.corrected}"</p>
                {msg.correction.explanation && (
                  <p className="explanation">💡 {msg.correction.explanation}</p>
                )}
              </div>
            )}
            <div className="message-time">
              {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message assistant typing">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入您的消息... (按 Enter 发送)"
          rows="2"
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !inputMessage.trim()}>
          发送 📤
        </button>
      </div>

      {messageLimit && messageLimit.remainingFree === 0 && messageLimit.credits === 0 && (
        <div className="limit-warning">
          ⚠️ 您已达到每日免费消息限制。请购买积分以继续。
          <br />
          You've reached your daily free message limit. Please purchase credits to continue.
        </div>
      )}
    </div>
  );
}

export default Chat;
