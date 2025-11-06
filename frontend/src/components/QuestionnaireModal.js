import React, { useState } from 'react';
import './QuestionnaireModal.css';

function QuestionnaireModal({ onComplete, onClose }) {
  const [formData, setFormData] = useState({
    communication_type: '',
    usage_context: '',
    background: '',
    proficiency_level: '',
    ayi_personality_traits: [],
    ayi_background: ''
  });

  const personalityTraits = [
    { id: 'polite', label: '礼貌 Polite', emoji: '😊' },
    { id: 'straightforward', label: '直率 Straightforward', emoji: '💬' },
    { id: 'nice', label: '和善 Nice', emoji: '🥰' },
    { id: 'sassy', label: '俏皮 Sassy', emoji: '😏' },
    { id: 'encouraging', label: '鼓励 Encouraging', emoji: '💪' },
    { id: 'strict', label: '严格 Strict', emoji: '📏' },
    { id: 'humorous', label: '幽默 Humorous', emoji: '😄' },
    { id: 'patient', label: '耐心 Patient', emoji: '🧘' }
  ];

  const backgroundOptions = [
    {
      id: 'retired_teacher',
      label: '退休教师',
      english: 'Retired Teacher',
      emoji: '👩‍🏫',
      description: '30年教学经验，温柔耐心'
    },
    {
      id: 'beijing_native',
      label: '北京本地人',
      english: 'Beijing Native',
      emoji: '🏛️',
      description: '地道北京话，熟悉北方文化'
    },
    {
      id: 'shanghai_businesswoman',
      label: '上海女企业家',
      english: 'Shanghai Businesswoman',
      emoji: '💼',
      description: '商务经验丰富，精明能干'
    },
    {
      id: 'taiwanese_aunt',
      label: '台湾阿姨',
      english: 'Taiwanese Aunt',
      emoji: '🌸',
      description: '温婉亲切，台湾腔调'
    },
    {
      id: 'hongkong_ayi',
      label: '香港阿姨',
      english: 'Hong Kong Ayi',
      emoji: '🏙️',
      description: '活力四射，中英混合'
    },
    {
      id: 'village_elder',
      label: '乡村长辈',
      english: 'Village Elder',
      emoji: '🌾',
      description: '淳朴智慧，说话直接'
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all required fields
    if (!formData.communication_type || !formData.usage_context ||
        !formData.background || !formData.proficiency_level ||
        formData.ayi_personality_traits.length === 0 || !formData.ayi_background) {
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

  const toggleTrait = (traitId) => {
    const currentTraits = formData.ayi_personality_traits;
    if (currentTraits.includes(traitId)) {
      // Remove trait
      setFormData({
        ...formData,
        ayi_personality_traits: currentTraits.filter(t => t !== traitId)
      });
    } else {
      // Add trait (limit to 3 traits)
      if (currentTraits.length < 3) {
        setFormData({
          ...formData,
          ayi_personality_traits: [...currentTraits, traitId]
        });
      } else {
        alert('最多选择3个性格特点 / Maximum 3 traits');
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content questionnaire-wide">
        <h2>🎎 认识张阿姨！ Meet Zhang Ayi!</h2>
        <p className="modal-subtitle">
          让我们了解您的学习需求，并定制您专属的张阿姨！<br />
          Let's understand your needs and customize your own Zhang Ayi!
        </p>

        <form onSubmit={handleSubmit}>
          {/* Question 1: Communication Type */}
          <div className="question-group">
            <label className="question-label">
              <span className="question-number">1</span>
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
                <span>💬 口语 Oral</span>
              </label>
              <label className="option-label">
                <input
                  type="radio"
                  name="communication_type"
                  value="written"
                  checked={formData.communication_type === 'written'}
                  onChange={(e) => handleChange('communication_type', e.target.value)}
                />
                <span>✍️ 书面 Written</span>
              </label>
            </div>
          </div>

          {/* Question 2: Usage Context */}
          <div className="question-group">
            <label className="question-label">
              <span className="question-number">2</span>
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
                <span>🏠 日常 Daily</span>
              </label>
              <label className="option-label">
                <input
                  type="radio"
                  name="usage_context"
                  value="business"
                  checked={formData.usage_context === 'business'}
                  onChange={(e) => handleChange('usage_context', e.target.value)}
                />
                <span>💼 商务 Business</span>
              </label>
            </div>
          </div>

          {/* Question 3: Background */}
          <div className="question-group">
            <label className="question-label">
              <span className="question-number">3</span>
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
              <span className="question-number">4</span>
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
                <span>🌱 初级 Beginner</span>
              </label>
              <label className="option-label">
                <input
                  type="radio"
                  name="proficiency_level"
                  value="intermediate"
                  checked={formData.proficiency_level === 'intermediate'}
                  onChange={(e) => handleChange('proficiency_level', e.target.value)}
                />
                <span>🌿 中级 Intermediate</span>
              </label>
              <label className="option-label">
                <input
                  type="radio"
                  name="proficiency_level"
                  value="advanced"
                  checked={formData.proficiency_level === 'advanced'}
                  onChange={(e) => handleChange('proficiency_level', e.target.value)}
                />
                <span>🌳 高级 Advanced</span>
              </label>
            </div>
          </div>

          {/* NEW Question 5: Zhang Ayi Personality */}
          <div className="question-group highlight">
            <label className="question-label">
              <span className="question-number">5</span>
              选择张阿姨的性格特点（最多3个）<br />
              <span className="question-english">Choose Zhang Ayi's personality traits (up to 3)</span>
            </label>
            <div className="traits-grid">
              {personalityTraits.map((trait) => (
                <label
                  key={trait.id}
                  className={`trait-card ${formData.ayi_personality_traits.includes(trait.id) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={formData.ayi_personality_traits.includes(trait.id)}
                    onChange={() => toggleTrait(trait.id)}
                    style={{ display: 'none' }}
                  />
                  <div className="trait-emoji">{trait.emoji}</div>
                  <div className="trait-label">{trait.label}</div>
                </label>
              ))}
            </div>
            <p className="hint-text">
              已选择 {formData.ayi_personality_traits.length}/3
            </p>
          </div>

          {/* NEW Question 6: Zhang Ayi Background */}
          <div className="question-group highlight">
            <label className="question-label">
              <span className="question-number">6</span>
              选择张阿姨的背景<br />
              <span className="question-english">Choose Zhang Ayi's background</span>
            </label>
            <div className="background-grid">
              {backgroundOptions.map((bg) => (
                <label
                  key={bg.id}
                  className={`background-card ${formData.ayi_background === bg.id ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="ayi_background"
                    value={bg.id}
                    checked={formData.ayi_background === bg.id}
                    onChange={(e) => handleChange('ayi_background', e.target.value)}
                    style={{ display: 'none' }}
                  />
                  <div className="background-emoji">{bg.emoji}</div>
                  <div className="background-title">{bg.label}</div>
                  <div className="background-english">{bg.english}</div>
                  <div className="background-desc">{bg.description}</div>
                </label>
              ))}
            </div>
          </div>

          <div className="button-group">
            <button type="submit" className="submit-button">
              开始与张阿姨对话 Start Chatting with Zhang Ayi 🚀
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuestionnaireModal;
