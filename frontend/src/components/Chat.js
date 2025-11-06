import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { supabase } from '../config/supabase';
import QuestionnaireModal from './QuestionnaireModal';
import SessionCustomizationModal from './SessionCustomizationModal';
import CreditsModal from './CreditsModal';
import './Chat.css';

const API_URL = process.env.REACT_APP_API_URL;

function Chat({ user, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [messageLimit, setMessageLimit] = useState(null);
  const [translatedMessages, setTranslatedMessages] = useState({});
  const [translatingIndex, setTranslatingIndex] = useState(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showSessionCustomization, setShowSessionCustomization] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
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

      // Check if user needs to complete user preferences questionnaire
      if (!response.data.profile.communication_type) {
        setShowQuestionnaire(true);
      } else {
        // User preferences exist, show session customization
        setShowSessionCustomization(true);
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

  const handleQuestionnaireComplete = async (answers) => {
    try {
      const token = await getAuthToken();

      // Update profile with user preference answers
      await axios.put(
        `${API_URL}/user/profile`,
        answers,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowQuestionnaire(false);

      // After user preferences, show session customization
      setShowSessionCustomization(true);
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      alert('Failed to save preferences. Please try again.');
    }
  };

  const handleSessionCustomizationComplete = async (customization) => {
    try {
      setShowSessionCustomization(false);
      // Start session with customization
      await startPracticeSession(customization);
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start session. Please try again.');
    }
  };

  const startPracticeSession = async (customization) => {
    try {
      const token = await getAuthToken();
      const response = await axios.post(
        `${API_URL}/chat/session/start`,
        {
          sessionType: 'practice',
          ayi_personality_traits: customization.ayi_personality_traits,
          ayi_background: customization.ayi_background
        },
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

  const translateMessage = async (index, text) => {
    if (translatedMessages[index]) {
      // Toggle off if already translated
      const newTranslated = { ...translatedMessages };
      delete newTranslated[index];
      setTranslatedMessages(newTranslated);
      return;
    }

    setTranslatingIndex(index);
    try {
      const token = await getAuthToken();
      const response = await axios.post(
        `${API_URL}/chat/translate`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTranslatedMessages({
        ...translatedMessages,
        [index]: response.data
      });
    } catch (error) {
      console.error('Error translating:', error);
      alert('Translation failed. Please try again.');
    } finally {
      setTranslatingIndex(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCreditsUpdate = (newCredits) => {
    setMessageLimit({
      ...messageLimit,
      credits: newCredits
    });
  };

  return (
    <div className="chat-container">
      {showQuestionnaire && (
        <QuestionnaireModal
          onComplete={handleQuestionnaireComplete}
          onClose={() => setShowQuestionnaire(false)}
        />
      )}

      {showSessionCustomization && (
        <SessionCustomizationModal
          onComplete={handleSessionCustomizationComplete}
          onClose={() => setShowSessionCustomization(false)}
        />
      )}

      {showCreditsModal && (
        <CreditsModal
          onClose={() => setShowCreditsModal(false)}
          initialCredits={messageLimit?.credits || 0}
          onCreditsUpdate={handleCreditsUpdate}
        />
      )}

      <div className="chat-header">
        <div className="header-left">
          <h1>🎎 Zhang Ayi</h1>
          <p>张阿姨</p>
        </div>
        <div className="header-right">
          {sessionId && (
            <button
              className="new-conversation-button"
              onClick={() => {
                setMessages([]);
                setSessionId(null);
                setShowSessionCustomization(true);
              }}
              title="Start New Conversation / 开始新对话"
            >
              ➕ 新对话
            </button>
          )}
          {messageLimit && (
            <>
              <div className="message-counter">
                <span className="counter-label">今日剩余:</span>
                <span className="counter-value">{messageLimit.remainingFree}/{messageLimit.dailyLimit}</span>
              </div>
              <button
                className="credits-button"
                onClick={() => setShowCreditsModal(true)}
                title="View Credits / 查看积分"
              >
                💎 {messageLimit.credits}
              </button>
            </>
          )}
          <button onClick={onLogout} className="logout-button">登出</button>
        </div>
      </div>

      <div className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message-wrapper ${msg.role}`}>
            <div className={`message ${msg.role}`}>
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
              {translatedMessages[index] && (
                <div className="translation-popup">
                  <div className="pinyin">🔤 {translatedMessages[index].pinyin}</div>
                  <div className="english">🇬🇧 {translatedMessages[index].english}</div>
                </div>
              )}
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            <button
              className="translate-button"
              onClick={() => translateMessage(index, msg.content)}
              disabled={translatingIndex === index}
              title="Translate / Show Pinyin"
            >
              {translatingIndex === index ? '...' : translatedMessages[index] ? '✕' : '译'}
            </button>
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
