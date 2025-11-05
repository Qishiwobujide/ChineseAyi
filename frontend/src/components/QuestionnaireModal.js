import React, { useState } from 'react';
import './QuestionnaireModal.css';

function QuestionnaireModal({ onComplete, onClose }) {
  const [formData, setFormData] = useState({
    communication_type: '',
    usage_context: '',
    background: '',
    proficiency_level: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all fields are filled
    if (!formData.communication_type || !formData.usage_context ||
        !formData.background || !formData.proficiency_level) {
      alert('Please answer all questions / 请回答所有问题');
      return;
    }

    onComplete(formData);
  };

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>🎎 欢迎！Welcome to Chinese Ayi!</h2>
        <p className="modal-subtitle">
          请回答几个问题，帮助我了解您的学习需求<br />
          Please answer a few questions to help me understand your learning needs
        </p>

        <form onSubmit={handleSubmit}>
          {/* Question 1: Communication Type */}
          <div className="question-group">
            <label className="question-label">
              <span className="question-number">1.</span>
              您想练习口语还是书面中文？<br />
              <span className="question-english">Do you want to practice oral or written Chinese?</span>
            </label>
            <div className="options-group">
              <label className="option-label">
                <input
                  type="radio"
                  name="communication_type"
                  value="oral"
                  checked={formData.communication_type === 'oral'}
                  onChange={(e) => handleChange('communication_type', e.target.value)}
                />
                <span>口语 Oral</span>
              </label>
              <label className="option-label">
                <input
                  type="radio"
                  name="communication_type"
                  value="written"
                  checked={formData.communication_type === 'written'}
                  onChange={(e) => handleChange('communication_type', e.target.value)}
                />
                <span>书面 Written</span>
              </label>
            </div>
          </div>

          {/* Question 2: Usage Context */}
          <div className="question-group">
            <label className="question-label">
              <span className="question-number">2.</span>
              您主要想用于日常交流还是商务场合？<br />
              <span className="question-english">Do you mainly want to use it for daily conversation or business?</span>
            </label>
            <div className="options-group">
              <label className="option-label">
                <input
                  type="radio"
                  name="usage_context"
                  value="daily"
                  checked={formData.usage_context === 'daily'}
                  onChange={(e) => handleChange('usage_context', e.target.value)}
                />
                <span>日常 Daily</span>
              </label>
              <label className="option-label">
                <input
                  type="radio"
                  name="usage_context"
                  value="business"
                  checked={formData.usage_context === 'business'}
                  onChange={(e) => handleChange('usage_context', e.target.value)}
                />
                <span>商务 Business</span>
              </label>
            </div>
          </div>

          {/* Question 3: Background */}
          <div className="question-group">
            <label className="question-label">
              <span className="question-number">3.</span>
              能简单介绍一下您的背景吗？比如您为什么想学中文？<br />
              <span className="question-english">Can you briefly introduce your background? For example, why do you want to learn Chinese?</span>
            </label>
            <textarea
              className="text-input"
              rows="3"
              value={formData.background}
              onChange={(e) => handleChange('background', e.target.value)}
              placeholder="请输入您的背景 / Enter your background..."
            />
          </div>

          {/* Question 4: Proficiency Level */}
          <div className="question-group">
            <label className="question-label">
              <span className="question-number">4.</span>
              您觉得您的中文水平怎么样？<br />
              <span className="question-english">What do you think your Chinese level is?</span>
            </label>
            <div className="options-group">
              <label className="option-label">
                <input
                  type="radio"
                  name="proficiency_level"
                  value="beginner"
                  checked={formData.proficiency_level === 'beginner'}
                  onChange={(e) => handleChange('proficiency_level', e.target.value)}
                />
                <span>初级 Beginner</span>
              </label>
              <label className="option-label">
                <input
                  type="radio"
                  name="proficiency_level"
                  value="intermediate"
                  checked={formData.proficiency_level === 'intermediate'}
                  onChange={(e) => handleChange('proficiency_level', e.target.value)}
                />
                <span>中级 Intermediate</span>
              </label>
              <label className="option-label">
                <input
                  type="radio"
                  name="proficiency_level"
                  value="advanced"
                  checked={formData.proficiency_level === 'advanced'}
                  onChange={(e) => handleChange('proficiency_level', e.target.value)}
                />
                <span>高级 Advanced</span>
              </label>
            </div>
          </div>

          <div className="button-group">
            <button type="submit" className="submit-button">
              开始学习 Start Learning 🚀
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuestionnaireModal;
