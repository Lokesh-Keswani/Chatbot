// Configuration file for the chatbot application
const CONFIG = {
    // Gemini API Configuration
    GEMINI_API_KEY: 'AIzaSyB-mECJerfCzwB9JUO4cp0EJxmIzl6dq0g', // Replace with your actual API key
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    
    // MongoDB Configuration
    // Choose one of the following options:
    
    // Option 1: MongoDB Atlas (Cloud - Recommended)
    MONGODB_URI: 'mongodb+srv://keswani399:270778eshnali@cluster0.fvmbrtz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    
    // Option 2: Local MongoDB
    // MONGODB_URI: 'mongodb://localhost:27017/chatbot',
    
    // Option 3: MongoDB Atlas with connection options
    // MONGODB_URI: 'mongodb+srv://username:password@cluster.mongodb.net/chatbot?retryWrites=true&w=majority&maxPoolSize=10&serverSelectionTimeoutMS=5000',
    
    // MongoDB Options
    MONGODB_OPTIONS: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    },
    
    // Application Settings
    AUTO_SPEAK_AI_RESPONSES: true,
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    MAX_MESSAGE_LENGTH: 1000,
    
    // Voice Settings
    VOICE_RATE: 0.9,
    VOICE_PITCH: 1,
    VOICE_VOLUME: 1.0,
    VOICE_LANG: 'en-US'
};

// Prevent modification of config in production
// Temporarily disabled to debug API key access issue
// if (typeof Object.freeze === 'function') {
//     Object.freeze(CONFIG);
// } 