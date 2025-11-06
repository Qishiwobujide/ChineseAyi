const { sendChatCompletion } = require('../config/openrouter');

/**
 * System prompt for Zhang Ayi tutor
 */
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

回复格式要求：
1. 正常回复学生的问题或内容（体现你的性格和背景）
2. 不要在回复中提及或重复学生的错误
3. 如果学生有错误，在你的正常回复之后，用以下格式添加纠正信息（这部分不会直接显示给学生，会在单独的纠正框中显示）：

【纠正】原句："[学生说的话]" → 更地道的说法："[正确或更好的表达]"
【解释】[简短说明为什么这样说更好]

重要：你的正常回复内容应该自然流畅，不要提及"你刚才说..."或"你这样说不对..."等，直接继续对话即可。纠正信息会自动在纠正框中显示。

保持你的个性，让学生感受到与真实的张阿姨对话！`;

    return prompt;
}

/**
 * System prompt for initial questionnaire
 */
function getQuestionnairePrompt() {
    return `你是张阿姨（Zhang Ayi），一位友善的中文导师。这是你第一次见到这位学生，你需要了解他们的学习需求。

请按以下顺序问问题（一次问一个）：
1. 首先问候学生，然后问：你想练习口语还是书面中文？（口语/书面）
2. 你主要想用于日常交流还是商务场合？（日常/商务）
3. 能简单介绍一下你的背景吗？比如你为什么想学中文？
4. 你觉得你的中文水平怎么样？（初级/中级/高级）

收集完这些信息后，热情地欢迎学生，总结他们的需求，然后开始正式的对话练习。

请用温暖、鼓励的语气，让学生感到放松。`;
}

/**
 * Generate Ayi's response based on conversation history
 */
async function generateAyiResponse(messages, userProfile, isQuestionnaire = false) {
    try {
        const systemPrompt = isQuestionnaire
            ? getQuestionnairePrompt()
            : getSystemPrompt(userProfile);

        const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ];

        const response = await sendChatCompletion(apiMessages, {
            temperature: 0.7,
            max_tokens: 500
        });

        const ayiMessage = response.choices[0].message.content;

        // Parse correction if present
        const correction = parseCorrection(ayiMessage);

        // Strip out the correction section from the displayed message
        const displayMessage = stripCorrectionSection(ayiMessage);

        return {
            message: displayMessage,
            correction: correction
        };
    } catch (error) {
        console.error('Error generating Ayi response:', error);
        throw error;
    }
}

/**
 * Strip correction section from message for display
 */
function stripCorrectionSection(message) {
    // Remove everything from 【纠正】 onwards
    const correctionIndex = message.indexOf('【纠正】');
    if (correctionIndex !== -1) {
        return message.substring(0, correctionIndex).trim();
    }
    return message;
}

/**
 * Parse correction from Ayi's response
 */
function parseCorrection(message) {
    const correctionMatch = message.match(/【纠正】原句：["""](.*?)["""] ?→ ?更地道的说法：["""](.*?)["""]/);
    const explanationMatch = message.match(/【解释】(.*?)(?=\n|$)/);

    if (correctionMatch) {
        return {
            original: correctionMatch[1],
            corrected: correctionMatch[2],
            explanation: explanationMatch ? explanationMatch[1].trim() : null
        };
    }

    return null;
}

/**
 * Extract questionnaire answers from conversation
 */
function extractQuestionnaireData(messages) {
    // This is a simple extraction - you might want to use AI to parse this more intelligently
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase());

    const data = {
        communication_type: null,
        usage_context: null,
        background: null,
        proficiency_level: null
    };

    // Simple keyword matching - can be improved
    userMessages.forEach(msg => {
        if (msg.includes('口语') || msg.includes('oral')) data.communication_type = 'oral';
        if (msg.includes('书面') || msg.includes('written')) data.communication_type = 'written';
        if (msg.includes('日常') || msg.includes('daily')) data.usage_context = 'daily';
        if (msg.includes('商务') || msg.includes('business')) data.usage_context = 'business';
        if (msg.includes('初级') || msg.includes('beginner')) data.proficiency_level = 'beginner';
        if (msg.includes('中级') || msg.includes('intermediate')) data.proficiency_level = 'intermediate';
        if (msg.includes('高级') || msg.includes('advanced')) data.proficiency_level = 'advanced';
    });

    return data;
}

module.exports = {
    generateAyiResponse,
    extractQuestionnaireData,
    getSystemPrompt,
    getQuestionnairePrompt
};
