import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../config/supabase';
import './CreditsModal.css';

const API_URL = process.env.REACT_APP_API_URL;

function CreditsModal({ onClose, initialCredits, onCreditsUpdate }) {
  const [credits, setCredits] = useState(initialCredits || 0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const creditPackages = [
    { id: 1, amount: 50, price: 4.99, popular: false },
    { id: 2, amount: 150, price: 12.99, popular: true, save: '15%' },
    { id: 3, amount: 300, price: 24.99, popular: false, save: '20%' },
    { id: 4, amount: 1000, price: 79.99, popular: false, save: '33%' }
  ];

  useEffect(() => {
    loadTransactionHistory();
  }, []);

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const loadTransactionHistory = async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_URL}/user/credits/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handlePurchase = async (pkg) => {
    setLoading(true);
    setSelectedPackage(pkg.id);

    try {
      const token = await getAuthToken();

      // In a real app, you'd integrate with Stripe/PayPal here
      // For now, we'll simulate a successful purchase
      const response = await axios.post(
        `${API_URL}/user/credits/purchase`,
        {
          amount: pkg.amount,
          paymentMethod: 'demo',
          paymentReference: `DEMO-${Date.now()}`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setCredits(response.data.credits);
        onCreditsUpdate(response.data.credits);
        await loadTransactionHistory();

        // Show success message
        alert(`✅ 购买成功！您已获得 ${pkg.amount} 积分\n\nPurchase successful! You received ${pkg.amount} credits.`);
      }
    } catch (error) {
      console.error('Error purchasing credits:', error);
      alert('购买失败，请重试。\n\nPurchase failed. Please try again.');
    } finally {
      setLoading(false);
      setSelectedPackage(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="credits-modal-overlay" onClick={onClose}>
      <div className="credits-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>✕</button>

        <div className="credits-header">
          <h2>💎 积分中心 Credits Center</h2>
          <div className="current-balance">
            <span className="balance-label">当前余额 Current Balance</span>
            <div className="balance-amount">
              <span className="balance-number">{credits}</span>
              <span className="balance-text">积分 Credits</span>
            </div>
          </div>
        </div>

        <div className="credits-body">
          <section className="packages-section">
            <h3>📦 购买积分套餐 Purchase Credit Packages</h3>
            <div className="packages-grid">
              {creditPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`package-card ${pkg.popular ? 'popular' : ''}`}
                >
                  {pkg.popular && <div className="popular-badge">🔥 Most Popular</div>}
                  {pkg.save && <div className="save-badge">💰 Save {pkg.save}</div>}

                  <div className="package-amount">{pkg.amount}</div>
                  <div className="package-label">积分 Credits</div>

                  <div className="package-price">
                    <span className="currency">$</span>
                    <span className="price">{pkg.price}</span>
                  </div>

                  <div className="package-per-credit">
                    ${(pkg.price / pkg.amount).toFixed(3)} / credit
                  </div>

                  <button
                    className="purchase-button"
                    onClick={() => handlePurchase(pkg)}
                    disabled={loading && selectedPackage === pkg.id}
                  >
                    {loading && selectedPackage === pkg.id ? (
                      <span className="spinner">⏳</span>
                    ) : (
                      '💳 Purchase'
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="payment-note">
              <p>💡 Note: This is a demo. In production, integrate with Stripe or PayPal for real payments.</p>
            </div>
          </section>

          {transactions.length > 0 && (
            <section className="transactions-section">
              <h3>📊 交易历史 Transaction History</h3>
              <div className="transactions-list">
                {transactions.slice(0, 10).map((tx) => (
                  <div key={tx.id} className="transaction-item">
                    <div className="transaction-icon">
                      {tx.transaction_type === 'purchase' ? '💰' : '💸'}
                    </div>
                    <div className="transaction-details">
                      <div className="transaction-type">
                        {tx.transaction_type === 'purchase' ? '购买积分 Purchase' : '使用积分 Used'}
                      </div>
                      <div className="transaction-date">{formatDate(tx.created_at)}</div>
                    </div>
                    <div className={`transaction-amount ${tx.amount > 0 ? 'positive' : 'negative'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreditsModal;
