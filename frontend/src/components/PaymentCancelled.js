import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PaymentResult.css';

function PaymentCancelled() {
  const navigate = useNavigate();

  return (
    <div className="payment-result-container">
      <div className="payment-result-card cancelled">
        <div className="result-icon">⚠️</div>
        <h2>支付已取消 Payment Cancelled</h2>
        <p>您的支付已被取消，没有扣款。</p>
        <p>Your payment was cancelled. No charges were made.</p>
        <button onClick={() => navigate('/')} className="return-button">
          返回应用 Return to App
        </button>
      </div>
    </div>
  );
}

export default PaymentCancelled;
