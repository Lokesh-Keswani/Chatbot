# 🤖 AI Chatbot

A modern, feature-rich AI chatbot application built with vanilla JavaScript, featuring real-time chat, voice interaction, and MongoDB integration.

![AI Chatbot](https://img.shields.io/badge/AI-Chatbot-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![Node.js](https://img.shields.io/badge/Node.js-Server-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)

## ✨ Features

### 🎯 Core Features
- **Real-time Chat Interface** - Instant messaging like WhatsApp/ChatGPT
- **AI-Powered Responses** - Powered by Google Gemini 2.0 Flash API
- **Voice Input/Output** - Speech recognition and text-to-speech
- **User Authentication** - Secure login and registration system
- **Message History** - Persistent chat storage with MongoDB
- **Export Functionality** - Export chats as PDF, TXT, or JSON

### 🎨 User Experience
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Real-time Typing Indicators** - Shows when AI is responding
- **Message Animations** - Smooth fade-in effects for new messages
- **Auto-scroll** - Automatically scrolls to latest messages
- **Copy to Clipboard** - Easy message copying functionality
- **Theme-aware UI** - Modern, clean interface with Tailwind CSS

### 🔧 Technical Features
- **Modular Architecture** - Clean separation of services and components
- **Error Handling** - Comprehensive error recovery and user feedback
- **Cache Busting** - Automatic file versioning for updates
- **Local Storage Fallback** - Works offline with local data storage
- **MongoDB Integration** - Cloud database with automatic migration
- **API Key Protection** - Secure configuration management

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB account (optional, falls back to local storage)
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-chatbot.git
   cd ai-chatbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API keys**
   - Edit `config.js` and add your Gemini API key:
   ```javascript
   GEMINI_API_KEY: 'your-api-key-here'
   ```
   - Optionally configure MongoDB URI for cloud storage

4. **Start the server**
   ```bash
   node server.cjs
   ```

5. **Open in browser**
   Navigate to `http://localhost:8000`

## 🎮 Usage

### Demo Account
- **Email:** demo@example.com
- **Password:** demo123

### Creating New Account
1. Click "Don't have an account? Create one"
2. Fill in your details
3. Start chatting immediately

### Voice Features
- Click the microphone button to use voice input
- Toggle auto-speak for AI responses
- Press Escape to stop recording or speaking

### Keyboard Shortcuts
- **Ctrl + Enter** - Send message
- **Escape** - Stop voice recording/speaking

## 📁 Project Structure

```
ai-chatbot/
├── components/           # UI components
│   ├── App.js           # Main application component
│   ├── ChatApp.js       # Chat interface component
│   ├── LoginForm.js     # Authentication component
│   └── Component.js     # Base component class
├── services/            # Business logic services
│   ├── aiService.js     # Gemini API integration
│   ├── authService.js   # Authentication logic
│   ├── databaseService.js # Data management
│   ├── mongoService.js  # MongoDB operations
│   └── voiceService.js  # Speech recognition/synthesis
├── utils/               # Utility functions
│   └── helpers.js       # Common helper functions
├── config.js            # Configuration settings
├── server.cjs           # Express server
├── index.html           # Main HTML file
└── package.json         # Dependencies and scripts
```

## 🔧 Configuration

### API Keys
Edit `config.js` to configure:
- **Gemini API Key** - For AI responses
- **MongoDB URI** - For cloud storage (optional)
- **Voice Settings** - Speech rate, pitch, volume
- **Auto-save Interval** - Message backup frequency

### MongoDB Setup
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in `config.js`

## 🎯 Key Components

### ChatApp
- Real-time messaging interface
- Direct DOM manipulation for performance
- Typing indicators and animations
- Voice input/output integration

### AuthService
- User registration and login
- Session management
- Password validation
- Secure user data handling

### AIService
- Google Gemini API integration
- Response generation
- Error handling and retries
- Connection testing

### VoiceService
- Speech recognition (Web Speech API)
- Text-to-speech synthesis
- Voice command processing
- Audio controls

## 🛠️ Development

### Running in Development
```bash
# Start the server with auto-reload
node server.cjs

# The server will restart automatically when files change
```

### Cache Busting
The application uses version numbers (`?v=9`) for cache busting. Increment the version in `index.html` when making updates.

### Adding New Features
1. Create service files in `services/` for business logic
2. Create components in `components/` for UI
3. Update `index.html` to load new files
4. Increment cache version

## 🔒 Security Features

- Input validation and sanitization
- Secure password handling
- API key protection
- XSS prevention
- CORS configuration
- Error message sanitization

## 📱 Browser Compatibility

- **Chrome** - Full support
- **Firefox** - Full support
- **Safari** - Full support (limited voice features)
- **Edge** - Full support
- **Mobile browsers** - Responsive design

## 🐛 Troubleshooting

### Common Issues

1. **Server won't start (port in use)**
   ```bash
   # Kill existing process
   Get-Process -Name "node" | Stop-Process -Force
   ```

2. **API not working**
   - Check your Gemini API key in `config.js`
   - Verify internet connection
   - Check browser console for errors

3. **Voice features not working**
   - Ensure HTTPS (required for speech recognition)
   - Check microphone permissions
   - Try different browser

4. **MongoDB connection issues**
   - Verify connection string
   - Check network connectivity
   - Application falls back to local storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini API** - AI response generation
- **Tailwind CSS** - UI styling framework
- **MongoDB Atlas** - Cloud database service
- **Web Speech API** - Voice recognition and synthesis

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section
2. Search existing issues on GitHub
3. Create a new issue with detailed information

---

**Made with ❤️ by [Your Name]**

*A modern AI chatbot that brings conversational AI to your browser with a beautiful, responsive interface.* 