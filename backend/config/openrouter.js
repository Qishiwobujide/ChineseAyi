const axios = require('axios');
require('dotenv').config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

/**
 * Send a chat completion request to OpenRouter API
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Additional options like temperature, max_tokens
 * @returns {Promise<Object>} - OpenRouter API response
 */
async function sendChatCompletion(messages, options = {}) {
    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: OPENROUTER_MODEL,
                messages: messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.max_tokens || 1000,
                ...options
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'http://localhost:3000', // Optional, for rankings
                    'X-Title': 'Zhang Ayi Tutor', // Optional, shows in rankings
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('OpenRouter API Error:', error.response?.data || error.message);
        throw new Error('Failed to get response from OpenRouter API');
    }
}

module.exports = { sendChatCompletion };
