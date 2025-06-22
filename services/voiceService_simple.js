// Simplified and Reliable Voice Service
class VoiceService {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis || window.webkitSpeechSynthesis;
        this.isListening = false;
        this.isSpeaking = false;
        
        // Simple state management
        this.currentUtterance = null;
        this.currentAudio = null;
        this.currentPromiseResolve = null;
        
        // Voice consistency - always use the same voice per language
        this.selectedVoices = {};
        
        this.init();
    }

    init() {
        // Initialize speech recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            try {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = false;
                this.recognition.interimResults = false;
                this.recognition.lang = CONFIG.VOICE_LANG;
                console.log('✅ Speech recognition initialized');
            } catch (error) {
                console.error('❌ Error initializing speech recognition:', error);
            }
        }

        // Initialize speech synthesis
        if (this.synthesis) {
            console.log('✅ Speech synthesis available');
            
            // Wait for voices to load
            if (this.synthesis.getVoices().length === 0) {
                this.synthesis.onvoiceschanged = () => {
                    console.log(`🎤 Voices loaded: ${this.synthesis.getVoices().length}`);
                };
            }
        } else {
            console.warn('⚠️ Speech synthesis not supported');
        }
    }

    // CRITICAL: Comprehensive stop function
    stopAllAudio() {
        console.log('🛑 STOPPING ALL AUDIO...');
        
        try {
            // 1. Stop Web Speech Synthesis
            if (this.synthesis) {
                this.synthesis.cancel();
                console.log('✅ Web Speech stopped');
            }
            
            // 2. Stop ResponsiveVoice
            if (typeof responsiveVoice !== 'undefined') {
                responsiveVoice.cancel();
                console.log('✅ ResponsiveVoice stopped');
            }
            
            // 3. Stop current audio element
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
                if (document.body.contains(this.currentAudio)) {
                    document.body.removeChild(this.currentAudio);
                }
                this.currentAudio = null;
                console.log('✅ Audio element stopped');
            }
            
            // 4. Clean up ALL audio elements in the page
            const allAudio = document.querySelectorAll('audio');
            allAudio.forEach(audio => {
                audio.pause();
                audio.currentTime = 0;
                if (audio.style.display === 'none' || !audio.controls) {
                    audio.remove();
                }
            });
            
            if (allAudio.length > 0) {
                console.log(`✅ Cleaned ${allAudio.length} audio elements`);
            }
            
            // 5. Resolve pending promise
            if (this.currentPromiseResolve) {
                this.currentPromiseResolve();
                this.currentPromiseResolve = null;
                console.log('✅ Promise resolved');
            }
            
        } catch (error) {
            console.error('❌ Error stopping audio:', error);
        }
        
        // Reset all state
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.currentAudio = null;
        this.currentPromiseResolve = null;
        
        console.log('✅ ALL AUDIO STOPPED AND STATE RESET');
    }

    // Simple language detection
    detectLanguage(text) {
        // Basic patterns for common languages
        if (/[\u0900-\u097F]/.test(text)) return 'hi-IN'; // Hindi/Devanagari
        if (/[\u0A80-\u0AFF]/.test(text)) return 'gu-IN'; // Gujarati
        if (/[\u0980-\u09FF]/.test(text)) return 'bn-BD'; // Bengali
        if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN'; // Tamil
        if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN'; // Telugu
        if (/[\u0600-\u06FF]/.test(text)) {
            // Check for Urdu-specific characters and words
            if (/[یہںپچگکڑ]/.test(text) || /\b(یہ|ہے|میں|کا|کی|سے|کو|اور|آپ|تم|وہ)\b/.test(text)) {
                return 'ur-PK'; // Urdu
            }
            return 'ar-SA'; // Arabic
        }
        if (/[\u4e00-\u9fff]/.test(text)) return 'zh-CN'; // Chinese
        if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja-JP'; // Japanese
        if (/[\uac00-\ud7af]/.test(text)) return 'ko-KR'; // Korean
        if (/[ñáéíóúü¿¡]/.test(text)) return 'es-ES'; // Spanish
        if (/[àâäéèêëïîôöùûüÿç]/.test(text)) return 'fr-FR'; // French
        if (/[äöüß]/.test(text)) return 'de-DE'; // German
        if (/[àèéìíîòóù]/.test(text)) return 'it-IT'; // Italian
        if (/[ãõçáéíóúâêîôû]/.test(text)) return 'pt-BR'; // Portuguese
        if (/[\u0400-\u04ff]/.test(text)) return 'ru-RU'; // Russian
        
        return 'en-US'; // Default to English
    }

    // Get best voice with consistency
    getBestVoice(language) {
        if (!this.synthesis) return null;
        
        // Return cached voice for consistency
        if (this.selectedVoices[language]) {
            return this.selectedVoices[language];
        }
        
        const voices = this.synthesis.getVoices();
        const baseLang = language.split('-')[0];
        
        // Find voices for this language
        const langVoices = voices.filter(v => v.lang.startsWith(baseLang));
        
        if (langVoices.length === 0) {
            return voices.find(v => v.default) || voices[0] || null;
        }
        
        // Simple priority: prefer female voices, then default, then first available
        let selectedVoice = langVoices.find(v => 
            v.name.toLowerCase().includes('female') || 
            v.name.toLowerCase().includes('woman') ||
            v.name.toLowerCase().includes('aria') ||
            v.name.toLowerCase().includes('jenny')
        ) || langVoices.find(v => v.default) || langVoices[0];
        
        // Cache the selection for consistency
        this.selectedVoices[language] = selectedVoice;
        
        console.log(`🎯 Selected voice for ${language}: ${selectedVoice.name}`);
        return selectedVoice;
    }

    // Main speak function - simplified and reliable
    speak(text, options = {}) {
        return new Promise(async (resolve, reject) => {
            console.log('🔊 SPEAK CALLED:', text.substring(0, 50) + '...');
            
            // ALWAYS stop any existing audio first
            this.stopAllAudio();
            
            // Track this promise
            this.currentPromiseResolve = resolve;
            this.isSpeaking = true;
            
            try {
                const language = options.lang || this.detectLanguage(text);
                console.log(`🌍 Language: ${language}`);
                
                // Try cloud TTS first for better multilingual support
                const cloudSuccess = await this.tryCloudTTS(text, language);
                if (cloudSuccess) {
                    console.log('✅ Cloud TTS successful');
                    this.isSpeaking = false;
                    this.currentPromiseResolve = null;
                    resolve();
                    return;
                }
                
                // Fallback to local TTS
                console.log('🔄 Trying local TTS...');
                this.useLocalTTS(text, language, resolve, reject);
                
            } catch (error) {
                console.error('❌ Speech error:', error);
                this.isSpeaking = false;
                this.currentPromiseResolve = null;
                reject(error);
            }
        });
    }

    // Cloud TTS with ResponsiveVoice
    async tryCloudTTS(text, language) {
        if (typeof responsiveVoice === 'undefined' || !responsiveVoice.voiceSupport()) {
            return false;
        }
        
        console.log('☁️ Trying ResponsiveVoice...');
        
        return new Promise((resolve) => {
            // Voice mapping for ResponsiveVoice
            const voiceMap = {
                'hi-IN': 'Hindi Female',
                'gu-IN': 'Hindi Female', // Fallback
                'bn-BD': 'Bengali Female',
                'ta-IN': 'Tamil Female', 
                'te-IN': 'Telugu Female',
                'ar-SA': 'Arabic Female',
                'ur-PK': 'Hindi Female', // Urdu fallback to Hindi (similar pronunciation)
                'zh-CN': 'Chinese Female',
                'ja-JP': 'Japanese Female',
                'ko-KR': 'Korean Female',
                'es-ES': 'Spanish Female',
                'fr-FR': 'French Female',
                'de-DE': 'Deutsch Female',
                'it-IT': 'Italian Female',
                'pt-BR': 'Brazilian Portuguese Female',
                'ru-RU': 'Russian Female'
            };
            
            const voice = voiceMap[language] || 'UK English Female';
            let completed = false;
            
            console.log(`🎙️ Using ResponsiveVoice: ${voice}`);
            
            responsiveVoice.speak(text, voice, {
                onend: () => {
                    if (!completed) {
                        completed = true;
                        console.log('✅ ResponsiveVoice finished');
                        resolve(true);
                    }
                },
                onerror: () => {
                    if (!completed) {
                        completed = true;
                        console.log('❌ ResponsiveVoice failed');
                        resolve(false);
                    }
                }
            });
            
            // Timeout after 10 seconds
            setTimeout(() => {
                if (!completed) {
                    completed = true;
                    responsiveVoice.cancel();
                    console.log('⏰ ResponsiveVoice timeout');
                    resolve(false);
                }
            }, 10000);
        });
    }

    // Local TTS fallback
    useLocalTTS(text, language, resolve, reject) {
        if (!this.synthesis) {
            reject(new Error('Speech synthesis not available'));
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = this.getBestVoice(language);
        
        if (voice) {
            utterance.voice = voice;
            utterance.lang = language;
        } else {
            utterance.lang = 'en-US';
        }
        
        utterance.rate = CONFIG.VOICE_RATE || 0.9;
        utterance.pitch = CONFIG.VOICE_PITCH || 1;
        utterance.volume = CONFIG.VOICE_VOLUME || 1;
        
        utterance.onend = () => {
            console.log('✅ Local TTS finished');
            this.isSpeaking = false;
            this.currentPromiseResolve = null;
            resolve();
        };
        
        utterance.onerror = (event) => {
            console.error('❌ Local TTS error:', event.error);
            this.isSpeaking = false;
            this.currentPromiseResolve = null;
            
            if (event.error === 'interrupted' || event.error === 'canceled') {
                resolve(); // Don't treat cancellation as error
            } else {
                reject(new Error(`Speech error: ${event.error}`));
            }
        };
        
        this.currentUtterance = utterance;
        this.synthesis.speak(utterance);
        
        console.log(`🔊 Started local TTS with voice: ${voice ? voice.name : 'default'}`);
    }

    // Speech recognition
    startListening() {
        return new Promise((resolve, reject) => {
            if (!this.recognition) {
                reject(new Error('Speech recognition not supported'));
                return;
            }

            if (this.isListening) {
                this.stopListening();
                resolve('');
                return;
            }

            this.isListening = true;
            console.log('🎤 Starting speech recognition...');

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('🎤 Recognized:', transcript);
                this.isListening = false;
                resolve(transcript);
            };

            this.recognition.onerror = (event) => {
                console.error('❌ Recognition error:', event.error);
                this.isListening = false;
                reject(new Error(`Speech recognition error: ${event.error}`));
            };

            this.recognition.onend = () => {
                if (this.isListening) {
                    this.isListening = false;
                    resolve('');
                }
            };

            this.recognition.start();
        });
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            console.log('🎤 Stopped listening');
        }
    }

    // Alias for backward compatibility
    stopSpeaking() {
        this.stopAllAudio();
    }

    isSupported() {
        return !!this.recognition;
    }
    
    // Debug functions
    clearVoiceCache() {
        this.selectedVoices = {};
        console.log('🧹 Voice cache cleared');
    }
    
    getStatus() {
        return {
            isSpeaking: this.isSpeaking,
            isListening: this.isListening,
            hasCurrentAudio: !!this.currentAudio,
            cachedVoices: Object.keys(this.selectedVoices),
            availableVoices: this.synthesis ? this.synthesis.getVoices().length : 0
        };
    }
}

// Create global instance
const voiceService = new VoiceService();
window.voiceService = voiceService;

// Simple test functions
window.testVoice = (text = "Hello, this is a test", lang = "en-US") => {
    console.log('🧪 Testing voice...');
    voiceService.speak(text, { lang }).then(() => {
        console.log('✅ Test completed');
    }).catch(error => {
        console.error('❌ Test failed:', error);
    });
};

window.stopVoice = () => {
    console.log('🛑 Manual stop triggered');
    voiceService.stopAllAudio();
};

window.voiceStatus = () => {
    const status = voiceService.getStatus();
    console.log('📊 Voice Service Status:', status);
    return status;
};

console.log('🎤 Simplified Voice Service loaded');
console.log('🧪 Test with: testVoice("Hello world")');
console.log('🛑 Stop with: stopVoice()');
console.log('📊 Status with: voiceStatus()'); 