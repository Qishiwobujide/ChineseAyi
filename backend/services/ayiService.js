const { sendChatCompletion } = require('../config/openrouter');

/**
 * System prompt for Chinese Ayi tutor
 */
function getSystemPrompt(userProfile) {
    const { communication_type, usage_context, background, proficiency_level } = userProfile;

    let prompt = `你是一位耐心、友善的中文阿姨老师。你的任务是帮助学生学习和练习中文。

学生信息：
- 交流类型：${communication_type === 'oral' ? '口语' : '书面'}
- 使用场景：${usage_context === 'daily' ? '日常用语' : '商务中文'}
- 背景：${background || '未提供'}
- 水平：${proficiency_level === 'beginner' ? '初级' : proficiency_level === 'intermediate' ? '中级' : '高级'}

你的职责：
1. 用中文与学生交流，根据他们的水平调整语言难度
2. 仔细注意学生的表达方式，如果有错误或不够地道的地方，温和地指出并提供更好的说法
3. 鼓励学生多说、多练习
4. 保持对话自然、有趣
5. 当学生犯错时，不要直接打断，而是在回复中自然地展示正确的用法，并用【纠正】标记说明

回复格式：
- 正常回复学生的内容
- 如果需要纠正，在回复后添加：
【纠正】原句："[学生说的话]" → 更地道的说法："[正确或更好的表达]"
【解释】[简短说明为什么这样说更好]

保持友善、鼓励的态度，让学生感到舒适和有信心。`;

    return prompt;
}

/**
 * System prompt for initial questionnaire
 */
function getQuestionnairePrompt() {
    return `你是一位友善的中文阿姨老师。这是你第一次见到这位学生，你需要了解他们的学习需求。

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

        return {
            message: ayiMessage,
            correction: correction
        };
    } catch (error) {
        console.error('Error generating Ayi response:', error);
        throw error;
    }
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
