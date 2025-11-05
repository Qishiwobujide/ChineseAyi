# 🎎 Chinese Ayi - 中文阿姨

A personalized Chinese language tutor powered by AI. The Chinese Ayi (阿姨) helps students learn and practice Chinese through interactive conversations, providing real-time corrections and suggestions for more authentic expressions (更地道的说法).

## ✨ Features

- **🎯 Personalized Learning**: Initial questionnaire to understand your learning goals
  - 口语/书面 (Oral/Written)
  - 日常/商务 (Daily/Business)
  - Your background and proficiency level

- **💬 Interactive Conversations**: Natural dialogue practice with an AI Chinese tutor

- **✅ Real-time Corrections**: Get instant feedback on your Chinese with better alternatives

- **📊 Message Tracking**: 12 free messages per day, with option to purchase credits

- **💎 Credit System**: Purchase credits to continue learning beyond daily limits

## 🏗️ Tech Stack

### Backend
- **Node.js + Express.js**: REST API server
- **OpenRouter API**: AI-powered responses using GPT-4o-mini
- **Supabase**: PostgreSQL database and authentication
- **JWT**: Secure authentication

### Frontend
- **React**: Interactive user interface
- **Supabase Client**: Authentication and real-time features
- **Axios**: HTTP client for API calls

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js (v16 or higher)
- npm or yarn
- Supabase account ([supabase.com](https://supabase.com))
- OpenRouter API key ([openrouter.ai](https://openrouter.ai))

## 🚀 Installation

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/Qishiwobujide/ChineseAyi.git
cd ChineseAyi
\`\`\`

### 2. Set Up Supabase Database

1. Create a new project on [Supabase](https://supabase.com)
2. Go to the SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the SQL script to create all tables and policies

### 3. Configure Backend

\`\`\`bash
cd backend
npm install
\`\`\`

Create a `.env` file in the `backend` directory:

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and add your credentials:

\`\`\`env
PORT=3001

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openai/gpt-4o-mini

# App Configuration
DAILY_MESSAGE_LIMIT=12
\`\`\`

### 4. Configure Frontend

\`\`\`bash
cd ../frontend
npm install
\`\`\`

Create a `.env` file in the `frontend` directory:

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and add your credentials:

\`\`\`env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_URL=http://localhost:3001/api
\`\`\`

## 🎮 Running the Application

### Development Mode

**Terminal 1 - Backend:**
\`\`\`bash
cd backend
npm run dev
\`\`\`

**Terminal 2 - Frontend:**
\`\`\`bash
cd frontend
npm start
\`\`\`

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 📱 How to Use

### First Time Users

1. **Sign Up**: Create an account with your email and password
2. **Questionnaire**: Answer the Ayi's questions to personalize your experience:
   - Oral or written Chinese?
   - Daily conversation or business Chinese?
   - Your background
   - Your proficiency level (beginner/intermediate/advanced)
3. **Start Learning**: Begin your conversation practice!

### Regular Use

1. **Log In**: Access your account
2. **Chat**: Start a new practice session
3. **Learn**: The Ayi will:
   - Engage in natural conversation
   - Correct your mistakes gently
   - Suggest more authentic ways to express yourself (更地道的说法)
   - Adapt to your level and preferences

### Message Limits

- 🆓 **12 free messages per day**
- 💎 **Purchase credits** to continue beyond the daily limit
- Credits are deducted when free messages run out

## 📊 API Endpoints

### User Routes (`/api/user`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update user preferences
- `GET /message-limit` - Check remaining messages
- `POST /credits/purchase` - Purchase credits
- `GET /credits/history` - View transaction history

### Chat Routes (`/api/chat`)
- `POST /session/start` - Start new conversation
- `POST /message` - Send a message
- `GET /session/:sessionId/messages` - Get conversation history
- `GET /sessions` - Get user's sessions
- `POST /session/:sessionId/end` - End a session

## 🗄️ Database Schema

The application uses the following main tables:

- **user_profiles**: User information and preferences
- **conversation_sessions**: Chat sessions
- **messages**: Individual messages with corrections
- **credit_transactions**: Credit purchases and usage

See `supabase-schema.sql` for complete schema details.

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- JWT-based authentication via Supabase
- Users can only access their own data
- Service role key used only for backend operations

## 🛠️ Development

### Project Structure

\`\`\`
ChineseAyi/
├── backend/
│   ├── config/          # Configuration files
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── server.js        # Entry point
├── frontend/
│   ├── public/          # Static files
│   └── src/
│       ├── components/  # React components
│       ├── config/      # Frontend config
│       └── App.js       # Main component
└── supabase-schema.sql  # Database schema
\`\`\`

### Key Services

**ayiService.js**: Core AI tutor logic
- Generates personalized system prompts
- Handles questionnaire flow
- Parses corrections from AI responses

## 📝 TODO / Future Enhancements

- [ ] Payment integration (Stripe/PayPal)
- [ ] Progress tracking and statistics
- [ ] Vocabulary list from conversations
- [ ] Audio message support
- [ ] Mobile app (React Native)
- [ ] More language learning modes
- [ ] Conversation topic suggestions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for learning and development.

## 🙏 Acknowledgments

- OpenRouter for AI API access
- Supabase for backend infrastructure
- The Chinese language learning community

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

Made with ❤️ for Chinese language learners
