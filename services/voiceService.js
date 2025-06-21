// Voice Service for speech recognition and synthesis
class VoiceService {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis || window.webkitSpeechSynthesis;
        this.isListening = false;
        this.currentUtterance = null;
        this.isSpeaking = false;
        this.init();
    }

    init() {
        // Initialize speech recognition if available
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            try {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = false;
                this.recognition.interimResults = false;
                this.recognition.lang = CONFIG.VOICE_LANG;
                console.log('Speech recognition initialized');
            } catch (error) {
                console.error('Error initializing speech recognition:', error);
            }
        } else {
            console.warn('Speech recognition not supported in this browser');
        }

        // Log speech synthesis support
        if (!this.synthesis) {
            console.warn('Speech synthesis not supported in this browser');
        } else {
            console.log('Speech synthesis available');
        }
    }

    speak(text, onEndCallback) {
        if (!this.synthesis) {
            console.error('Speech synthesis not available');
            if (onEndCallback) onEndCallback();
            return;
        }

        // Cancel any ongoing speech
        this.stopSpeaking();

        try {
            // Create a new utterance
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Set utterance properties
            utterance.rate = CONFIG.VOICE_RATE;
            utterance.pitch = CONFIG.VOICE_PITCH;
            utterance.volume = CONFIG.VOICE_VOLUME;
            utterance.lang = CONFIG.VOICE_LANG;

            // Handle the end of speech
            utterance.onend = () => {
                console.log('Speech finished');
                this.isSpeaking = false;
                if (onEndCallback) onEndCallback();
            };

            // Handle any errors
            utterance.onerror = (event) => {
                console.error('Speech error:', event);
                this.isSpeaking = false;
                if (onEndCallback) onEndCallback();
            };

            // Store and speak the utterance
            this.currentUtterance = utterance;
            this.isSpeaking = true;
            this.synthesis.speak(utterance);
            console.log('Started speaking:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
        } catch (error) {
            console.error('Error in speak:', error);
            this.isSpeaking = false;
            if (onEndCallback) onEndCallback();
        }
    }

    stopSpeaking() {
        if (this.synthesis) {
            try {
                this.synthesis.cancel();
                console.log('Speech stopped');
            } catch (error) {
                console.error('Error stopping speech:', error);
            }
        }
        this.isSpeaking = false;
    }

    startListening(onResult, onError) {
        if (!this.recognition) {
            const errorMsg = 'Speech recognition not supported or initialized';
            console.error(errorMsg);
            if (onError) onError(errorMsg);
            return;
        }

        if (this.isListening) {
            this.stopListening();
            return;
        }

        this.isListening = true;
        console.log('Starting speech recognition...');

        // Set up event handlers
        this.recognition.onresult = (event) => {
            try {
                const transcript = event.results[0][0].transcript;
                console.log('Speech recognized:', transcript);
                if (onResult) onResult(transcript);
            } catch (error) {
                console.error('Error processing speech result:', error);
                if (onError) onError('Error processing speech');
            }
            this.isListening = false;
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            if (onError) onError(event.error);
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                console.log('Speech recognition ended unexpectedly');
                this.isListening = false;
            }
        };

        // Start recognition
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            this.isListening = false;
            if (onError) onError('Failed to start speech recognition');
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
                console.log('Stopped listening');
            } catch (error) {
                console.error('Error stopping speech recognition:', error);
            } finally {
                this.isListening = false;
            }
        }
    }
}

// Create global instance
const voiceService = new VoiceService();

// Make voiceService globally available
window.voiceService = voiceService; 