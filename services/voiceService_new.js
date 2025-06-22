// ENHANCED MULTILINGUAL VOICE SERVICE - ALL LANGUAGES FLUENT
class VoiceService {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isSpeaking = false;
        
        // Track current audio to stop it properly
        this.currentUtterance = null;
        this.currentAudio = null;
        this.currentPromise = null;
        
        // Cache voices for consistency (same voice every time)
        this.voiceCache = {};
        
        this.init();
    }

    init() {
        // Speech recognition setup
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            console.log('✅ Speech recognition ready');
        }

        if (this.synthesis) {
            console.log('✅ Speech synthesis ready');
            
            // Wait for voices to load
            if (this.synthesis.getVoices().length === 0) {
                this.synthesis.onvoiceschanged = () => {
                    console.log(`🎤 Voices loaded: ${this.synthesis.getVoices().length}`);
                    this.logAvailableVoices();
                };
            } else {
                this.logAvailableVoices();
            }
        }
    }

    // Log available voices for debugging
    logAvailableVoices() {
        const voices = this.synthesis.getVoices();
        console.log(`🎤 Available voices: ${voices.length}`);
        
        // Group by language for easier debugging
        const voicesByLang = {};
        voices.forEach(voice => {
            const lang = voice.lang.split('-')[0];
            if (!voicesByLang[lang]) voicesByLang[lang] = [];
            voicesByLang[lang].push(voice.name);
        });
        
        console.log('🌍 Voices by language:', voicesByLang);
    }

    // MAIN STOP FUNCTION - STOPS EVERYTHING
    stopAll() {
        console.log('🛑 STOPPING ALL AUDIO');
        
        // Stop speech synthesis
        if (this.synthesis) {
            this.synthesis.cancel();
        }
        
        // Stop ResponsiveVoice
        if (typeof responsiveVoice !== 'undefined') {
            responsiveVoice.cancel();
        }
        
        // Stop audio elements
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.remove();
            this.currentAudio = null;
        }
        
        // Clean all hidden audio elements
        document.querySelectorAll('audio[style*="display: none"]').forEach(audio => {
            audio.pause();
            audio.remove();
        });
        
        // Resolve pending promise
        if (this.currentPromise && this.currentPromise.resolve) {
            this.currentPromise.resolve();
            this.currentPromise = null;
        }
        
        // Reset state
        this.isSpeaking = false;
        this.currentUtterance = null;
        
        console.log('✅ All audio stopped');
    }

    // Enhanced language detection with better English handling
    detectLanguage(text) {
        // First check for non-Latin scripts (these are easier to detect)
        if (/[\u0900-\u097F]/.test(text)) return 'hi-IN'; // Hindi/Devanagari
        if (/[\u0A80-\u0AFF]/.test(text)) return 'gu-IN'; // Gujarati
        if (/[\u0980-\u09FF]/.test(text)) return 'bn-BD'; // Bengali
        if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN'; // Tamil
        if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN'; // Telugu
        if (/[\u0C80-\u0CFF]/.test(text)) return 'kn-IN'; // Kannada
        if (/[\u0D00-\u0D7F]/.test(text)) return 'ml-IN'; // Malayalam
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
        if (/[\u0400-\u04ff]/.test(text)) return 'ru-RU'; // Russian
        
        // For Latin-based languages, check for specific characters
        if (/[ñáéíóúü¿¡]/.test(text)) return 'es-ES'; // Spanish
        if (/[àâäéèêëïîôöùûüÿç]/.test(text)) return 'fr-FR'; // French
        if (/[äöüß]/.test(text)) return 'de-DE'; // German
        if (/[àèéìíîòóù]/.test(text)) return 'it-IT'; // Italian
        if (/[ãõçáéíóúâêîôû]/.test(text)) return 'pt-BR'; // Portuguese
        
        // Default to English for Latin text without special characters
        return 'en-US';
    }

    // Enhanced voice selection with better quality prioritization
    getVoice(language) {
        // Return cached voice for consistency
        if (this.voiceCache[language]) {
            console.log(`🎯 Using cached voice for ${language}: ${this.voiceCache[language].name}`);
            return this.voiceCache[language];
        }

        const voices = this.synthesis.getVoices();
        const baseLang = language.split('-')[0];
        
        console.log(`🔍 Finding voice for ${language} (base: ${baseLang})`);
        
        // Find voices for this language
        const langVoices = voices.filter(v => v.lang.startsWith(baseLang));
        
        console.log(`Found ${langVoices.length} voices for ${baseLang}:`, 
                   langVoices.map(v => `${v.name} (${v.lang})`));
        
        if (langVoices.length === 0) {
            console.log(`❌ No voices for ${baseLang}, using default (but NOT caching for ${language})`);
            console.log(`💡 To get ${baseLang} voices, install language pack:`);
            if (baseLang === 'ar') {
                console.log('   Windows: Settings > Time & Language > Language > Add Arabic');
                console.log('   Chrome: chrome://settings/languages > Add Arabic');
                console.log('   Alternative: Use Google Translate TTS online');
                console.warn('🔊 ARABIC TEXT DETECTED: For proper pronunciation, install Arabic language pack in Windows/Chrome!');
            } else if (baseLang === 'ur') {
                console.log('   Windows: Settings > Time & Language > Language > Add Urdu');
                console.log('   Alternative: Using Hindi voice as fallback');
                console.warn('🔊 URDU TEXT DETECTED: For proper pronunciation, install Urdu language pack in Windows/Chrome!');
            }
            // Don't cache a fallback voice for a specific language - let it try again next time
            const defaultVoice = voices.find(v => v.default) || voices[0];
            return defaultVoice;
        }
        
        // Enhanced voice selection with quality priorities
        let selectedVoice = null;
        
        // Priority 1: Neural/Premium voices
        selectedVoice = langVoices.find(v => 
            v.name.toLowerCase().includes('neural') ||
            v.name.toLowerCase().includes('premium') ||
            v.name.toLowerCase().includes('enhanced')
        );
        
        // Priority 2: Microsoft voices (high quality)
        if (!selectedVoice) {
            selectedVoice = langVoices.find(v => 
                v.name.toLowerCase().includes('microsoft') ||
                v.name.toLowerCase().includes('aria') ||
                v.name.toLowerCase().includes('guy') ||
                v.name.toLowerCase().includes('jenny')
            );
        }
        
        // Priority 3: Google voices
        if (!selectedVoice) {
            selectedVoice = langVoices.find(v => 
                v.name.toLowerCase().includes('google')
            );
        }
        
        // Priority 4: Female voices (generally more pleasant)
        if (!selectedVoice) {
            selectedVoice = langVoices.find(v => 
                v.name.toLowerCase().includes('female') ||
                v.name.toLowerCase().includes('woman') ||
                v.name.toLowerCase().includes('samantha') ||
                v.name.toLowerCase().includes('victoria') ||
                v.name.toLowerCase().includes('karen') ||
                v.name.toLowerCase().includes('susan')
            );
        }
        
        // Priority 5: Default voice for the language
        if (!selectedVoice) {
            selectedVoice = langVoices.find(v => v.default);
        }
        
        // Priority 6: First available voice
        if (!selectedVoice) {
            selectedVoice = langVoices[0];
        }
        
        // Cache the selection
        if (selectedVoice) {
            this.voiceCache[language] = selectedVoice;
            console.log(`✅ Selected and cached voice for ${language}: ${selectedVoice.name} (${selectedVoice.lang})`);
        }
        
        return selectedVoice;
    }

    // MAIN SPEAK FUNCTION - Enhanced for all languages
    async speak(text, language = 'en-US') {
        // Stop any current speech
        this.stopAll();
        
        this.isSpeaking = true;
        
        return new Promise((resolve) => {
            this.currentPromise = { resolve };
            
            console.log(`🔊 Speaking: "${text}" in ${language}`);
            
            // Show user notification for Arabic/Urdu text
            if (language === 'ar-SA' || language === 'ur-PK') {
                const langName = language === 'ar-SA' ? 'Arabic' : 'Urdu';
                console.log(`🌍 ${langName} text detected - checking available speech options...`);
            }
            
            // For Gujarati, prioritize cloud TTS over browser TTS
            if (language === 'gu-IN') {
                console.log('🎯 Gujarati detected - trying cloud TTS first');
                
                // Try ResponsiveVoice first for Gujarati
                if (this.tryResponsiveVoice(text, language, resolve)) {
                    return;
                }
                
                // If ResponsiveVoice fails, try Hindi voice with Gujarati text
                console.log('🔄 ResponsiveVoice not available, trying Hindi voice');
                const hindiVoice = this.getVoice('hi-IN');
                if (hindiVoice) {
                    console.log(`🎯 Using Hindi voice for Gujarati: ${hindiVoice.name}`);
                    this.useBrowserTTS(text, 'hi-IN', resolve);
                    return;
                }
                
                // Last resort: transliterate to English phonetics
                console.log('🔄 No Hindi voice, transliterating to English');
                const transliteratedText = this.transliterateGujaratiToEnglish(text);
                console.log(`🔤 Transliterated: "${transliteratedText}"`);
                this.useBrowserTTS(transliteratedText, 'en-US', resolve);
                return;
            }
            
            // For English, use browser TTS directly
            if (language.startsWith('en')) {
                this.useBrowserTTS(text, language, resolve);
                return;
            }
            
            // For Arabic/Urdu, use special handling
            if (language === 'ar-SA' || language === 'ur-PK') {
                console.log(`🌍 ${language === 'ar-SA' ? 'Arabic' : 'Urdu'} text detected - using specialized TTS`);
                this.handleArabicUrduTTS(text, language, resolve);
                return;
            }
            
            // For other languages, try ResponsiveVoice first, then browser TTS
            console.log(`🌐 Trying ResponsiveVoice for ${language}...`);
            if (!this.tryResponsiveVoice(text, language, resolve)) {
                console.log(`🔄 ResponsiveVoice failed/unavailable for ${language}, falling back to browser TTS`);
                this.useBrowserTTS(text, language, resolve);
            }
        });
    }

    // Enhanced ResponsiveVoice with more language support and better Gujarati handling
    tryResponsiveVoice(text, language, resolve) {
        console.log('🔍 Checking ResponsiveVoice availability...');
        console.log('  - responsiveVoice defined:', typeof responsiveVoice !== 'undefined');
        console.log('  - voiceSupport():', typeof responsiveVoice !== 'undefined' ? responsiveVoice.voiceSupport() : 'N/A');
        
        if (typeof responsiveVoice === 'undefined' || !responsiveVoice.voiceSupport()) {
            console.log('❌ ResponsiveVoice not available');
            return false;
        }

        // Expanded voice mapping for ResponsiveVoice with better Indian language support
        const voiceMap = {
            'es-ES': 'Spanish Female',
            'fr-FR': 'French Female', 
            'de-DE': 'Deutsch Female',
            'it-IT': 'Italian Female',
            'pt-BR': 'Brazilian Portuguese Female',
            'ru-RU': 'Russian Female',
            'hi-IN': 'Hindi Female',
            'gu-IN': 'Hindi Female', // Use Hindi voice for Gujarati (same language family)
            'bn-BD': 'Bengali Female',
            'ta-IN': 'Tamil Female',
            'te-IN': 'Telugu Female',
            'kn-IN': 'Hindi Female', // Kannada fallback to Hindi
            'ml-IN': 'Hindi Female', // Malayalam fallback to Hindi
            'mr-IN': 'Hindi Female', // Marathi fallback to Hindi
            'pa-IN': 'Hindi Female', // Punjabi fallback to Hindi
            'ur-PK': 'Hindi Female', // Urdu fallback to Hindi (similar pronunciation)
            'ar-SA': 'Arabic Female',
            'zh-CN': 'Chinese Female',
            'ja-JP': 'Japanese Female',
            'ko-KR': 'Korean Female',
            'nl-NL': 'Dutch Female',
            'sv-SE': 'Swedish Female',
            'no-NO': 'Norwegian Female',
            'da-DK': 'Danish Female',
            'pl-PL': 'Polish Female',
            'tr-TR': 'Turkish Female'
        };

        const voice = voiceMap[language];
        if (!voice) {
            console.log(`❌ No ResponsiveVoice mapping for ${language}`);
            return false; // Let browser TTS handle it
        }
        
        console.log(`☁️ Using ResponsiveVoice: ${voice} for ${language}`);
        
        // Additional ResponsiveVoice checks
        try {
            if (!responsiveVoice.isPlaying()) {
                console.log('✅ ResponsiveVoice ready to speak');
            } else {
                console.log('⚠️ ResponsiveVoice is currently playing, stopping...');
                responsiveVoice.cancel();
            }
        } catch (error) {
            console.log('⚠️ ResponsiveVoice state check failed:', error);
        }
        
        // For Gujarati and other Indic languages, try to improve pronunciation
        let processedText = text;
        if (language === 'gu-IN') {
            processedText = this.improveGujaratiPronunciation(text);
            console.log(`🔤 Gujarati text processed for better pronunciation`);
        }
        
        let finished = false;
        
        responsiveVoice.speak(processedText, voice, {
            rate: language === 'gu-IN' ? 0.8 : 0.9, // Slower for Gujarati
            pitch: 1,
            volume: 1,
            onend: () => {
                if (!finished) {
                    finished = true;
                    this.isSpeaking = false;
                    this.currentPromise = null;
                    console.log('✅ ResponsiveVoice completed');
                    resolve();
                }
            },
            onerror: () => {
                if (!finished) {
                    finished = true;
                    console.log('❌ ResponsiveVoice failed, trying browser TTS');
                    this.useBrowserTTS(text, language, resolve);
                }
            }
        });
        
        // Timeout fallback
        setTimeout(() => {
            if (!finished) {
                finished = true;
                responsiveVoice.cancel();
                console.log('⏰ ResponsiveVoice timeout, trying browser TTS');
                this.useBrowserTTS(text, language, resolve);
            }
        }, 10000);
        
        return true;
    }

    // Improve Gujarati pronunciation when using Hindi voice
    improveGujaratiPronunciation(text) {
        // Basic Gujarati to phonetic improvements for Hindi voice
        const gujaratiPhonetics = {
            // Common Gujarati words with better Hindi pronunciation
            'નમસ્તે': 'नमस्ते',
            'તમે': 'तुम',
            'કેમ': 'कैसे',
            'છો': 'हो',
            'શું': 'क्या',
            'છે': 'है',
            'માં': 'में',
            'અને': 'और',
            'ના': 'का',
            'ને': 'को',
            'થી': 'से',
            'પર': 'पर',
            'આ': 'यह',
            'તે': 'वह',
            'એક': 'एक',
            'બે': 'दो',
            'ત્રણ': 'तीन',
            'ચાર': 'चार',
            'પાંચ': 'पांच',
            'સારું': 'अच्छा',
            'ખરાબ': 'बुरा',
            'મોટું': 'बड़ा',
            'નાનું': 'छोटा',
            'નામ': 'नाम',
            'ઘર': 'घर',
            'પાણી': 'पानी',
            'જમવું': 'खाना',
            'આવો': 'आओ',
            'જાવ': 'जाओ',
            'બેસો': 'बैठो',
            'ઊભા': 'खड़े',
            'સમય': 'समय',
            'દિવસ': 'दिन',
            'રાત': 'रात',
            'સવાર': 'सुबह',
            'સાંજ': 'शाम'
        };
        
        let processedText = text;
        
        // Replace common Gujarati words with Hindi equivalents for better pronunciation
        Object.keys(gujaratiPhonetics).forEach(gujarati => {
            const hindi = gujaratiPhonetics[gujarati];
            processedText = processedText.replace(new RegExp(gujarati, 'g'), hindi);
        });
        
        return processedText;
    }

    // Specialized handler for Arabic and Urdu TTS
    handleArabicUrduTTS(text, language, resolve) {
        console.log(`🔧 Specialized ${language} TTS handler starting...`);
        
        const langName = language === 'ar-SA' ? 'Arabic' : 'Urdu';
        const baseLang = language.split('-')[0];
        let attemptCount = 0;
        let hasResolved = false;
        
        const tryNextMethod = () => {
            if (hasResolved) return;
            
            attemptCount++;
            console.log(`🔄 ${langName} TTS attempt ${attemptCount}`);
            
            switch(attemptCount) {
                case 1:
                    // Method 1: Try Google TTS first (more reliable)
                    console.log(`1️⃣ Trying Google TTS for ${langName}...`);
                    this.useDirectGoogleTTS(text, language === 'ar-SA' ? 'ar' : 'hi', () => {
                        if (!hasResolved) {
                            hasResolved = true;
                            console.log(`✅ Google TTS ${langName} completed`);
                            resolve();
                        }
                    }, () => {
                        console.log(`❌ Google TTS failed for ${langName}`);
                        setTimeout(tryNextMethod, 100);
                    });
                    break;
                    
                case 2:
                    // Method 2: Try ResponsiveVoice
                    console.log(`2️⃣ Trying ResponsiveVoice for ${langName}...`);
                    if (this.tryResponsiveVoiceSimple(text, language, () => {
                        if (!hasResolved) {
                            hasResolved = true;
                            console.log(`✅ ResponsiveVoice ${langName} completed`);
                            resolve();
                        }
                    })) {
                        console.log(`✅ ResponsiveVoice initiated for ${langName}`);
                        return;
                    }
                    console.log(`❌ ResponsiveVoice failed for ${langName}`);
                    setTimeout(tryNextMethod, 100);
                    break;
                    
                case 3:
                    // Method 3: Try browser TTS with available voices
                    console.log(`3️⃣ Trying browser TTS for ${langName}...`);
                    this.useBrowserTTSWithFallback(text, language, () => {
                        if (!hasResolved) {
                            hasResolved = true;
                            console.log(`✅ Browser TTS ${langName} completed`);
                            resolve();
                        }
                    });
                    break;
                    
                default:
                    // Method 4: Final fallback - English with notification
                    console.log(`4️⃣ Final fallback for ${langName}...`);
                    console.warn(`🔊 ${langName.toUpperCase()} TEXT DETECTED but no suitable voice found!`);
                    console.log('💡 Install language pack: Windows Settings > Language > Add Arabic/Urdu');
                    
                    // Use English but make it clear what's happening
                    if (this.synthesis) {
                        const utterance = new SpeechSynthesisUtterance(`${langName} text detected: ${text}`);
                        utterance.rate = 0.8;
                        utterance.onend = () => {
                            if (!hasResolved) {
                                hasResolved = true;
                                resolve();
                            }
                        };
                        utterance.onerror = () => {
                            if (!hasResolved) {
                                hasResolved = true;
                                resolve();
                            }
                        };
                        this.synthesis.speak(utterance);
                    } else {
                        if (!hasResolved) {
                            hasResolved = true;
                            resolve();
                        }
                    }
                    break;
            }
        };
        
        // Start the cascade
        tryNextMethod();
    }

    // Simplified ResponsiveVoice check
    tryResponsiveVoiceSimple(text, language, onSuccess) {
        if (typeof responsiveVoice === 'undefined' || !responsiveVoice.voiceSupport()) {
            return false;
        }
        
        const voiceMap = {
            'ar-SA': 'Arabic Female',
            'ur-PK': 'Hindi Female'
        };
        
        const voice = voiceMap[language];
        if (!voice) return false;
        
        try {
            responsiveVoice.speak(text, voice, {
                rate: 0.9,
                pitch: 1,
                volume: 1,
                onend: onSuccess,
                onerror: () => false
            });
            return true;
        } catch (error) {
            console.log('ResponsiveVoice error:', error);
            return false;
        }
    }

    // Direct Google TTS implementation
    useDirectGoogleTTS(text, lang, onSuccess, onError) {
        console.log(`🌐 Google TTS: Attempting ${lang} for text: "${text.substring(0, 50)}..."`);
        
        try {
            const audio = document.createElement('audio');
            const encodedText = encodeURIComponent(text.substring(0, 200));
            const urls = [
                `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob`,
                `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=gtx`,
                `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&total=1&idx=0&textlen=${text.length}&client=tw-ob`
            ];
            
            let urlIndex = 0;
            let completed = false;
            
            const tryNextUrl = () => {
                if (completed || urlIndex >= urls.length) {
                    if (!completed) {
                        console.log('❌ All Google TTS URLs failed');
                        onError();
                    }
                    return;
                }
                
                const currentUrl = urls[urlIndex];
                console.log(`🔗 Google TTS URL ${urlIndex + 1}: ${currentUrl}`);
                
                audio.src = currentUrl;
                urlIndex++;
            };
            
            audio.style.display = 'none';
            audio.crossOrigin = 'anonymous';
            document.body.appendChild(audio);
            
            audio.onloadstart = () => {
                console.log('📡 Google TTS: Loading started...');
            };
            
            audio.onloadeddata = () => {
                console.log('✅ Google TTS: Audio loaded successfully, playing...');
                audio.play().then(() => {
                    console.log('🔊 Google TTS: Playback started');
                }).catch(error => {
                    console.log('❌ Google TTS: Play failed:', error);
                    if (!completed) {
                        completed = true;
                        audio.remove();
                        onError();
                    }
                });
            };
            
            audio.onended = () => {
                if (!completed) {
                    completed = true;
                    console.log('✅ Google TTS: Playback completed');
                    audio.remove();
                    onSuccess();
                }
            };
            
            audio.onerror = (error) => {
                console.log(`❌ Google TTS: Error with URL ${urlIndex}: ${error.message || 'Unknown error'}`);
                if (urlIndex < urls.length) {
                    console.log('🔄 Google TTS: Trying next URL...');
                    tryNextUrl();
                } else {
                    if (!completed) {
                        completed = true;
                        audio.remove();
                        onError();
                    }
                }
            };
            
            // Timeout for each URL attempt
            setTimeout(() => {
                if (!completed && audio.readyState < 2) {
                    console.log(`⏱️ Google TTS: URL ${urlIndex} timed out, trying next...`);
                    if (urlIndex < urls.length) {
                        tryNextUrl();
                    } else {
                        if (!completed) {
                            completed = true;
                            audio.remove();
                            onError();
                        }
                    }
                }
            }, 3000);
            
            // Start with first URL
            tryNextUrl();
            
            this.currentAudio = audio;
            
        } catch (error) {
            console.error('❌ Google TTS: Exception:', error);
            onError();
        }
    }

    // Browser TTS with better fallback
    useBrowserTTSWithFallback(text, language, onSuccess) {
        if (!this.synthesis) {
            onSuccess();
            return;
        }
        
        const baseLang = language.split('-')[0];
        const voices = this.synthesis.getVoices();
        let voice = null;
        
        // Try to find appropriate voice
        if (baseLang === 'ar') {
            voice = voices.find(v => v.lang.startsWith('ar'));
        } else if (baseLang === 'ur') {
            voice = voices.find(v => v.lang.startsWith('ur')) || voices.find(v => v.lang.startsWith('hi'));
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
            console.log(`Using voice: ${voice.name} (${voice.lang})`);
        } else {
            utterance.lang = language;
            console.log(`No specific voice found, using default for ${language}`);
        }
        
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onend = onSuccess;
        utterance.onerror = onSuccess; // Don't fail, just complete
        
        this.synthesis.speak(utterance);
    }

    // Web-based TTS fallback for languages without local voices
    tryWebTTS(text, language, resolve) {
        console.log(`🌐 Attempting web-based TTS for ${language}`);
        
        // For Arabic, use Google Translate TTS
        if (language === 'ar-SA') {
            console.log('🔊 Using Google Translate TTS for Arabic');
            this.useGoogleTranslateTTS(text, 'ar', resolve);
            return true;
        }
        
        // For Urdu, fallback to Hindi Google TTS
        if (language === 'ur-PK') {
            console.log('🔊 Using Google Translate TTS (Hindi) for Urdu');
            this.useGoogleTranslateTTS(text, 'hi', resolve);
            return true;
        }
        
        return false;
    }

    // Google Translate TTS implementation
    useGoogleTranslateTTS(text, lang, resolve) {
        console.log(`🌐 Initializing Google TTS for ${lang}: "${text.substring(0, 50)}..."`);
        
        try {
            // Limit text length for Google TTS (max ~200 chars)
            const limitedText = text.length > 200 ? text.substring(0, 200) + '...' : text;
            
            // Create audio element for Google Translate TTS
            const audio = document.createElement('audio');
            const encodedText = encodeURIComponent(limitedText);
            
            // Use multiple Google TTS endpoints for better reliability
            const urls = [
                `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob`,
                `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=gtx`,
                `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&total=1&idx=0&prev=input`
            ];
            
            let urlIndex = 0;
            let hasResolved = false;
            
            const tryUrl = (index) => {
                if (index >= urls.length || hasResolved) {
                    if (!hasResolved) {
                        console.log('❌ All Google TTS URLs failed');
                        this.fallbackToBrowserTTS(text, lang, resolve);
                    }
                    return;
                }
                
                console.log(`🔗 Trying Google TTS URL ${index + 1}/${urls.length}`);
                audio.src = urls[index];
            };
            
            audio.style.display = 'none';
            audio.crossOrigin = 'anonymous';
            document.body.appendChild(audio);
            
            // Timeout for loading
            const loadTimeout = setTimeout(() => {
                if (!hasResolved) {
                    console.log('⏰ Google TTS load timeout');
                    tryUrl(++urlIndex);
                }
            }, 5000);
            
            audio.onloadeddata = () => {
                clearTimeout(loadTimeout);
                console.log('✅ Google TTS audio loaded successfully');
                
                audio.play().then(() => {
                    console.log('🔊 Google TTS playing...');
                }).catch(error => {
                    console.log('❌ Google TTS play failed:', error);
                    if (!hasResolved) {
                        hasResolved = true;
                        this.fallbackToBrowserTTS(text, lang, resolve);
                    }
                });
            };
            
            audio.onended = () => {
                if (!hasResolved) {
                    hasResolved = true;
                    console.log('✅ Google TTS completed successfully');
                    audio.remove();
                    this.isSpeaking = false;
                    this.currentPromise = null;
                    resolve();
                }
            };
            
            audio.onerror = (error) => {
                clearTimeout(loadTimeout);
                console.log('❌ Google TTS error:', error);
                
                if (urlIndex < urls.length - 1) {
                    tryUrl(++urlIndex);
                } else if (!hasResolved) {
                    hasResolved = true;
                    this.fallbackToBrowserTTS(text, lang, resolve);
                }
            };
            
            // Store reference for stopping
            this.currentAudio = audio;
            
            // Start with first URL
            tryUrl(0);
            
        } catch (error) {
            console.log('❌ Google TTS initialization failed:', error);
            this.fallbackToBrowserTTS(text, lang, resolve);
        }
    }
    
    // Helper method for fallback to browser TTS
    fallbackToBrowserTTS(text, lang, resolve) {
        console.log(`🔄 Falling back to browser TTS for ${lang}`);
        const language = lang === 'ar' ? 'ar-SA' : (lang === 'hi' ? 'ur-PK' : lang + '-IN');
        this.useBrowserTTS(text, language, resolve);
    }

    // Enhanced browser TTS with better Gujarati fallback handling
    useBrowserTTS(text, language, resolve) {
        if (!this.synthesis) {
            console.log('❌ No speech synthesis available');
            this.isSpeaking = false;
            this.currentPromise = null;
            resolve();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        let voice = this.getVoice(language);
        
        // Special handling for Gujarati and other languages without native voices
        if (!voice && language === 'gu-IN') {
            console.log('🔄 No Gujarati voice found, trying Hindi voice with Gujarati text');
            voice = this.getVoice('hi-IN');
            
            if (!voice) {
                console.log('🔄 No Hindi voice found, trying English voice with transliterated text');
                const transliteratedText = this.transliterateGujaratiToEnglish(text);
                utterance.text = transliteratedText;
                voice = this.getVoice('en-US');
                console.log(`🔤 Transliterated Gujarati to English: "${transliteratedText}"`);
            }
        }
        
        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang; // Use the voice's specific language
        } else {
            utterance.lang = language;
        }
        
        // Optimize settings based on language
        const baseLang = language.split('-')[0];
        
        // Adjust speech rate for different languages
        if (['zh', 'ja', 'ko', 'th'].includes(baseLang)) {
            utterance.rate = 0.8; // Slower for tonal languages
        } else if (['hi', 'bn', 'ta', 'te', 'ar', 'gu'].includes(baseLang)) {
            utterance.rate = 0.85; // Slightly slower for complex scripts
        } else {
            utterance.rate = 0.9; // Normal rate for Latin-based languages
        }
        
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onend = () => {
            console.log('✅ Browser TTS finished');
            this.isSpeaking = false;
            this.currentPromise = null;
            resolve();
        };
        
        utterance.onerror = (event) => {
            console.log('❌ Browser TTS error:', event.error);
            this.isSpeaking = false;
            this.currentPromise = null;
            resolve(); // Don't reject, just resolve to avoid errors
        };
        
        this.currentUtterance = utterance;
        this.synthesis.speak(utterance);
        
        console.log(`🔊 Browser TTS started with: ${voice ? voice.name : 'default voice'} for ${language}`);
        
        // Show helpful message for missing language voices
        if (!voice || (language === 'gu-IN' && voice.lang.startsWith('en'))) {
            console.log('💡 For better Gujarati speech, install Gujarati language pack:');
            console.log('   Windows: Settings > Time & Language > Language > Add Gujarati');
            console.log('   Or use online TTS services for better quality');
        }
    }

    // Transliterate Gujarati text to English phonetics as last resort
    transliterateGujaratiToEnglish(text) {
        const gujaratiToEnglish = {
            'નમસ્તે': 'namaste',
            'તમે': 'tame',
            'કેમ': 'kem',
            'છો': 'cho',
            'શું': 'shu',
            'છે': 'che',
            'માં': 'maa',
            'અને': 'ane',
            'ના': 'na',
            'ને': 'ne',
            'થી': 'thi',
            'પર': 'par',
            'આ': 'aa',
            'તે': 'te',
            'એક': 'ek',
            'બે': 'be',
            'ત્રણ': 'tran',
            'ચાર': 'char',
            'પાંચ': 'panch',
            'સારું': 'saaru',
            'ખરાબ': 'kharaab',
            'મોટું': 'motu',
            'નાનું': 'naanu',
            'નામ': 'naam',
            'ઘર': 'ghar',
            'પાણી': 'paani',
            'જમવું': 'jamvu',
            'આવો': 'aavo',
            'જાવ': 'jaav',
            'બેસો': 'beso',
            'ઊભા': 'ubha',
            'સમય': 'samay',
            'દિવસ': 'divas',
            'રાત': 'raat',
            'સવાર': 'savar',
            'સાંજ': 'saanj'
        };
        
        let transliterated = text;
        
        // Replace known Gujarati words with English phonetics
        Object.keys(gujaratiToEnglish).forEach(gujarati => {
            const english = gujaratiToEnglish[gujarati];
            transliterated = transliterated.replace(new RegExp(gujarati, 'g'), english);
        });
        
        return transliterated;
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

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.isListening = false;
                resolve(transcript);
            };

            this.recognition.onerror = (event) => {
                this.isListening = false;
                reject(new Error(event.error));
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
        }
    }

    // Backward compatibility methods
    stopSpeaking() {
        this.stopAll();
    }
    
    speakWithDebugging(text, options = {}) {
        console.log('🐛 speakWithDebugging called (deprecated), using speak() instead');
        return this.speak(text, options);
    }

    isSupported() {
        return !!this.recognition;
    }
    
    // Debug methods
    clearVoiceCache() {
        this.voiceCache = {};
        console.log('🧹 Voice cache cleared');
    }
    
    // Clear cache for a specific language
    clearLanguageCache(language) {
        if (this.voiceCache[language]) {
            delete this.voiceCache[language];
            console.log(`🧹 Voice cache cleared for ${language}`);
        }
    }
    
    getStatus() {
        return {
            isSpeaking: this.isSpeaking,
            isListening: this.isListening,
            hasCurrentAudio: !!this.currentAudio,
            cachedVoices: Object.keys(this.voiceCache),
            availableVoices: this.synthesis ? this.synthesis.getVoices().length : 0
        };
    }

    // Debug: Test Gujarati voice support
    testGujarati() {
        console.log('🧪 Testing Gujarati voice support...');
        
        // Test text in Gujarati
        const gujaratiText = 'નમસ્તે, તમે કેમ છો? આ એક ગુજરાતી ટેસ્ટ છે.';
        console.log(`📝 Test text: ${gujaratiText}`);
        
        // Check available voices
        const gujaratiVoices = this.getAvailableVoices().filter(voice => 
            voice.lang.startsWith('gu') || voice.name.toLowerCase().includes('gujarati')
        );
        
        console.log(`🎤 Available Gujarati voices: ${gujaratiVoices.length}`);
        gujaratiVoices.forEach(voice => {
            console.log(`  - ${voice.name} (${voice.lang})`);
        });
        
        // Check Hindi voices as fallback
        const hindiVoices = this.getAvailableVoices().filter(voice => 
            voice.lang.startsWith('hi') || voice.name.toLowerCase().includes('hindi')
        );
        
        console.log(`🎤 Available Hindi voices (fallback): ${hindiVoices.length}`);
        hindiVoices.forEach(voice => {
            console.log(`  - ${voice.name} (${voice.lang})`);
        });
        
        // Check ResponsiveVoice support
        if (typeof responsiveVoice !== 'undefined' && responsiveVoice.voiceSupport()) {
            console.log('☁️ ResponsiveVoice is available (will use Hindi Female voice for Gujarati)');
        } else {
            console.log('❌ ResponsiveVoice not available');
        }
        
        // Test the actual speech
        console.log('🔊 Testing Gujarati speech...');
        this.speak(gujaratiText, 'gu-IN');
    }

    // Debug: Show all available Indian language voices
    showIndianVoices() {
        console.log('🇮🇳 Available Indian language voices:');
        
        const indianLanguages = ['hi', 'gu', 'bn', 'ta', 'te', 'kn', 'ml', 'mr', 'pa', 'ur'];
        
        indianLanguages.forEach(lang => {
            const voices = this.getAvailableVoices().filter(voice => 
                voice.lang.startsWith(lang)
            );
            
            const langNames = {
                'hi': 'Hindi',
                'gu': 'Gujarati', 
                'bn': 'Bengali',
                'ta': 'Tamil',
                'te': 'Telugu',
                'kn': 'Kannada',
                'ml': 'Malayalam',
                'mr': 'Marathi',
                'pa': 'Punjabi',
                'ur': 'Urdu'
            };
            
            console.log(`${langNames[lang]} (${lang}): ${voices.length} voices`);
            voices.forEach(voice => {
                console.log(`  - ${voice.name} (${voice.lang})`);
            });
        });
        
        if (typeof responsiveVoice !== 'undefined' && responsiveVoice.voiceSupport()) {
            console.log('\n☁️ ResponsiveVoice provides cloud-based voices for:');
            console.log('  - Hindi, Bengali, Tamil, Telugu (and fallbacks for other Indian languages)');
        }
    }

    // Quick test for any language
    quickTest(text, language) {
        console.log(`🧪 Quick test: "${text}" in ${language}`);
        this.speak(text, language);
    }

    // Debug: Force test ResponsiveVoice for Gujarati
    forceTestResponsiveVoice() {
        console.log('🧪 Force testing ResponsiveVoice for Gujarati...');
        
        const gujaratiText = 'નમસ્તે, આ ગુજરાતી ટેસ્ટ છે.';
        
        if (typeof responsiveVoice === 'undefined') {
            console.log('❌ ResponsiveVoice not loaded');
            return;
        }
        
        if (!responsiveVoice.voiceSupport()) {
            console.log('❌ ResponsiveVoice not supported in this browser');
            return;
        }
        
        console.log('✅ ResponsiveVoice is available');
        console.log('🎤 Available ResponsiveVoice voices:');
        
        // List all ResponsiveVoice voices
        if (responsiveVoice.getVoices) {
            const voices = responsiveVoice.getVoices();
            voices.forEach(voice => {
                if (voice.name.includes('Hindi') || voice.name.includes('Bengali') || voice.name.includes('Tamil')) {
                    console.log(`  - ${voice.name}`);
                }
            });
        }
        
        console.log('🔊 Testing ResponsiveVoice with Hindi Female voice...');
        
        // Improve the text for Hindi pronunciation
        const improvedText = this.improveGujaratiPronunciation(gujaratiText);
        console.log(`🔤 Improved text: ${improvedText}`);
        
        responsiveVoice.speak(improvedText, 'Hindi Female', {
            rate: 0.8,
            pitch: 1,
            volume: 1,
            onend: () => {
                console.log('✅ ResponsiveVoice test completed successfully!');
            },
            onerror: (error) => {
                console.log('❌ ResponsiveVoice test failed:', error);
            }
        });
    }

    // Debug: Test all fallback methods for Gujarati
    testAllGujaratiFallbacks() {
        console.log('🧪 Testing all Gujarati fallback methods...');
        
        const gujaratiText = 'નમસ્તે, તમે કેમ છો?';
        
        console.log('1️⃣ Testing ResponsiveVoice...');
        if (typeof responsiveVoice !== 'undefined' && responsiveVoice.voiceSupport()) {
            const improvedText = this.improveGujaratiPronunciation(gujaratiText);
            responsiveVoice.speak(improvedText, 'Hindi Female', {
                rate: 0.8,
                onend: () => console.log('✅ ResponsiveVoice method completed')
            });
            
            setTimeout(() => {
                console.log('2️⃣ Testing Hindi browser voice...');
                const hindiVoice = this.getVoice('hi-IN');
                if (hindiVoice) {
                    console.log(`Found Hindi voice: ${hindiVoice.name}`);
                    const utterance = new SpeechSynthesisUtterance(gujaratiText);
                    utterance.voice = hindiVoice;
                    utterance.rate = 0.8;
                    utterance.onend = () => console.log('✅ Hindi browser voice completed');
                    this.synthesis.speak(utterance);
                    
                    setTimeout(() => {
                        console.log('3️⃣ Testing English transliteration...');
                        const transliterated = this.transliterateGujaratiToEnglish(gujaratiText);
                        console.log(`Transliterated: ${transliterated}`);
                        const englishUtterance = new SpeechSynthesisUtterance(transliterated);
                        englishUtterance.rate = 0.8;
                        englishUtterance.onend = () => console.log('✅ English transliteration completed');
                        this.synthesis.speak(englishUtterance);
                    }, 3000);
                } else {
                    console.log('❌ No Hindi voice found');
                }
            }, 3000);
        } else {
            console.log('❌ ResponsiveVoice not available');
        }
    }
}

// Replace the old service
window.voiceService = new VoiceService();

// Enhanced test functions
window.testVoice = (text = "Hello world", lang = "en-US") => {
    console.log('🧪 Testing:', text, 'Language:', lang);
    window.voiceService.speak(text, { lang });
};

window.stopVoice = () => {
    window.voiceService.stopAll();
};

window.testAllLanguages = () => {
    const tests = [
        { text: "Hello, how are you today?", lang: "en-US", name: "English" },
        { text: "Hola, ¿cómo estás hoy?", lang: "es-ES", name: "Spanish" },
        { text: "Bonjour, comment allez-vous aujourd'hui?", lang: "fr-FR", name: "French" },
        { text: "Hallo, wie geht es dir heute?", lang: "de-DE", name: "German" },
        { text: "Ciao, come stai oggi?", lang: "it-IT", name: "Italian" },
        { text: "नमस्ते, आप आज कैसे हैं?", lang: "hi-IN", name: "Hindi" },
        { text: "مرحبا، كيف حالك اليوم؟", lang: "ar-SA", name: "Arabic" },
        { text: "آپ آج کیسے ہیں؟", lang: "ur-PK", name: "Urdu" },
        { text: "你好，你今天好吗？", lang: "zh-CN", name: "Chinese" }
    ];
    
    console.log('🌍 Testing all languages...');
    tests.forEach((test, index) => {
        setTimeout(() => {
            console.log(`Testing ${test.name}: ${test.text}`);
            testVoice(test.text, test.lang);
        }, index * 4000); // 4 second delay between tests
    });
};

window.voiceStatus = () => {
    const status = window.voiceService.getStatus();
    console.log('📊 Voice Service Status:', status);
    return status;
};

console.log('🎤 ENHANCED Voice Service loaded!');
console.log('🧪 Test: testVoice("Hello world", "en-US")');
console.log('🌍 Test all: testAllLanguages()');
console.log('🛑 Stop: stopVoice()');
console.log('📊 Status: voiceStatus()'); 