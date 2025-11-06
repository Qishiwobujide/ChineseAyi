import React, { useState } from 'react';
import './SessionCustomizationModal.css';

function SessionCustomizationModal({ onComplete, onClose }) {
  const [formData, setFormData] = useState({
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
      emoji: '👩‍🏫',
      description: '30年教学经验，温柔耐心'
    },
    {
      id: 'beijing_native',
      label: '北京本地人',
      emoji: '🏛️',
      description: '地道北京话，了解北方文化'
    },
    {
      id: 'shanghai_businesswoman',
      label: '上海女企业家',
      emoji: '💼',
      description: '精明能干，商务中文专家'
    },
    {
      id: 'taiwanese_aunt',
      label: '台湾阿姨',
      emoji: '🌸',
      description: '温婉亲切，台湾特色用语'
    },
    {
      id: 'hongkong_ayi',
      label: '香港阿姨',
      emoji: '🏙️',
      description: '活力四射，中英文混合'
    },
    {
      id: 'village_elder',
      label: '乡村长辈',
      emoji: '🌾',
      description: '淳朴智慧，简单直接'
    }
  ];

  const toggleTrait = (traitId) => {
    const currentTraits = formData.ayi_personality_traits;
    if (currentTraits.includes(traitId)) {
      setFormData({
        ...formData,
        ayi_personality_traits: currentTraits.filter(t => t !== traitId)
      });
    } else {
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

  const selectBackground = (backgroundId) => {
    setFormData({
      ...formData,
      ayi_background: backgroundId
    });
  };

  const handleSubmit = () => {
    if (formData.ayi_personality_traits.length === 0) {
      alert('请至少选择1个性格特点 / Please select at least 1 personality trait');
      return;
    }

    if (!formData.ayi_background) {
      alert('请选择张阿姨的背景 / Please select Zhang Ayi\'s background');
      return;
    }

    onComplete(formData);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && onClose && onClose()}>
      <div className="modal-content customization-modal">
        <h2>🎎 定制您的张阿姨！</h2>
        <h3>Customize Your Zhang Ayi!</h3>
        <p className="modal-subtitle">
          每次对话都可以选择不同的性格和背景<br/>
          Each conversation can have a unique personality
        </p>

        {/* Personality Traits Selection */}
        <div className="question-group highlight">
          <label className="question-label">
            <span className="question-number">1</span>
            选择性格特点 <span className="question-english">Personality Traits</span>
          </label>
          <p className="hint-text">选择1-3个特点 / Select 1-3 traits</p>
          <div className="traits-grid">
            {personalityTraits.map(trait => (
              <div
                key={trait.id}
                className={`trait-card ${formData.ayi_personality_traits.includes(trait.id) ? 'selected' : ''}`}
                onClick={() => toggleTrait(trait.id)}
              >
                <div className="trait-emoji">{trait.emoji}</div>
                <div className="trait-label">{trait.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Background Selection */}
        <div className="question-group highlight">
          <label className="question-label">
            <span className="question-number">2</span>
            选择背景 <span className="question-english">Background</span>
          </label>
          <div className="background-grid">
            {backgroundOptions.map(bg => (
              <div
                key={bg.id}
                className={`background-card ${formData.ayi_background === bg.id ? 'selected' : ''}`}
                onClick={() => selectBackground(bg.id)}
              >
                <div className="background-emoji">{bg.emoji}</div>
                <div className="background-title">{bg.label}</div>
                <div className="background-desc">{bg.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="button-group">
          <button className="submit-button" onClick={handleSubmit}>
            开始对话 Start Conversation 🚀
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionCustomizationModal;
