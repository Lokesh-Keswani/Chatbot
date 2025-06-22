// ChatApp Component - Simplified Direct DOM Approach
class ChatApp {
    constructor(props) {
        this.props = props;
        
        // Get chat sessions and set up initial state
        const chatSessions = databaseService.getUserChatSessions(props.user.id);
        const currentChatId = chatSessions.length > 0 ? chatSessions[0].id : null;
        
        // Get messages for current chat and remove any duplicates
        let messages = currentChatId ? databaseService.getUserChats(props.user.id, currentChatId) : [];
        messages = this.removeDuplicateMessages(messages);
        
        this.state = {
            messages: messages,
            inputMessage: '',
            isRecording: false,
            isTyping: false,
            speakingMessageId: null,
            autoSpeak: CONFIG.AUTO_SPEAK_AI_RESPONSES,
            chatSessions: chatSessions,
            currentChatId: currentChatId,
            sidebarCollapsed: false,
            currentTheme: utils.getCurrentTheme()
        };
        
        // Make globally available
        window.chatApp = this;
        
        console.log('🎯 ChatApp initialized with', this.state.messages.length, 'messages');
        console.log('📊 Current chat:', currentChatId);
        console.log('📊 Total sessions:', chatSessions.length);
    }

    mount(container) {
        this.container = container;
        this.render();
        this.setupEventListeners();
        this.loadMessages();
        console.log('✅ ChatApp mounted successfully');
    }

    removeDuplicateMessages(messages) {
        try {
            if (!messages || messages.length === 0) return messages;
            
            // Remove duplicates based on content, type, and timestamp
            const uniqueMessages = [];
            const seen = new Set();
            
            for (const message of messages) {
                // Create a unique key based on content, type, and timestamp
                const key = `${message.type}-${message.content}-${message.timestamp}`;
                
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueMessages.push(message);
                } else {
                    console.log('🗑️ Removing duplicate message:', message.content.substring(0, 50) + '...');
                }
            }
            
            console.log(`🔍 Duplicate check: ${messages.length} → ${uniqueMessages.length} messages`);
            
            // If we removed duplicates, update the database
            if (uniqueMessages.length !== messages.length) {
                console.log('💾 Updating database with deduplicated messages...');
                databaseService.chats[this.props.user.id] = uniqueMessages;
                databaseService.saveChats();
            }
            
            return uniqueMessages;
        } catch (error) {
            console.error('Error removing duplicate messages:', error);
            return messages;
        }
    }

    render() {
        if (!this.container) return;
        
        const stats = databaseService.getUserStats(this.props.user.id);
        const apiStatus = aiService.getApiStatus();
        const currentChat = this.state.currentChatId ? 
            this.state.chatSessions.find(chat => chat.id === this.state.currentChatId) : null;
        
        this.container.innerHTML = `
            <div class="flex h-screen bg-gray-50">
                <!-- Sidebar -->
                <div id="sidebar" class="w-80 md:w-80 sm:w-full bg-white border-r border-gray-200 flex flex-col ${this.state.sidebarCollapsed ? 'hidden' : ''} 
                     ${this.state.sidebarCollapsed ? '' : 'fixed md:relative z-30 md:z-auto'} 
                     ${this.state.sidebarCollapsed ? '' : 'inset-y-0 left-0 md:inset-auto'}">
                    <!-- Sidebar Header -->
                    <div class="p-3 md:p-4 border-b border-gray-200">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center space-x-2 md:space-x-3">
                                <div class="w-7 h-7 md:w-8 md:h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm">
                                    ${this.props.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div class="min-w-0 flex-1">
                                    <h2 class="font-semibold text-gray-800 text-sm md:text-base truncate">${this.props.user.name}</h2>
                                    <p class="text-xs text-gray-500 truncate">${stats.totalSessions} chats • ${stats.totalMessages} messages</p>
                                </div>
                            </div>
                            <button id="logout-btn" class="group p-2 md:p-2.5 bg-gray-100 hover:bg-red-50 rounded-lg transition-all duration-200 flex-shrink-0 border border-gray-200 hover:border-red-200 flex items-center justify-center" title="Logout">
                                <svg class="w-4 h-4 md:w-5 md:h-5 text-gray-500 group-hover:text-red-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                </svg>
                            </button>
                        </div>
                        
                        <!-- New Chat Button -->
                        <button id="new-chat-btn" class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 md:px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm md:text-base">
                            <span class="text-base md:text-lg">+</span>
                            <span>New Chat</span>
                        </button>
                    </div>
                    
                    <!-- Chat History -->
                    <div class="flex-1 overflow-y-auto">
                        <div id="chat-history" class="p-1 md:p-2">
                            ${this.renderChatHistory()}
                        </div>
                    </div>
                    
                    <!-- Sidebar Footer -->
                    <div class="p-3 md:p-4 border-t border-gray-200">
                        <!-- Account Settings -->
                        <div class="mb-3">
                            <button id="delete-account-btn" class="group w-full text-left px-3 py-2.5 text-sm bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-lg transition-all duration-200 flex items-center space-x-3">
                                <div class="w-8 h-8 bg-red-100 group-hover:bg-red-200 rounded-full flex items-center justify-center transition-colors">
                                    <svg class="w-4 h-4 text-red-500 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                </div>
                                <div>
                                    <span class="text-gray-700 group-hover:text-red-600 font-medium transition-colors">Delete Account</span>
                                    <p class="text-xs text-gray-500 group-hover:text-red-500 transition-colors">Permanently remove</p>
                                </div>
                            </button>
                        </div>
                        
                        <div class="flex items-center justify-between text-xs text-gray-500">
                            <span class="flex items-center space-x-1.5 md:space-x-1">
                                <span class="w-2 h-2 rounded-full ${apiStatus.isConfigured ? 'bg-green-500' : 'bg-red-500'}"></span>
                                <span>${apiStatus.isConfigured ? 'API Ready' : 'API Not Configured'}</span>
                            </span>
                            <button id="toggle-sidebar-btn" class="group p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 border border-gray-200" title="Toggle Sidebar">
                                <svg class="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Mobile Overlay -->
                ${!this.state.sidebarCollapsed ? `
                    <div class="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" id="sidebar-overlay"></div>
                ` : ''}
                
                <!-- Main Chat Area -->
                <div class="flex-1 flex flex-col ${!this.state.sidebarCollapsed ? 'md:ml-0' : ''}">
                    <!-- Chat Header -->
                    <div class="bg-white border-b border-gray-200 px-3 md:px-6 py-3 md:py-4 flex justify-between items-center">
                        <div class="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                            ${this.state.sidebarCollapsed ? `
                                <button id="show-sidebar-btn" class="group p-2 md:p-2.5 bg-gray-100 hover:bg-blue-50 rounded-lg transition-all duration-200 flex-shrink-0 border border-gray-200 hover:border-blue-200" title="Show Sidebar">
                                    <svg class="w-4 h-4 md:w-5 md:h-5 text-gray-500 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                                    </svg>
                                </button>
                            ` : ''}
                            <div class="min-w-0 flex-1">
                                <h1 class="text-base md:text-xl font-bold text-gray-800 truncate hidden md:block">${currentChat ? currentChat.title : 'AI Chatbot'}</h1>
                                <p class="text-xs md:text-sm text-gray-600 truncate hidden lg:block ${!currentChat ? 'hidden lg:block' : ''}">
                                    ${currentChat ? 
                                        `${currentChat.messages.length} messages • ${utils.formatTimestamp(currentChat.updatedAt)}` : 
                                        'Start a new conversation'
                                    }
                                </p>
                            </div>
                        </div>
                        
                        <div class="flex items-center space-x-2 md:space-x-1.5 flex-shrink-0 overflow-x-auto scrollbar-hide">
                            <!-- Theme Toggle Button -->
                            <button id="theme-toggle-btn" class="group w-10 h-10 md:w-auto md:h-auto md:p-2.5 bg-gradient-to-br ${this.state.currentTheme === 'dark' ? 'from-amber-100 to-yellow-100 hover:from-amber-200 hover:to-yellow-200' : 'from-slate-100 to-gray-100 hover:from-slate-200 hover:to-gray-200'} rounded-xl md:rounded-lg transition-all duration-300 theme-toggle border-2 md:border border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg flex-shrink-0 flex items-center justify-center" title="Toggle ${this.state.currentTheme === 'dark' ? 'light' : 'dark'} mode">
                                ${this.state.currentTheme === 'dark' ? `
                                    <svg class="w-5 h-5 md:w-5 md:h-5 text-amber-600 group-hover:text-amber-700" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
                                    </svg>
                                ` : `
                                    <svg class="w-5 h-5 md:w-5 md:h-5 text-slate-600 group-hover:text-slate-700" fill="currentColor" viewBox="0 0 24 24">
                                        <path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd"/>
                                    </svg>
                                `}
                            </button>
                            
                            <!-- PDF Download Button -->
                            <button id="download-pdf-btn" class="group w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl md:rounded-lg text-xs md:text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed md:space-x-1.5 border-2 md:border border-purple-400 flex-shrink-0 flex items-center justify-center" ${!currentChat || currentChat.messages.length === 0 ? 'disabled' : ''} title="Download chat as PDF">
                                <svg class="w-4 h-4 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                <span class="hidden md:inline font-medium text-white ml-1.5">PDF</span>
                            </button>
                            
                            <!-- Auto Speak Button -->
                            <button id="auto-speak-btn" class="group w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-2.5 ${this.state.autoSpeak ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600' : 'bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600'} text-white rounded-xl md:rounded-lg text-xs md:text-sm transition-all duration-200 shadow-md hover:shadow-lg md:space-x-1.5 border-2 md:border ${this.state.autoSpeak ? 'border-blue-400' : 'border-gray-400'} flex-shrink-0 flex items-center justify-center">
                                ${this.state.autoSpeak ? `
                                    <svg class="w-4 h-4 md:w-4 md:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0 11.5 11.5 0 010 16.267.75.75 0 11-1.06-1.06 10 10 0 000-14.147.75.75 0 010-1.06zM15.932 7.757a.75.75 0 011.061 0 7.5 7.5 0 010 10.606.75.75 0 01-1.06-1.06 6 6 0 000-8.486.75.75 0 010-1.06z"/>
                                    </svg>
                                ` : `
                                    <svg class="w-4 h-4 md:w-4 md:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM17.78 9.22a.75.75 0 10-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 001.06 1.06L19.5 13.06l1.72 1.72a.75.75 0 101.06-1.06L20.56 12l1.72-1.72a.75.75 0 00-1.06-1.06L19.5 10.94l-1.72-1.72z"/>
                                    </svg>
                                `}
                                <span class="hidden md:inline font-medium ml-1.5">${this.state.autoSpeak ? 'Auto' : 'Manual'}</span>
                            </button>
                            
                            <!-- Clear Chat Button -->
                            <button id="clear-chat-btn" class="group w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl md:rounded-lg text-xs md:text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed md:space-x-1.5 border-2 md:border border-red-400 flex-shrink-0 flex items-center justify-center" ${!currentChat ? 'disabled' : ''}>
                                <svg class="w-4 h-4 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                                <span class="hidden md:inline font-medium text-white ml-1.5">Clear</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Chat Messages Container -->
                    <div id="chat-messages" class="flex-1 overflow-y-auto px-3 md:px-6 py-3 md:py-4 space-y-2">
                        ${!currentChat ? `
                            <div class="flex items-center justify-center h-full p-4">
                                <div class="text-center max-w-md">
                                    <div class="w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                                        <span class="text-xl md:text-2xl">💬</span>
                                    </div>
                                    <h3 class="text-base md:text-lg font-semibold text-gray-800 mb-2">Welcome to AI Chatbot!</h3>
                                    <p class="text-sm md:text-base text-gray-600 mb-4 px-4 block md:hidden lg:block">Start a new conversation or select a previous chat from the sidebar.</p>
                                    <button id="start-new-chat-btn" class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm md:text-base">
                                        Start New Chat
                                    </button>
                                </div>
                            </div>
                        ` : '<!-- Messages will be loaded here -->'}
                    </div>
                    
                    <!-- Input Area -->
                    <div class="bg-white border-t border-gray-200 px-3 md:px-6 py-3 md:py-4">
                        <div class="flex items-center space-x-2 md:space-x-3">
                            <button id="voice-btn" class="group w-10 h-10 md:w-12 md:h-12 ${this.state.isRecording ? 'bg-gradient-to-r from-red-500 to-rose-500 voice-recording animate-pulse shadow-lg' : 'bg-gradient-to-br from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 border border-blue-200 hover:border-blue-300'} rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 shadow-sm hover:shadow-md">
                                ${this.state.isRecording ? `
                                    <svg class="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                                    </svg>
                                ` : `
                                    <svg class="w-5 h-5 md:w-6 md:h-6 text-blue-600 group-hover:text-blue-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                                    </svg>
                                `}
                            </button>
                            
                            <div class="flex-1 relative">
                                <input type="text" 
                                       id="message-input"
                                       placeholder="${this.state.isRecording ? 'Listening...' : 'Type your message here...'}"
                                       ${this.state.isRecording ? 'disabled' : ''}
                                       class="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 transition-colors text-sm md:text-base">
                            </div>
                            
                            <button id="send-btn" class="group w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 shadow-sm hover:shadow-md border border-blue-400 disabled:border-gray-300">
                                <svg class="w-5 h-5 md:w-6 md:h-6 text-white group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                </svg>
                            </button>
                        </div>
                        
                        <div class="text-center mt-2">
                            <p class="text-xs text-gray-500">Press Ctrl+Enter to send • Escape to stop recording/speaking</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        console.log('✅ ChatApp rendered');
    }

    renderChatHistory() {
        if (this.state.chatSessions.length === 0) {
            return `
                <div class="text-center py-8 text-gray-500">
                    <p class="text-sm">No chat history yet</p>
                    <p class="text-xs">Start a new conversation!</p>
                </div>
            `;
        }

        return this.state.chatSessions.map(chat => {
            const isActive = chat.id === this.state.currentChatId;
            const lastMessage = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
            
            return `
                <div class="chat-session-item group mb-1.5 md:mb-2 p-2.5 md:p-3 rounded-lg cursor-pointer transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm' : 'hover:bg-gray-50 hover:shadow-sm border border-transparent hover:border-gray-200'}" 
                     data-chat-id="${chat.id}">
                    <div class="flex justify-between items-start mb-1">
                        <div class="flex-1 mr-2 min-w-0">
                            <h3 class="chat-title font-medium text-gray-800 text-xs md:text-sm truncate" data-chat-id="${chat.id}">${chat.title}</h3>
                            <input type="text" class="chat-title-input hidden w-full text-xs md:text-sm font-medium text-gray-800 bg-white border-2 border-blue-400 rounded-md px-2 py-1 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-200" 
                                   data-chat-id="${chat.id}" value="${chat.title.replace(/"/g, '&quot;')}" maxlength="50">
                        </div>
                        <div class="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 lg:group-hover:opacity-100 opacity-100 lg:opacity-0 transition-all duration-200">
                            <button class="rename-chat-btn group/rename p-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-md transition-all duration-200 hover:shadow-sm" 
                                    data-chat-id="${chat.id}" title="Rename chat">
                                <svg class="w-3.5 h-3.5 text-blue-500 group-hover/rename:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                            </button>
                            <button class="delete-chat-btn group/delete p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-md transition-all duration-200 hover:shadow-sm" 
                                    data-chat-id="${chat.id}" title="Delete chat">
                                <svg class="w-3.5 h-3.5 text-red-500 group-hover/delete:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <p class="text-xs text-gray-500 truncate mb-1 leading-relaxed">
                        ${lastMessage ? (lastMessage.type === 'user' ? 'You: ' : 'AI: ') + lastMessage.content : 'No messages yet'}
                    </p>
                    <div class="flex justify-between items-center text-xs text-gray-400">
                        <span class="truncate">${chat.messages.length} messages</span>
                        <span class="text-xs flex-shrink-0 ml-2">${utils.formatTimestamp(chat.updatedAt)}</span>
                    </div>
                </div>
            `;
        }).join('');
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

            // Download PDF button
            const downloadPdfBtn = document.getElementById('download-pdf-btn');
            if (downloadPdfBtn) {
                downloadPdfBtn.addEventListener('click', () => this.downloadChatAsPDF());
            }

            // Auto speak button
            const autoSpeakBtn = document.getElementById('auto-speak-btn');
            if (autoSpeakBtn) {
                autoSpeakBtn.addEventListener('click', () => this.toggleAutoSpeak());
            }



            // Theme toggle button
            const themeToggleBtn = document.getElementById('theme-toggle-btn');
            if (themeToggleBtn) {
                themeToggleBtn.addEventListener('click', () => this.toggleTheme());
            }

            // Clear chat button
            const clearBtn = document.getElementById('clear-chat-btn');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => this.clearCurrentChat());
            }

            // Logout button
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    authService.logout();
                    window.app.render();
                });
            }

            // Delete account button
            const deleteAccountBtn = document.getElementById('delete-account-btn');
            if (deleteAccountBtn) {
                deleteAccountBtn.addEventListener('click', () => this.showDeleteAccountModal());
            }

            // New chat button
            const newChatBtn = document.getElementById('new-chat-btn');
            if (newChatBtn) {
                newChatBtn.addEventListener('click', () => this.createNewChat());
            }

            // Start new chat button (in empty state)
            const startNewChatBtn = document.getElementById('start-new-chat-btn');
            if (startNewChatBtn) {
                startNewChatBtn.addEventListener('click', () => this.createNewChat());
            }

            // Sidebar toggle buttons
            const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
            if (toggleSidebarBtn) {
                toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
            }

            const showSidebarBtn = document.getElementById('show-sidebar-btn');
            if (showSidebarBtn) {
                showSidebarBtn.addEventListener('click', () => this.toggleSidebar());
            }



            // Mobile overlay click
            const sidebarOverlay = document.getElementById('sidebar-overlay');
            if (sidebarOverlay) {
                sidebarOverlay.addEventListener('click', () => this.toggleSidebar());
            }

            // Chat session clicks
            const chatItems = document.querySelectorAll('.chat-session-item');
            chatItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('delete-chat-btn') && 
                        !e.target.classList.contains('rename-chat-btn') &&
                        !e.target.classList.contains('chat-title-input')) {
                        const chatId = item.getAttribute('data-chat-id');
                        this.switchToChat(chatId);
                    }
                });
            });

            // Delete chat buttons
            const deleteButtons = document.querySelectorAll('.delete-chat-btn');
            deleteButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const chatId = btn.getAttribute('data-chat-id');
                    this.deleteChat(chatId);
                });
            });

            // Rename chat buttons
            const renameButtons = document.querySelectorAll('.rename-chat-btn');
            renameButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const chatId = btn.getAttribute('data-chat-id');
                    this.renameChat(chatId);
                });
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    this.sendMessage();
                }
                if (e.key === 'Escape') {
                    this.stopVoiceRecording();
                    voiceService.stopAll();
                }
            });

            // Listen for theme changes from external sources
            window.addEventListener('themeChanged', (e) => {
                const newTheme = e.detail.theme;
                if (newTheme !== this.state.currentTheme) {
                    this.state.currentTheme = newTheme;
                    
                    // Update the theme toggle button if it exists
                    const themeToggleBtn = document.getElementById('theme-toggle-btn');
                    if (themeToggleBtn) {
                        const icon = themeToggleBtn.querySelector('span');
                        if (icon) {
                            icon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
                        }
                        themeToggleBtn.title = `Toggle ${newTheme === 'dark' ? 'light' : 'dark'} mode`;
                    }
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
            messageDiv.className = `message-bubble fade-in ${message.type === 'user' ? 'ml-auto' : 'mr-auto'} max-w-full md:max-w-3xl mb-1`;
            messageDiv.innerHTML = `
                <div class="flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} items-start space-x-2 md:space-x-3">
                    ${message.type === 'ai' ? `
                        <div class="w-6 h-6 md:w-8 md:h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-bold flex-shrink-0">
                            <span class="hidden md:inline">AI</span>
                            <span class="md:hidden">🤖</span>
                        </div>
                    ` : ''}
                    
                    <div class="relative ${message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-white'} rounded-2xl px-3 md:px-4 py-2.5 md:py-3 shadow-sm max-w-full ${message.type === 'user' ? 'max-w-[85%]' : 'max-w-[90%]'} md:max-w-full">
                        <div class="text-sm md:text-sm leading-relaxed message-content break-words">${this.formatContent(message.content)}</div>
                        <div class="text-xs opacity-70 mt-1.5 md:mt-2">${this.formatTime(message.timestamp)}</div>
                        
                        ${message.type === 'ai' ? `
                            <div class="flex items-center space-x-1.5 md:space-x-2 mt-2 pt-2 border-t border-gray-100">
                                <button onclick="chatApp.speakMessage(${index})" id="speak-btn-${index}" class="group/speak text-xs px-2 md:px-3 py-1.5 md:py-2 ${this.state.speakingMessageId === index ? 'bg-red-100 hover:bg-red-200 text-red-700 border-red-200 hover:border-red-300' : 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200 hover:border-blue-300'} rounded-lg transition-all duration-200 flex items-center space-x-1.5 border shadow-sm hover:shadow-md">
                                    ${this.state.speakingMessageId === index ? `
                                        <svg class="w-3.5 h-3.5 text-red-600 group-hover/speak:text-red-700 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M6 6h12v12H6z"/>
                                        </svg>
                                        <span class="hidden md:inline font-medium">Stop</span>
                                    ` : `
                                        <svg class="w-3.5 h-3.5 text-blue-600 group-hover/speak:text-blue-700 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                        </svg>
                                        <span class="hidden md:inline font-medium">Speak</span>
                                    `}
                                </button>
                                <button onclick="chatApp.copyMessage(${index})" class="group/copy text-xs px-2 md:px-3 py-1.5 md:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 flex items-center space-x-1.5 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md">
                                    <svg class="w-3.5 h-3.5 text-gray-600 group-hover/copy:text-gray-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                    </svg>
                                    <span class="hidden md:inline font-medium">Copy</span>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${message.type === 'user' ? `
                        <div class="w-6 h-6 md:w-8 md:h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-bold flex-shrink-0">
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
            
            // Clean up the content first
            let cleanContent = content.trim();
            
            // Use marked library if available for markdown parsing
            if (typeof marked !== 'undefined') {
                const rendered = marked.parse(cleanContent);
                // Clean up the rendered HTML properly
                return rendered
                    .replace(/^<p>/, '') // Remove opening p tag at start
                    .replace(/<\/p>$/, '') // Remove closing p tag at end
                    .replace(/<p>/g, '<br><br>') // Convert p tags to double breaks
                    .replace(/<\/p>/g, '') // Remove closing p tags
                    .replace(/^\s*<br><br>/, '') // Remove leading breaks
                    .replace(/<br><br>\s*$/, '') // Remove trailing breaks
                    .trim();
            }
            
            // Basic formatting fallback - simple and clean
            return cleanContent
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs">$1</code>')
                .replace(/\n\n/g, '<br><br>') // Double newlines to double breaks
                .replace(/\n/g, '<br>') // Single newlines to single breaks
                .trim();
        } catch (error) {
            console.error('Error formatting content:', error);
            return content ? content.trim() : '';
        }
    }

    formatContentForSpeech(content) {
        try {
            if (!content || !content.trim()) return '';
            
            // Clean content for speech synthesis (remove ALL markdown syntax)
            let cleanContent = content.trim();
            
            // Remove markdown formatting for speech - comprehensive cleaning
            return cleanContent
                // Remove bold and italic asterisks (both single and double)
                .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
                // Remove any remaining asterisks
                .replace(/\*/g, '')
                // Remove code backticks
                .replace(/`{1,3}([^`]+)`{1,3}/g, '$1')
                // Remove any remaining backticks
                .replace(/`/g, '')
                // Remove heading hashes
                .replace(/#{1,6}\s*/g, '')
                // Convert links to just text
                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                // Remove strikethrough
                .replace(/~~([^~]+)~~/g, '$1')
                // Remove underscores (alternative italic/bold)
                .replace(/_([^_]+)_/g, '$1')
                .replace(/__([^_]+)__/g, '$1')
                // Remove any remaining underscores
                .replace(/_/g, ' ')
                // Convert bullet points and lists
                .replace(/^\s*[-*+]\s+/gm, '')
                .replace(/^\s*\d+\.\s+/gm, '')
                // Convert double newlines to periods for natural speech pauses
                .replace(/\n\s*\n/g, '. ')
                // Convert single newlines to spaces
                .replace(/\n/g, ' ')
                // Clean up multiple spaces
                .replace(/\s+/g, ' ')
                // Remove any remaining special characters that might interfere
                .replace(/[#|>]/g, '')
                .trim();
        } catch (error) {
            console.error('Error formatting content for speech:', error);
            return content ? content.trim() : '';
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

            // Ensure we have a current chat
            if (!this.state.currentChatId) {
                const newChat = this.createNewChat();
                this.state.currentChatId = newChat.id;
            }

            // Add to database first and get the message with ID
            const savedUserMessage = databaseService.addMessage(this.props.user.id, userMessage, this.state.currentChatId);
            this.state.messages.push(savedUserMessage);
            console.log('✅ User message added:', savedUserMessage.content.substring(0, 50) + '...', 'Total messages:', this.state.messages.length);
            this.addMessageToChat(savedUserMessage, this.state.messages.length - 1);
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

                // Add to database first and get the message with ID
                const savedAiMessage = databaseService.addMessage(this.props.user.id, aiMessage, this.state.currentChatId);
                this.state.messages.push(savedAiMessage);
                console.log('✅ AI message added:', savedAiMessage.content.substring(0, 50) + '...', 'Total messages:', this.state.messages.length);
                this.addMessageToChat(savedAiMessage, this.state.messages.length - 1);
                this.scrollToBottom();

                // Update chat sessions
                this.refreshChatSessions();

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
            typingDiv.className = 'mr-auto max-w-3xl fade-in mb-1';
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
                // Stop any ongoing audio before starting recording
                this.stopAllAudio();
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

            // Stop any ongoing speech synthesis when starting voice recording
            this.stopAllAudio();
            
            this.state.isRecording = true;
            this.updateVoiceButton();

            const result = await voiceService.startListening();
            
            console.log('🎤 Voice input captured:', result);
            console.log('🎤 Voice input length:', result?.length, 'characters');
            
            if (result && result.trim()) {
                const input = document.getElementById('message-input');
                if (input) {
                    input.value = result;
                    this.state.inputMessage = result;
                    this.updateSendButton();
                    console.log('✅ Voice input set in message field');
                }
            } else {
                console.log('⚠️ No voice input captured or empty result');
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

    stopAllAudio() {
        try {
            // Stop any ongoing speech synthesis and listening
            if (voiceService) {
                voiceService.stopAll();
                voiceService.stopListening();
            }
            
            // Reset speaking state
            this.state.speakingMessageId = null;
            this.state.isRecording = false;
            
            // Update UI
            this.updateVoiceButton();
            
            console.log('🔇 All audio stopped');
        } catch (error) {
            console.error('Error stopping audio:', error);
        }
    }

    speakMessage(index) {
        try {
            const message = this.state.messages[index];
            if (!message || message.type !== 'ai') return;

            if (this.state.speakingMessageId === index) {
                voiceService.stopAll();
                this.state.speakingMessageId = null;
                this.updateSpeakButtons();
            } else {
                voiceService.stopAll();
                this.state.speakingMessageId = index;
                this.updateSpeakButtons();
                
                // Clean the content for speech (remove markdown syntax)
                const speechContent = this.formatContentForSpeech(message.content);
                
                console.log('🗣️ ChatApp: Starting speech for message', index);
                console.log('📝 Original content:', message.content.substring(0, 100) + '...');
                console.log('🧹 Cleaned content:', speechContent.substring(0, 100) + '...');
                
                // Check for Arabic/Urdu characters specifically
                const hasArabicScript = /[\u0600-\u06FF]/.test(speechContent);
                const hasUrduMarkers = /[یہںپچگکڑ]/.test(speechContent) || /\b(یہ|ہے|میں|کا|کی|سے|کو|اور|آپ|تم|وہ)\b/.test(speechContent);
                console.log('🔍 Arabic script detected:', hasArabicScript);
                console.log('🔍 Urdu markers detected:', hasUrduMarkers);
                
                // Detect language and use the new simplified voice service
                const detectedLanguage = voiceService.detectLanguage(speechContent);
                console.log(`🌍 Detected/Selected language: ${detectedLanguage}`);
                
                // Log ResponsiveVoice availability
                if (typeof responsiveVoice !== 'undefined') {
                    console.log('☁️ ResponsiveVoice available:', responsiveVoice.voiceSupport());
                } else {
                    console.log('❌ ResponsiveVoice not available');
                }
                
                voiceService.speak(speechContent, detectedLanguage).then(() => {
                    console.log('✅ Speech completed for message', index);
                    this.state.speakingMessageId = null;
                    this.updateSpeakButtons();
                }).catch(error => {
                    console.error('❌ Speech error for message', index, ':', error);
                    this.state.speakingMessageId = null;
                    this.updateSpeakButtons();
                    utils.showToast('Voice not available for this language.', 'warning');
                });
            }
        } catch (error) {
            console.error('Error speaking message:', error);
            this.state.speakingMessageId = null;
            this.updateSpeakButtons();
            utils.showToast('Speech feature error', 'error');
        }
    }

    updateSpeakButtons() {
        try {
            // Update all speak buttons to reflect current state
            this.state.messages.forEach((message, index) => {
                if (message.type === 'ai') {
                    const speakBtn = document.getElementById(`speak-btn-${index}`);
                    if (speakBtn) {
                        const isCurrentlySpeaking = this.state.speakingMessageId === index;
                        
                        // Update button classes
                        speakBtn.className = `group/speak text-xs px-2 md:px-3 py-1.5 md:py-2 ${isCurrentlySpeaking ? 'bg-red-100 hover:bg-red-200 text-red-700 border-red-200 hover:border-red-300' : 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200 hover:border-blue-300'} rounded-lg transition-all duration-200 flex items-center space-x-1.5 border shadow-sm hover:shadow-md`;
                        
                        // Update button content
                        speakBtn.innerHTML = isCurrentlySpeaking ? `
                            <svg class="w-3.5 h-3.5 text-red-600 group-hover/speak:text-red-700 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 6h12v12H6z"/>
                            </svg>
                            <span class="hidden md:inline font-medium">Stop</span>
                        ` : `
                            <svg class="w-3.5 h-3.5 text-blue-600 group-hover/speak:text-blue-700 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                            </svg>
                            <span class="hidden md:inline font-medium">Speak</span>
                        `;
                    }
                }
            });
        } catch (error) {
            console.error('Error updating speak buttons:', error);
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

    toggleTheme() {
        try {
            const newTheme = utils.toggleTheme();
            this.state.currentTheme = newTheme;
            
            // Update the theme toggle button
            const themeToggleBtn = document.getElementById('theme-toggle-btn');
            if (themeToggleBtn) {
                const icon = themeToggleBtn.querySelector('span');
                if (icon) {
                    icon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
                }
                themeToggleBtn.title = `Toggle ${newTheme === 'dark' ? 'light' : 'dark'} mode`;
            }
            
            console.log('🎨 Theme toggled to:', newTheme);
        } catch (error) {
            console.error('Error toggling theme:', error);
        }
    }

    clearCurrentChat() {
        try {
            if (!this.state.currentChatId) return;
            
            // Find the current chat title for the confirmation dialog
            const chat = this.state.chatSessions.find(c => c.id === this.state.currentChatId);
            const chatTitle = chat ? chat.title : 'this chat';
            
            this.showConfirmModal(
                'Clear Chat',
                `Are you sure you want to clear all messages in "${chatTitle}"? This cannot be undone.`,
                () => {
                    // Confirmed - clear the chat
                    // Stop any ongoing audio when clearing chat
                    this.stopAllAudio();
                    
                    databaseService.clearUserChats(this.props.user.id, this.state.currentChatId);
                    this.state.messages = [];
                    this.refreshChatSessions();
                    this.loadMessages();
                    utils.showToast('Chat cleared successfully!', 'success');
                },
                null, // onCancel callback
                'Clear', // confirm button text
                'red' // confirm button color
            );
        } catch (error) {
            console.error('Error clearing chat:', error);
            utils.showToast('Failed to clear chat', 'error');
        }
    }

    createNewChat() {
        try {
            // Stop any ongoing audio when creating new chat
            this.stopAllAudio();
            
            const newChat = databaseService.createNewChat(this.props.user.id);
            this.state.currentChatId = newChat.id;
            this.state.messages = [];
            this.refreshChatSessions();
            this.render();
            this.setupEventListeners();
            
            // Focus on input
            const input = document.getElementById('message-input');
            if (input) input.focus();
            
            console.log('✅ New chat created:', newChat.id);
            return newChat;
        } catch (error) {
            console.error('Error creating new chat:', error);
            utils.showToast('Failed to create new chat', 'error');
        }
    }

    switchToChat(chatId) {
        try {
            if (chatId === this.state.currentChatId) return;
            
            // Stop any ongoing audio/speech when switching chats
            this.stopAllAudio();
            
            this.state.currentChatId = chatId;
            this.state.messages = databaseService.getUserChats(this.props.user.id, chatId);
            this.render();
            this.setupEventListeners();
            this.loadMessages();
            
            console.log('✅ Switched to chat:', chatId);
        } catch (error) {
            console.error('Error switching chat:', error);
            utils.showToast('Failed to switch chat', 'error');
        }
    }

    deleteChat(chatId) {
        try {
            // Find the chat title for the confirmation dialog
            const chat = this.state.chatSessions.find(c => c.id === chatId);
            const chatTitle = chat ? chat.title : 'this chat';
            
            this.showConfirmModal(
                'Delete Chat',
                `Are you sure you want to delete "${chatTitle}"? This cannot be undone.`,
                () => {
                    // Confirmed - delete the chat
                    const success = databaseService.deleteChat(this.props.user.id, chatId);
                    
                    if (success) {
                        // If we deleted the current chat, switch to another or create new
                        if (chatId === this.state.currentChatId) {
                            this.refreshChatSessions();
                            if (this.state.chatSessions.length > 0) {
                                this.switchToChat(this.state.chatSessions[0].id);
                            } else {
                                this.state.currentChatId = null;
                                this.state.messages = [];
                                this.render();
                                this.setupEventListeners();
                            }
                        } else {
                            this.refreshChatSessions();
                            this.updateSidebar();
                        }
                        
                        utils.showToast('Chat deleted successfully!', 'success');
                    } else {
                        utils.showToast('Failed to delete chat', 'error');
                    }
                },
                null, // onCancel callback
                'Delete', // confirm button text
                'red' // confirm button color
            );
        } catch (error) {
            console.error('Error deleting chat:', error);
            utils.showToast('Failed to delete chat', 'error');
        }
    }

    renameChat(chatId) {
        try {
            // Find the title elements
            const titleElement = document.querySelector(`.chat-title[data-chat-id="${chatId}"]`);
            const inputElement = document.querySelector(`.chat-title-input[data-chat-id="${chatId}"]`);
            
            if (!titleElement || !inputElement) {
                utils.showToast('Chat not found', 'error');
                return;
            }

            // Hide title, show input
            titleElement.classList.add('hidden');
            inputElement.classList.remove('hidden');
            inputElement.focus();
            inputElement.select();

            // Store original value for cancellation
            const originalValue = inputElement.value;

            // Handle save on Enter or blur
            const saveRename = () => {
                const newTitle = inputElement.value.trim();
                
                if (newTitle && newTitle !== originalValue) {
                    const success = databaseService.renameChat(this.props.user.id, chatId, newTitle);
                    
                    if (success) {
                        // Update the chat sessions
                        this.refreshChatSessions();
                        
                        // If this is the current chat, update the header
                        if (chatId === this.state.currentChatId) {
                            this.render();
                            this.setupEventListeners();
                            this.loadMessages();
                        } else {
                            // Just update the sidebar
                            this.updateSidebar();
                        }
                        
                        utils.showToast('Chat renamed successfully!', 'success');
                    } else {
                        utils.showToast('Failed to rename chat', 'error');
                        // Revert to original value
                        inputElement.value = originalValue;
                    }
                } else {
                    // Revert to original value if empty or unchanged
                    inputElement.value = originalValue;
                }

                // Hide input, show title
                inputElement.classList.add('hidden');
                titleElement.classList.remove('hidden');
            };

            // Handle cancel on Escape
            const cancelRename = () => {
                inputElement.value = originalValue;
                inputElement.classList.add('hidden');
                titleElement.classList.remove('hidden');
            };

            // Event listeners for save/cancel
            const handleKeyDown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveRename();
                    inputElement.removeEventListener('keydown', handleKeyDown);
                    inputElement.removeEventListener('blur', saveRename);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelRename();
                    inputElement.removeEventListener('keydown', handleKeyDown);
                    inputElement.removeEventListener('blur', saveRename);
                }
            };

            inputElement.addEventListener('keydown', handleKeyDown);
            inputElement.addEventListener('blur', saveRename);

        } catch (error) {
            console.error('Error renaming chat:', error);
            utils.showToast('Failed to rename chat', 'error');
        }
    }

    toggleSidebar() {
        // Stop any ongoing audio when toggling sidebar
        this.stopAllAudio();
        
        this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
        this.render();
        this.setupEventListeners();
        this.loadMessages();
    }

    refreshChatSessions() {
        this.state.chatSessions = databaseService.getUserChatSessions(this.props.user.id);
    }

    updateSidebar() {
        const chatHistoryContainer = document.getElementById('chat-history');
        if (chatHistoryContainer) {
            chatHistoryContainer.innerHTML = this.renderChatHistory();
            
            // Re-attach event listeners for chat items
            const chatItems = document.querySelectorAll('.chat-session-item');
            chatItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('delete-chat-btn') && 
                        !e.target.classList.contains('rename-chat-btn') &&
                        !e.target.classList.contains('chat-title-input')) {
                        const chatId = item.getAttribute('data-chat-id');
                        this.switchToChat(chatId);
                    }
                });
            });

            const deleteButtons = document.querySelectorAll('.delete-chat-btn');
            deleteButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const chatId = btn.getAttribute('data-chat-id');
                    this.deleteChat(chatId);
                });
            });

            const renameButtons = document.querySelectorAll('.rename-chat-btn');
            renameButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const chatId = btn.getAttribute('data-chat-id');
                    this.renameChat(chatId);
                });
            });
        }
    }

    showConfirmModal(title, message, onConfirm, onCancel = null, confirmText = 'Confirm', confirmColor = 'red') {
        // Remove any existing modal
        const existingModal = document.getElementById('confirm-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Determine button styling based on action type
        const buttonClass = confirmColor === 'red' 
            ? 'text-white bg-red-500 hover:bg-red-600' 
            : 'text-white bg-blue-500 hover:bg-blue-600';

        // Create modal HTML
        const modal = document.createElement('div');
        modal.id = 'confirm-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl transform transition-all">
                <div class="flex items-center mb-4">
                    <div class="w-8 h-8 ${confirmColor === 'red' ? 'bg-red-100' : 'bg-blue-100'} rounded-full flex items-center justify-center mr-3">
                        <span class="${confirmColor === 'red' ? 'text-red-600' : 'text-blue-600'} text-lg">⚠️</span>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
                </div>
                <p class="text-gray-600 mb-6 leading-relaxed">${message}</p>
                <div class="flex justify-end space-x-3">
                    <button id="modal-cancel" class="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300">
                        Cancel
                    </button>
                    <button id="modal-confirm" class="px-4 py-2 ${buttonClass} rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-opacity-50 ${confirmColor === 'red' ? 'focus:ring-red-500' : 'focus:ring-blue-500'}">
                        ${confirmText}
                    </button>
                </div>
            </div>
        `;

        // Add to page
        document.body.appendChild(modal);

        // Add event listeners
        const confirmBtn = modal.querySelector('#modal-confirm');
        const cancelBtn = modal.querySelector('#modal-cancel');

        const closeModal = () => {
            modal.remove();
        };

        confirmBtn.addEventListener('click', () => {
            closeModal();
            if (onConfirm) onConfirm();
        });

        cancelBtn.addEventListener('click', () => {
            closeModal();
            if (onCancel) onCancel();
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
                if (onCancel) onCancel();
            }
        });

        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                if (onCancel) onCancel();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Focus the cancel button by default for better UX
        setTimeout(() => cancelBtn.focus(), 100);
    }

    showDeleteAccountModal() {
        // Create a custom modal for account deletion with password confirmation
        const modal = document.createElement('div');
        modal.id = 'delete-account-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl transform transition-all">
                <div class="flex items-center mb-4">
                    <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                        <span class="text-red-600 text-lg">⚠️</span>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900">Delete Account</h3>
                </div>
                
                <div class="mb-6">
                    <p class="text-gray-600 mb-4">This action cannot be undone. This will permanently delete your account and all your chat history.</p>
                    
                    <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <p class="text-sm text-red-800 font-medium">⚠️ Warning: All data will be permanently lost</p>
                        <ul class="text-sm text-red-700 mt-2 list-disc list-inside">
                            <li>All chat conversations and messages</li>
                            <li>Your account profile and settings</li>
                            <li>This action cannot be reversed</li>
                        </ul>
                    </div>
                    
                    <div>
                        <label for="delete-password" class="block text-sm font-medium text-gray-700 mb-2">
                            Enter your password to confirm:
                        </label>
                        <input type="password" id="delete-password" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                               placeholder="Your current password">
                        <div id="delete-error" class="text-red-600 text-sm mt-2 hidden"></div>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3">
                    <button id="delete-cancel" class="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300">
                        Cancel
                    </button>
                    <button id="delete-confirm" class="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        Delete Account
                    </button>
                </div>
            </div>
        `;

        // Add to page
        document.body.appendChild(modal);

        // Get elements
        const passwordInput = modal.querySelector('#delete-password');
        const errorDiv = modal.querySelector('#delete-error');
        const confirmBtn = modal.querySelector('#delete-confirm');
        const cancelBtn = modal.querySelector('#delete-cancel');

        // Close modal function
        const closeModal = () => {
            modal.remove();
        };

        // Handle delete confirmation
        const handleDelete = async () => {
            const password = passwordInput.value.trim();
            
            if (!password) {
                errorDiv.textContent = 'Please enter your password';
                errorDiv.classList.remove('hidden');
                passwordInput.focus();
                return;
            }

            // Disable button and show loading
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Deleting...';
            errorDiv.classList.add('hidden');

            try {
                // Attempt to delete the account
                const result = authService.deleteAccount(this.props.user.id, password);
                
                if (result.success) {
                    // Show success message briefly
                    confirmBtn.textContent = 'Deleted!';
                    confirmBtn.className = 'px-4 py-2 text-white bg-green-500 rounded-lg';
                    
                    // Close modal and redirect to login
                    setTimeout(() => {
                        closeModal();
                        utils.showToast('Account deleted successfully. You have been logged out.', 'success');
                        
                        // Redirect to login page
                        setTimeout(() => {
                            window.app.render();
                        }, 1000);
                    }, 1000);
                } else {
                    // Show error
                    errorDiv.textContent = result.message;
                    errorDiv.classList.remove('hidden');
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = 'Delete Account';
                    passwordInput.focus();
                }
            } catch (error) {
                console.error('Error deleting account:', error);
                errorDiv.textContent = 'An error occurred. Please try again.';
                errorDiv.classList.remove('hidden');
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Delete Account';
            }
        };

        // Event listeners
        confirmBtn.addEventListener('click', handleDelete);
        cancelBtn.addEventListener('click', closeModal);

        // Handle Enter key in password field
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleDelete();
            }
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Focus password input
        setTimeout(() => passwordInput.focus(), 100);
    }

    downloadChatAsPDF() {
        try {
            // Check if jsPDF is available - comprehensive check
            let jsPDFClass = null;
            
            // Try multiple ways to access jsPDF
            if (typeof window.jsPDF !== 'undefined') {
                jsPDFClass = window.jsPDF;
                console.log('✅ Using window.jsPDF');
            } else if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
                jsPDFClass = window.jspdf.jsPDF;
                console.log('✅ Using window.jspdf.jsPDF');
            } else if (typeof jsPDF !== 'undefined') {
                jsPDFClass = jsPDF;
                console.log('✅ Using global jsPDF');
            }

            if (!jsPDFClass) {
                console.error('❌ jsPDF not found. Available objects:', {
                    'window.jsPDF': typeof window.jsPDF,
                    'window.jspdf': typeof window.jspdf,
                    'window.jspdf.jsPDF': typeof window.jspdf?.jsPDF,
                    'jsPDF': typeof jsPDF
                });
                
                // Try to wait and retry once
                setTimeout(() => {
                    console.log('🔄 Retrying PDF generation...');
                    this.downloadChatAsPDF();
                }, 1000);
                
                utils.showToast('PDF library loading... Please try again in a moment.', 'warning');
                return;
            }

            // Test if we can create an instance
            try {
                const testDoc = new jsPDFClass();
                console.log('✅ jsPDF instance test successful');
            } catch (testError) {
                console.error('❌ jsPDF instance test failed:', testError);
                utils.showToast('PDF library error. Please refresh the page.', 'error');
                return;
            }

            // Get current chat
            const currentChat = this.state.chatSessions.find(chat => chat.id === this.state.currentChatId);
            if (!currentChat || currentChat.messages.length === 0) {
                utils.showToast('No messages to export', 'warning');
                return;
            }

            // Create new PDF document
            const doc = new jsPDFClass();
            
            // Set up document properties
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            const maxWidth = pageWidth - (margin * 2);
            let yPosition = margin;

            // Add title
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.text(currentChat.title, margin, yPosition);
            yPosition += 15;

            // Add metadata
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(128, 128, 128);
            const exportDate = new Date().toLocaleString();
            doc.text(`Exported on: ${exportDate}`, margin, yPosition);
            yPosition += 8;
            doc.text(`Total messages: ${currentChat.messages.length}`, margin, yPosition);
            yPosition += 15;

            // Reset text color
            doc.setTextColor(0, 0, 0);

            // Process messages
            currentChat.messages.forEach((message, index) => {
                // Check if we need a new page
                if (yPosition > pageHeight - 40) {
                    doc.addPage();
                    yPosition = margin;
                }

                // Add message header
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                const sender = message.type === 'user' ? this.props.user.name : 'AI Assistant';
                const timestamp = new Date(message.timestamp).toLocaleString();
                doc.text(`${sender} - ${timestamp}`, margin, yPosition);
                yPosition += 8;

                // Clean message content for PDF (remove HTML tags and markdown)
                let cleanContent = message.content
                    .replace(/<[^>]*>/g, '') // Remove HTML tags
                    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
                    .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
                    .replace(/`(.*?)`/g, '$1') // Remove code markdown
                    .replace(/#{1,6}\s*/g, '') // Remove headers
                    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
                    .trim();

                // Split content into lines that fit the page width
                doc.setFont(undefined, 'normal');
                doc.setFontSize(10);
                const lines = doc.splitTextToSize(cleanContent, maxWidth);
                
                // Add each line
                lines.forEach(line => {
                    if (yPosition > pageHeight - 20) {
                        doc.addPage();
                        yPosition = margin;
                    }
                    doc.text(line, margin, yPosition);
                    yPosition += 6;
                });

                yPosition += 10; // Space between messages
            });

            // Generate filename
            const sanitizedTitle = currentChat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const filename = `chat_${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.pdf`;

            // Save the PDF
            doc.save(filename);
            
            utils.showToast('Chat exported as PDF successfully!', 'success');
            console.log('✅ PDF generated successfully:', filename);

        } catch (error) {
            console.error('Error generating PDF:', error);
            utils.showToast('Failed to generate PDF. Please try again.', 'error');
        }
    }


}