// Database Service for managing chat data and user authentication
class DatabaseService {
    constructor() {
        this.storagePrefix = 'chatbot_';
        this.users = this.loadUsers();
        this.chats = this.loadChats();
    }

    // User Management
    loadUsers() {
        try {
            return JSON.parse(localStorage.getItem(this.storagePrefix + 'users') || '[]');
        } catch (error) {
            console.error('Error loading users:', error);
            return [];
        }
    }

    saveUsers() {
        try {
            localStorage.setItem(this.storagePrefix + 'users', JSON.stringify(this.users));
        } catch (error) {
            console.error('Error saving users:', error);
        }
    }

    findUser(email) {
        return this.users.find(user => user.email === email);
    }

    findUserById(id) {
        return this.users.find(user => user.id === id);
    }

    createUser(userData) {
        const user = {
            id: uuid.v4(),
            ...userData,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        
        this.users.push(user);
        this.chats[user.id] = [];
        this.saveUsers();
        this.saveChats();
        
        console.log('User created:', user.email);
        return user;
    }

    updateUserLastLogin(userId) {
        const user = this.findUserById(userId);
        if (user) {
            user.lastLogin = new Date().toISOString();
            this.saveUsers();
        }
    }

    // Chat Management
    loadChats() {
        try {
            const chats = JSON.parse(localStorage.getItem(this.storagePrefix + 'chats') || '{}');
            // Migrate old single chat format to new multi-chat format
            Object.keys(chats).forEach(userId => {
                if (Array.isArray(chats[userId])) {
                    // Old format: direct array of messages
                    const oldMessages = chats[userId];
                    if (oldMessages.length > 0) {
                        chats[userId] = {
                            'default': {
                                id: 'default',
                                title: 'Chat Session',
                                messages: oldMessages,
                                createdAt: oldMessages[0]?.timestamp || Date.now(),
                                updatedAt: oldMessages[oldMessages.length - 1]?.timestamp || Date.now()
                            }
                        };
                    } else {
                        chats[userId] = {};
                    }
                }
            });
            return chats;
        } catch (error) {
            console.error('Error loading chats:', error);
            return {};
        }
    }

    saveChats() {
        try {
            localStorage.setItem(this.storagePrefix + 'chats', JSON.stringify(this.chats));
        } catch (error) {
            console.error('Error saving chats:', error);
        }
    }

    getUserChats(userId, chatId = null) {
        if (!this.chats[userId]) {
            this.chats[userId] = {};
        }
        
        if (chatId) {
            return this.chats[userId][chatId]?.messages || [];
        }
        
        // Return the most recent chat's messages for backward compatibility
        const userChats = this.chats[userId];
        const chatIds = Object.keys(userChats);
        if (chatIds.length === 0) return [];
        
        // Sort by updatedAt and return the most recent
        const sortedChats = chatIds.sort((a, b) => 
            (userChats[b].updatedAt || 0) - (userChats[a].updatedAt || 0)
        );
        
        return userChats[sortedChats[0]]?.messages || [];
    }

    getUserChatSessions(userId) {
        if (!this.chats[userId]) {
            this.chats[userId] = {};
        }
        
        const userChats = this.chats[userId];
        return Object.values(userChats).sort((a, b) => 
            (b.updatedAt || 0) - (a.updatedAt || 0)
        );
    }

    createNewChat(userId, title = null) {
        if (!this.chats[userId]) {
            this.chats[userId] = {};
        }
        
        const chatId = uuid.v4();
        const now = Date.now();
        
        const newChat = {
            id: chatId,
            title: title || 'New Chat',
            messages: [],
            createdAt: now,
            updatedAt: now
        };
        
        this.chats[userId][chatId] = newChat;
        this.saveChats();
        
        console.log('New chat created:', chatId);
        return newChat;
    }

    addMessage(userId, message, chatId = null) {
        if (!this.chats[userId]) {
            this.chats[userId] = {};
        }
        
        // If no chatId provided, get the most recent chat or create a new one
        if (!chatId) {
            const sessions = this.getUserChatSessions(userId);
            if (sessions.length === 0) {
                const newChat = this.createNewChat(userId);
                chatId = newChat.id;
            } else {
                chatId = sessions[0].id;
            }
        }
        
        // Ensure the chat exists
        if (!this.chats[userId][chatId]) {
            this.chats[userId][chatId] = {
                id: chatId,
                title: 'Chat Session',
                messages: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
        }
        
        const messageWithId = {
            id: uuid.v4(),
            ...message,
            timestamp: message.timestamp || Date.now()
        };
        
        this.chats[userId][chatId].messages.push(messageWithId);
        this.chats[userId][chatId].updatedAt = Date.now();
        
        // Auto-generate title from first user message
        if (this.chats[userId][chatId].title === 'New Chat' || this.chats[userId][chatId].title === 'Chat Session') {
            if (message.type === 'user' && message.content.trim()) {
                const title = message.content.trim().substring(0, 30);
                this.chats[userId][chatId].title = title.length < message.content.trim().length ? title + '...' : title;
            }
        }
        
        this.saveChats();
        
        console.log('Message added to chat:', chatId);
        return messageWithId;
    }

    clearUserChats(userId, chatId = null) {
        if (chatId) {
            // Clear specific chat
            if (this.chats[userId] && this.chats[userId][chatId]) {
                this.chats[userId][chatId].messages = [];
                this.chats[userId][chatId].updatedAt = Date.now();
            }
        } else {
            // Clear all chats for user
            this.chats[userId] = {};
        }
        this.saveChats();
        console.log('Chats cleared for user:', userId);
    }

    deleteChat(userId, chatId) {
        if (this.chats[userId] && this.chats[userId][chatId]) {
            delete this.chats[userId][chatId];
            this.saveChats();
            console.log('Chat deleted:', chatId);
            return true;
        }
        return false;
    }

    renameChat(userId, chatId, newTitle) {
        if (this.chats[userId] && this.chats[userId][chatId]) {
            // Validate and sanitize the title
            const sanitizedTitle = newTitle.trim();
            if (sanitizedTitle.length === 0) {
                return false;
            }
            
            // Limit title length
            const maxLength = 50;
            const finalTitle = sanitizedTitle.length > maxLength ? 
                sanitizedTitle.substring(0, maxLength) + '...' : 
                sanitizedTitle;
            
            this.chats[userId][chatId].title = finalTitle;
            this.chats[userId][chatId].updatedAt = Date.now();
            this.saveChats();
            
            console.log('Chat renamed:', chatId, 'to:', finalTitle);
            return true;
        }
        return false;
    }

    deleteMessage(userId, messageId) {
        if (this.chats[userId]) {
            this.chats[userId] = this.chats[userId].filter(msg => msg.id !== messageId);
            this.saveChats();
            console.log('Message deleted:', messageId);
        }
    }

    // Session Management
    saveCurrentUser(user) {
        try {
            localStorage.setItem(this.storagePrefix + 'current_user', JSON.stringify(user));
        } catch (error) {
            console.error('Error saving current user:', error);
        }
    }

    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem(this.storagePrefix + 'current_user') || 'null');
        } catch (error) {
            console.error('Error loading current user:', error);
            return null;
        }
    }

    clearCurrentUser() {
        try {
            localStorage.removeItem(this.storagePrefix + 'current_user');
        } catch (error) {
            console.error('Error clearing current user:', error);
        }
    }

    // Statistics
    getUserStats(userId) {
        const chatSessions = this.getUserChatSessions(userId);
        let totalMessages = 0;
        let userMessages = 0;
        let aiMessages = 0;
        let lastActivity = null;
        
        chatSessions.forEach(session => {
            totalMessages += session.messages.length;
            userMessages += session.messages.filter(msg => msg.type === 'user').length;
            aiMessages += session.messages.filter(msg => msg.type === 'ai').length;
            
            if (session.messages.length > 0) {
                const sessionLastActivity = session.messages[session.messages.length - 1].timestamp;
                if (!lastActivity || sessionLastActivity > lastActivity) {
                    lastActivity = sessionLastActivity;
                }
            }
        });
        
        return {
            totalMessages,
            userMessages,
            aiMessages,
            totalSessions: chatSessions.length,
            lastActivity
        };
    }

    // Export/Import functionality
    exportUserData(userId) {
        const user = this.findUserById(userId);
        const chats = this.getUserChats(userId);
        const stats = this.getUserStats(userId);
        
        return {
            user,
            chats,
            stats,
            exportedAt: new Date().toISOString()
        };
    }

    // Cleanup old data (optional)
    cleanupOldData(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        
        let cleanedCount = 0;
        
        Object.keys(this.chats).forEach(userId => {
            const originalLength = this.chats[userId].length;
            this.chats[userId] = this.chats[userId].filter(msg => {
                return new Date(msg.timestamp) > cutoffDate;
            });
            cleanedCount += originalLength - this.chats[userId].length;
        });
        
        if (cleanedCount > 0) {
            this.saveChats();
            console.log(`Cleaned up ${cleanedCount} old messages`);
        }
        
        return cleanedCount;
    }
}

// Create global instance
const databaseService = new DatabaseService();

// Make databaseService globally available
window.databaseService = databaseService; 