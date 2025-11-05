import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../config/supabase';
import './PaymentResult.css';

const API_URL = process.env.REACT_APP_API_URL;

function PaymentSuccess() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [credits, setCredits] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      // Get session_id from URL
      const params = new URLSearchParams(location.search);
      const sessionId = params.get('session_id');

      if (!sessionId) {
        setError('No session ID found');
        setLoading(false);
        return;
      }

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      // Verify payment with backend
      const response = await axios.get(
        `${API_URL}/user/credits/verify-payment/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setCredits(response.data.amount);
        setLoading(false);

        // Redirect to chat after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setError('Failed to verify payment');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="payment-result-container">
        <div className="payment-result-card">
          <div className="loading-spinner">⏳</div>
          <h2>验证支付... Verifying Payment...</h2>
          <p>Please wait while we confirm your purchase.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-result-container">
        <div className="payment-result-card error">
          <div className="result-icon">❌</div>
          <h2>支付验证失败 Payment Verification Failed</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="return-button">
            返回 Return to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-container">
      <div className="payment-result-card success">
        <div className="result-icon">✅</div>
        <h2>购买成功！ Purchase Successful!</h2>
        <p className="credits-amount">
          You received <strong>{credits} credits</strong>
        </p>
        <p className="redirect-message">
          正在跳转... Redirecting to app in 3 seconds...
        </p>
        <button onClick={() => navigate('/')} className="return-button">
          立即返回 Return Now
        </button>
      </div>
    </div>
  );
}

export default PaymentSuccess;
