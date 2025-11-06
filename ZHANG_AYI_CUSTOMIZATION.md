# 🎎 Zhang Ayi Customization Features - IN PROGRESS

## Overview
Renaming "Chinese Ayi" to "Zhang Ayi" (张阿姨) and adding personality traits and background customization to make conversations more personalized and engaging.

## What's Been Done ✅

### 1. Database Schema Update
- Created `supabase-schema-update.sql` with new fields:
  - `ayi_personality_traits` (TEXT ARRAY) - stores up to 3 personality traits
  - `ayi_background` (TEXT) - stores Zhang Ayi's background story

### 2. Updated Questionnaire Modal
- Added Question 5: Personality Traits selection (up to 3)
  - 8 traits: Polite, Straightforward, Nice, Sassy, Encouraging, Strict, Humorous, Patient
  - Each with emoji and Chinese/English labels
- Added Question 6: Background selection
  - 6 backgrounds:
    - 👩‍🏫 Retired Teacher (退休教师)
    - 🏛️ Beijing Native (北京本地人)
    - 💼 Shanghai Businesswoman (上海女企业家)
    - 🌸 Taiwanese Aunt (台湾阿姨)
    - 🏙️ Hong Kong Ayi (香港阿姨)
    - 🌾 Village Elder (乡村长辈)

## What Needs to Be Done 📝

### 1. Update Questionnaire CSS
Add to `/frontend/src/components/QuestionnaireModal.css`:

```css
/* Wider modal for customization options */
.questionnaire-wide {
  max-width: 900px !important;
}

/* Highlight section for Zhang Ayi customization */
.question-group.highlight {
  background: linear-gradient(135deg, #f0f4ff 0%, #e3f2fd 100%);
  border-left: 4px solid #667eea;
}

/* Traits grid */
.traits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.trait-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.trait-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
  border-color: #667eea;
}

.trait-card.selected {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

.trait-emoji {
  font-size: 2.5em;
  margin-bottom: 10px;
}

.trait-label {
  font-size: 0.95em;
  font-weight: 600;
}

.hint-text {
  text-align: center;
  color: #999;
  margin-top: 10px;
  font-size: 0.9em;
}

/* Background grid */
.background-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.background-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.background-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.2);
  border-color: #667eea;
}

.background-card.selected {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

.background-emoji {
  font-size: 3em;
  margin-bottom: 10px;
}

.background-title {
  font-weight: 700;
  font-size: 1.1em;
  margin-bottom: 5px;
}

.background-english {
  font-size: 0.85em;
  opacity: 0.8;
  margin-bottom: 8px;
}

.background-desc {
  font-size: 0.85em;
  opacity: 0.7;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .traits-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .background-grid {
    grid-template-columns: 1fr;
  }
}
```

### 2. Update Backend Routes
Update `/backend/routes/user.js` PUT `/profile` endpoint to handle new fields:

```javascript
router.put('/profile', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { communication_type, usage_context, background, proficiency_level,
                ayi_personality_traits, ayi_background } = req.body;

        const updates = {};
        if (communication_type) updates.communication_type = communication_type;
        if (usage_context) updates.usage_context = usage_context;
        if (background) updates.background = background;
        if (proficiency_level) updates.proficiency_level = proficiency_level;
        if (ayi_personality_traits) updates.ayi_personality_traits = ayi_personality_traits;
        if (ayi_background) updates.ayi_background = ayi_background;
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabaseAdmin
            .from('user_profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json({ profile: data });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update user profile' });
    }
});
```

### 3. Update AI Service
Update `/backend/services/ayiService.js` to use personality traits and background:

```javascript
function getSystemPrompt(userProfile) {
    const { communication_type, usage_context, background, proficiency_level,
            ayi_personality_traits, ayi_background } = userProfile;

    // Build personality description
    const traitDescriptions = {
        polite: '非常礼貌和尊重',
        straightforward: '说话直率，直截了当',
        nice: '温和善良，关心学生',
        sassy: '有点俏皮，带点幽默的调侃',
        encouraging: '总是鼓励和支持学生',
        strict: '对错误严格，要求高',
        humorous: '幽默风趣，让学习轻松愉快',
        patient: '极其耐心，不厌其烦地解释'
    };

    const backgroundDescriptions = {
        retired_teacher: '我是一位退休的中文老师，有30年的教学经验。我温柔耐心，喜欢用传统的教学方法。',
        beijing_native: '我是土生土长的北京人，说一口地道的北京话。我对北方文化和历史非常熟悉。',
        shanghai_businesswoman: '我曾经是上海的女企业家，在商界打拼多年。我精明能干，说话简洁高效。',
        taiwanese_aunt: '我来自台湾，说话温婉亲切，带有台湾特色的用语和腔调。',
        hongkong_ayi: '我是香港阿姨，活力四射，说话时喜欢中英文混合，充满香港特色。',
        village_elder: '我是农村长辈，淳朴智慧，说话直接实在，用最简单的话讲道理。'
    };

    const personalityText = ayi_personality_traits && ayi_personality_traits.length > 0
        ? `我的性格特点：${ayi_personality_traits.map(t => traitDescriptions[t]).join('，')}。`
        : '';

    const backgroundText = ayi_background
        ? backgroundDescriptions[ayi_background]
        : '我是一位经验丰富的中文老师。';

    let prompt = `你是张阿姨（Zhang Ayi），一位帮助学生学习中文的导师。

${backgroundText}
${personalityText}

学生信息：
- 交流类型：${communication_type === 'oral' ? '口语' : '书面'}
- 使用场景：${usage_context === 'daily' ? '日常用语' : '商务中文'}
- 背景：${background || '未提供'}
- 水平：${proficiency_level === 'beginner' ? '初级' : proficiency_level === 'intermediate' ? '中级' : '高级'}

你的职责：
1. 用中文与学生交流，根据他们的水平调整语言难度
2. 根据你的性格特点和背景来回应学生
3. 仔细注意学生的表达方式，温和地指出错误并提供更地道的说法
4. 鼓励学生多说、多练习
5. 保持对话自然、有趣
6. 当学生犯错时，用【纠正】标记说明

回复格式：
- 正常回复学生的内容（体现你的性格和背景）
- 如果需要纠正，在回复后添加：
【纠正】原句："[学生说的话]" → 更地道的说法："[正确或更好的表达]"
【解释】[简短说明]

保持你的个性，让学生感受到与真实的张阿姨对话！`;

    return prompt;
}
```

### 4. Rename Throughout App
Search and replace "Chinese Ayi" → "Zhang Ayi" in these files:
- All frontend components (Auth.js, Chat.js, etc.)
- All backend services
- Package.json files
- README.md
- Database comments

Key files to update:
```
frontend/src/components/Auth.js → "Zhang Ayi - 张阿姨"
frontend/src/components/Chat.js → "Zhang Ayi" in header
backend/server.js → "Zhang Ayi API"
backend/routes/user.js → "Zhang Ayi" in Stripe descriptions
README.md → Title and references
package.json → Description fields
```

## Testing Checklist

After implementation:
1. [ ] Run database update script in Supabase
2. [ ] Test questionnaire shows all 6 questions
3. [ ] Test personality trait selection (max 3)
4. [ ] Test background selection
5. [ ] Test that traits/background save to database
6. [ ] Test that AI uses personality in responses
7. [ ] Test that AI uses background in responses
8. [ ] Verify all "Chinese Ayi" renamed to "Zhang Ayi"

## Benefits

✅ **Personalized Experience** - Each user gets their own Zhang Ayi
✅ **More Engaging** - Personality makes conversations feel real
✅ **Better Learning** - Background affects teaching style
✅ **Unique to Each User** - Different combos create different experiences
✅ **Fun Customization** - Users enjoy choosing their tutor's personality

## Example Combinations

1. **Strict Beijing Teacher** - Retired Teacher + Strict + Straightforward
2. **Fun Hong Kong Aunt** - Hong Kong Ayi + Humorous + Sassy + Nice
3. **Patient Taiwan Tutor** - Taiwanese Aunt + Patient + Polite + Encouraging
4. **No-Nonsense Village Elder** - Village Elder + Straightforward + Strict
5. **Supportive Shanghai Mentor** - Shanghai Businesswoman + Encouraging + Nice + Patient

Each combination creates a completely different learning experience!
