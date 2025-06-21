// AI Service for Gemini API interactions
class AIService {
    constructor() {
        console.log('🔧 AI Service constructor called');
        console.log('🔍 CONFIG object check in constructor:');
        console.log('  - CONFIG exists:', typeof CONFIG !== 'undefined');
        console.log('  - CONFIG.GEMINI_API_KEY exists:', !!CONFIG?.GEMINI_API_KEY);
        
        this.apiKey = CONFIG?.GEMINI_API_KEY;
        this.apiUrl = CONFIG?.GEMINI_API_URL;
        
        console.log('🔧 AI Service initialized');
        console.log('🔑 API Key present:', !!this.apiKey);
        console.log('🔑 API Key starts with AIza:', this.apiKey?.startsWith('AIza'));
        console.log('🔑 API Key length:', this.apiKey?.length);
    }

    async generateResponse(message) {
        // Always refresh API key before making a request
        if (!this.refreshApiKey()) {
            console.error('❌ API key validation failed');
            return "Please configure your Gemini API key in config.js to enable AI responses.";
        }

        if (!message || !message.trim()) {
            return "Please provide a message to get a response.";
        }

        try {
            console.log('🤖 Sending request to Gemini API...');
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{ 
                        parts: [{ 
                            text: message.trim() 
                        }] 
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    }
                })
            });

            console.log('📡 API Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                console.error('❌ Gemini API error:', data.error);
                return `Error: ${data.error.message || 'Unknown API error'}`;
            }

            const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!aiResponse) {
                console.warn('⚠️ No AI response in data');
                return "Sorry, I couldn't generate a response at the moment. Please try again.";
            }

            console.log('✅ AI response generated successfully');
            return aiResponse;

        } catch (error) {
            console.error('❌ Error contacting Gemini API:', error);
            
            if (error.message.includes('API key')) {
                return "API key error. Please check your configuration.";
            } else if (error.message.includes('network')) {
                return "Network error. Please check your internet connection.";
            } else {
                return "Sorry, I'm having trouble connecting right now. Please try again later.";
            }
        }
    }

    // Method to validate API key format
    validateApiKey() {
        // Refresh API key from config in case it was updated
        this.apiKey = CONFIG?.GEMINI_API_KEY;
        
        console.log('🔍 Debugging API key validation:');
        console.log('  - CONFIG object exists:', typeof CONFIG !== 'undefined');
        console.log('  - CONFIG.GEMINI_API_KEY exists:', !!CONFIG?.GEMINI_API_KEY);
        console.log('  - API Key value:', this.apiKey);
        console.log('  - API Key type:', typeof this.apiKey);
        console.log('  - API Key length:', this.apiKey?.length);
        console.log('  - API Key starts with AIza:', this.apiKey?.startsWith('AIza'));
        
        if (!this.apiKey) {
            console.warn('❌ No API key found in config');
            return false;
        }
        
        // Basic validation - Gemini API keys are typically long strings starting with 'AIza'
        const isValid = this.apiKey.length > 20 && this.apiKey.startsWith('AIza');
        console.log('🔑 API Key validation result:', isValid);
        return isValid;
    }

    // Method to refresh API key from config
    refreshApiKey() {
        this.apiKey = CONFIG?.GEMINI_API_KEY;
        console.log('🔄 API Key refreshed from config');
        return this.validateApiKey();
    }

    // Method to test API connection
    async testConnection() {
        try {
            console.log('🧪 Testing API connection...');
            const testResponse = await this.generateResponse("Hello");
            const isWorking = testResponse && 
                            !testResponse.includes("Error") && 
                            !testResponse.includes("configure") &&
                            !testResponse.includes("trouble");
            
            console.log('🔍 API test result:', isWorking ? '✅ Working' : '❌ Not working');
            return isWorking;
        } catch (error) {
            console.error('❌ API test failed:', error);
            return false;
        }
    }

    // Method to get API status
    getApiStatus() {
        const hasValidKey = this.validateApiKey();
        return {
            hasValidKey,
            apiKey: hasValidKey ? this.apiKey.substring(0, 10) + '...' : 'Not configured',
            isConfigured: hasValidKey
        };
    }
}

// Create global instance
const aiService = new AIService();

// Make aiService globally available
window.aiService = aiService; 