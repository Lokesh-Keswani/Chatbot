// ChatApp Component - Simplified Direct DOM Approach
class ChatApp {
    constructor(props) {
        this.props = props;
        this.state = {
            messages: databaseService.getUserChats(props.user.id),
            inputMessage: '',
            isRecording: false,
            isTyping: false,
            speakingMessageId: null,
            autoSpeak: CONFIG.AUTO_SPEAK_AI_RESPONSES
        };
        
        // Make globally available
        window.chatApp = this;
        
        console.log('🎯 ChatApp initialized with', this.state.messages.length, 'messages');
    }

    mount(container) {
        this.container = container;
        this.render();
        this.setupEventListeners();
        this.loadMessages();
        console.log('✅ ChatApp mounted successfully');
    }

    render() {
        if (!this.container) return;
        
        const stats = databaseService.getUserStats(this.props.user.id);
        const apiStatus = aiService.getApiStatus();
        
        this.container.innerHTML = `
            <div class="flex flex-col h-screen bg-gray-50">
                <!-- Header -->
                <div class="bg-white shadow-md px-6 py-4 flex justify-between items-center">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            ${this.props.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 class="text-xl font-bold text-gray-800">AI Chatbot</h1>
                            <p class="text-sm text-gray-600">Welcome, ${this.props.user.name}!</p>
                            <div class="flex items-center space-x-4 text-xs text-gray-500">
                                <span>${stats.totalMessages} messages • Last active: ${stats.lastActivity ? utils.formatTimestamp(stats.lastActivity) : 'Never'}</span>
                                <span class="flex items-center space-x-1">
                                    <span class="w-2 h-2 rounded-full ${apiStatus.isConfigured ? 'bg-green-500' : 'bg-red-500'}"></span>
                                    <span>${apiStatus.isConfigured ? 'API Ready' : 'API Not Configured'}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-2">
                        <button id="auto-speak-btn" class="px-3 py-2 ${this.state.autoSpeak ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'} text-white rounded-lg text-sm transition-colors">
                            ${this.state.autoSpeak ? '🔊 Auto' : '🔇 Manual'}
                        </button>
                        <button id="clear-chat-btn" class="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors">
                            Clear Chat
                        </button>
                        <button id="logout-btn" class="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
                            Logout
                        </button>
                    </div>
                </div>
                
                <!-- Chat Messages Container -->
                <div id="chat-messages" class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    <!-- Messages will be loaded here -->
                </div>
                
                <!-- Input Area -->
                <div class="bg-white border-t border-gray-200 px-6 py-4">
                    <div class="flex items-center space-x-3">
                        <button id="voice-btn" class="w-12 h-12 ${this.state.isRecording ? 'bg-red-500 voice-recording' : 'bg-gray-200 hover:bg-gray-300'} rounded-full flex items-center justify-center transition-colors">
                            <span class="text-xl">${this.state.isRecording ? '🔴' : '🎤'}</span>
                        </button>
                        
                        <div class="flex-1 relative">
                            <input type="text" 
                                   id="message-input"
                                   placeholder="${this.state.isRecording ? 'Listening...' : 'Type your message here...'}"
                                   ${this.state.isRecording ? 'disabled' : ''}
                                   class="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 transition-colors">
                        </div>
                        
                        <button id="send-btn" class="w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors">
                            <span class="text-xl">➤</span>
                        </button>
                    </div>
                    
                    <div class="text-center mt-2">
                        <p class="text-xs text-gray-500">Press Ctrl+Enter to send • Escape to stop recording/speaking</p>
                    </div>
                </div>
            </div>
        `;
        
        console.log('✅ ChatApp rendered');
    }

    setupEventListeners() {
        try {
            // Input handling
            const input = document.getElementById('message-input');
            if (input) {
                input.addEventListener('input', (e) => {
                    this.state.inputMessage = e.target.value;
                    this.updateSendButton();
                });
                
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.sendMessage();
                    }
                });
            }

            // Send button
            const sendBtn = document.getElementById('send-btn');
            if (sendBtn) {
                sendBtn.addEventListener('click', () => this.sendMessage());
            }

            // Voice button
            const voiceBtn = document.getElementById('voice-btn');
            if (voiceBtn) {
                voiceBtn.addEventListener('click', () => this.toggleVoiceRecording());
            }

            // Auto speak button
            const autoSpeakBtn = document.getElementById('auto-speak-btn');
            if (autoSpeakBtn) {
                autoSpeakBtn.addEventListener('click', () => this.toggleAutoSpeak());
            }

            // Clear chat button
            const clearBtn = document.getElementById('clear-chat-btn');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => this.clearChat());
            }

            // Logout button
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    authService.logout();
                    window.app.render();
                });
            }

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    this.sendMessage();
                }
                if (e.key === 'Escape') {
                    this.stopVoiceRecording();
                    voiceService.stopSpeaking();
                }
            });

            console.log('✅ Event listeners attached');
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    loadMessages() {
        try {
            const chatContainer = document.getElementById('chat-messages');
            if (!chatContainer) return;

            chatContainer.innerHTML = '';

            if (this.state.messages.length === 0) {
                chatContainer.innerHTML = `
                    <div class="text-center text-gray-500 mt-20">
                        <div class="text-6xl mb-4">🤖</div>
                        <h2 class="text-2xl font-bold mb-2">Welcome to AI Chatbot!</h2>
                        <p>Start a conversation by typing a message or using voice input.</p>
                        <p class="text-sm mt-2">Press Ctrl+Enter to send messages quickly.</p>
                    </div>
                `;
            } else {
                this.state.messages.forEach((message, index) => {
                    this.addMessageToChat(message, index);
                });
                this.scrollToBottom();
            }

            console.log('✅ Messages loaded:', this.state.messages.length);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    addMessageToChat(message, index) {
        try {
            const chatContainer = document.getElementById('chat-messages');
            if (!chatContainer) return;

            const messageDiv = document.createElement('div');
            messageDiv.className = `message-bubble fade-in ${message.type === 'user' ? 'ml-auto' : 'mr-auto'} max-w-3xl`;
            messageDiv.innerHTML = `
                <div class="flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} items-start space-x-3">
                    ${message.type === 'ai' ? `
                        <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            AI
                        </div>
                    ` : ''}
                    
                    <div class="relative ${message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-white'} rounded-2xl px-4 py-3 shadow-sm">
                        <div class="text-sm leading-relaxed" style="white-space:pre-wrap;">${this.formatContent(message.content)}</div>
                        <div class="text-xs opacity-70 mt-1">${this.formatTime(message.timestamp)}</div>
                        
                        ${message.type === 'ai' ? `
                            <div class="flex items-center space-x-2 mt-3 pt-2 border-t border-gray-100">
                                <button onclick="chatApp.speakMessage(${index})" class="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition-colors flex items-center space-x-1">
                                    <span>🔉</span>
                                    <span>Speak</span>
                                </button>
                                <button onclick="chatApp.copyMessage(${index})" class="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors flex items-center space-x-1">
                                    <span>📋</span>
                                    <span>Copy</span>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${message.type === 'user' ? `
                        <div class="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            ${this.props.user.name.charAt(0).toUpperCase()}
                        </div>
                    ` : ''}
                </div>
            `;

            chatContainer.appendChild(messageDiv);
        } catch (error) {
            console.error('Error adding message to chat:', error);
        }
    }

    formatContent(content) {
        try {
            if (!content || !content.trim()) return '';
            
            // Use marked library if available for markdown parsing
            if (typeof marked !== 'undefined') {
                return marked.parse(content);
            }
            
            // Basic formatting fallback
            return content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>');
        } catch (error) {
            console.error('Error formatting content:', error);
            return content || '';
        }
    }

    formatTime(timestamp) {
        try {
            return utils.formatTimestamp(timestamp);
        } catch (error) {
            return new Date(timestamp).toLocaleTimeString();
        }
    }

    scrollToBottom() {
        try {
            const chatContainer = document.getElementById('chat-messages');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        } catch (error) {
            console.error('Error scrolling to bottom:', error);
        }
    }

    updateSendButton() {
        try {
            const sendBtn = document.getElementById('send-btn');
            const input = document.getElementById('message-input');
            if (sendBtn && input) {
                sendBtn.disabled = !input.value.trim();
            }
        } catch (error) {
            console.error('Error updating send button:', error);
        }
    }

    async sendMessage() {
        try {
            const input = document.getElementById('message-input');
            if (!input || !input.value.trim()) return;

            const content = input.value.trim();
            input.value = '';
            this.state.inputMessage = '';
            this.updateSendButton();

            // Add user message immediately
            const userMessage = {
                type: 'user',
                content: content,
                timestamp: Date.now()
            };

            this.state.messages.push(userMessage);
            databaseService.addMessage(this.props.user.id, userMessage);
            this.addMessageToChat(userMessage, this.state.messages.length - 1);
            this.scrollToBottom();

            // Show typing indicator
            this.addTypingIndicator();

            // Get AI response
            const aiResponse = await aiService.generateResponse(content);
            
            // Remove typing indicator
            this.removeTypingIndicator();

            if (aiResponse) {
                const aiMessage = {
                    type: 'ai',
                    content: aiResponse,
                    timestamp: Date.now()
                };

                this.state.messages.push(aiMessage);
                databaseService.addMessage(this.props.user.id, aiMessage);
                this.addMessageToChat(aiMessage, this.state.messages.length - 1);
                this.scrollToBottom();

                // Auto-speak if enabled
                if (this.state.autoSpeak) {
                    setTimeout(() => {
                        this.speakMessage(this.state.messages.length - 1);
                    }, 500);
                }
            }

        } catch (error) {
            console.error('Error sending message:', error);
            this.removeTypingIndicator();
            utils.showToast('Failed to send message. Please try again.', 'error');
        }
    }

    addTypingIndicator() {
        try {
            const chatContainer = document.getElementById('chat-messages');
            if (!chatContainer) return;

            // Remove existing typing indicator
            this.removeTypingIndicator();

            const typingDiv = document.createElement('div');
            typingDiv.id = 'typing-indicator';
            typingDiv.className = 'mr-auto max-w-3xl fade-in';
            typingDiv.innerHTML = `
                <div class="flex justify-start items-start space-x-3">
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        AI
                    </div>
                    <div class="bg-white rounded-2xl px-4 py-3 shadow-sm">
                        <div class="flex space-x-2">
                            <div class="w-2 h-2 bg-gray-400 rounded-full typing-indicator"></div>
                            <div class="w-2 h-2 bg-gray-400 rounded-full typing-indicator" style="animation-delay: 0.2s;"></div>
                            <div class="w-2 h-2 bg-gray-400 rounded-full typing-indicator" style="animation-delay: 0.4s;"></div>
                        </div>
                    </div>
                </div>
            `;

            chatContainer.appendChild(typingDiv);
            this.scrollToBottom();
        } catch (error) {
            console.error('Error adding typing indicator:', error);
        }
    }

    removeTypingIndicator() {
        try {
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
        } catch (error) {
            console.error('Error removing typing indicator:', error);
        }
    }

    async toggleVoiceRecording() {
        try {
            if (this.state.isRecording) {
                this.stopVoiceRecording();
            } else {
                this.startVoiceRecording();
            }
        } catch (error) {
            console.error('Error toggling voice recording:', error);
        }
    }

    async startVoiceRecording() {
        try {
            if (!voiceService.isSupported()) {
                utils.showToast('Voice recognition not supported in this browser', 'error');
                return;
            }

            this.state.isRecording = true;
            this.updateVoiceButton();

            const result = await voiceService.startListening();
            
            if (result && result.trim()) {
                const input = document.getElementById('message-input');
                if (input) {
                    input.value = result;
                    this.state.inputMessage = result;
                    this.updateSendButton();
                }
            }

            this.state.isRecording = false;
            this.updateVoiceButton();

        } catch (error) {
            console.error('Error starting voice recording:', error);
            this.state.isRecording = false;
            this.updateVoiceButton();
            utils.showToast('Voice recording failed', 'error');
        }
    }

    stopVoiceRecording() {
        try {
            voiceService.stopListening();
            this.state.isRecording = false;
            this.updateVoiceButton();
        } catch (error) {
            console.error('Error stopping voice recording:', error);
        }
    }

    updateVoiceButton() {
        try {
            const voiceBtn = document.getElementById('voice-btn');
            const input = document.getElementById('message-input');
            
            if (voiceBtn) {
                voiceBtn.className = `w-12 h-12 ${this.state.isRecording ? 'bg-red-500 voice-recording' : 'bg-gray-200 hover:bg-gray-300'} rounded-full flex items-center justify-center transition-colors`;
                voiceBtn.innerHTML = `<span class="text-xl">${this.state.isRecording ? '🔴' : '🎤'}</span>`;
            }
            
            if (input) {
                input.placeholder = this.state.isRecording ? 'Listening...' : 'Type your message here...';
                input.disabled = this.state.isRecording;
            }
        } catch (error) {
            console.error('Error updating voice button:', error);
        }
    }

    speakMessage(index) {
        try {
            const message = this.state.messages[index];
            if (!message || message.type !== 'ai') return;

            if (this.state.speakingMessageId === index) {
                voiceService.stopSpeaking();
                this.state.speakingMessageId = null;
            } else {
                voiceService.stopSpeaking();
                this.state.speakingMessageId = index;
                
                voiceService.speak(message.content, {
                    onEnd: () => {
                        this.state.speakingMessageId = null;
                    },
                    onError: () => {
                        this.state.speakingMessageId = null;
                        utils.showToast('Speech synthesis failed', 'error');
                    }
                });
            }
        } catch (error) {
            console.error('Error speaking message:', error);
            this.state.speakingMessageId = null;
        }
    }

    copyMessage(index) {
        try {
            const message = this.state.messages[index];
            if (!message) return;

            navigator.clipboard.writeText(message.content).then(() => {
                utils.showToast('Message copied to clipboard!', 'success');
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = message.content;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                utils.showToast('Message copied to clipboard!', 'success');
            });
        } catch (error) {
            console.error('Error copying message:', error);
            utils.showToast('Failed to copy message', 'error');
        }
    }

    toggleAutoSpeak() {
        try {
            this.state.autoSpeak = !this.state.autoSpeak;
            
            const autoSpeakBtn = document.getElementById('auto-speak-btn');
            if (autoSpeakBtn) {
                autoSpeakBtn.className = `px-3 py-2 ${this.state.autoSpeak ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'} text-white rounded-lg text-sm transition-colors`;
                autoSpeakBtn.innerHTML = this.state.autoSpeak ? '🔊 Auto' : '🔇 Manual';
            }
            
            utils.showToast(`Auto-speak ${this.state.autoSpeak ? 'enabled' : 'disabled'}`, 'info');
        } catch (error) {
            console.error('Error toggling auto speak:', error);
        }
    }

    clearChat() {
        try {
            if (confirm('Are you sure you want to clear all chat messages? This cannot be undone.')) {
                databaseService.clearUserChats(this.props.user.id);
                this.state.messages = [];
                this.loadMessages();
                utils.showToast('Chat cleared successfully!', 'success');
            }
        } catch (error) {
            console.error('Error clearing chat:', error);
            utils.showToast('Failed to clear chat', 'error');
        }
    }
} 