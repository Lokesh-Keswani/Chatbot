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
            return JSON.parse(localStorage.getItem(this.storagePrefix + 'chats') || '{}');
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

    getUserChats(userId) {
        return this.chats[userId] || [];
    }

    addMessage(userId, message) {
        if (!this.chats[userId]) {
            this.chats[userId] = [];
        }
        
        const messageWithId = {
            id: uuid.v4(),
            ...message,
            timestamp: message.timestamp || Date.now()
        };
        
        this.chats[userId].push(messageWithId);
        this.saveChats();
        
        console.log('Message added for user:', userId);
        return messageWithId;
    }

    clearUserChats(userId) {
        this.chats[userId] = [];
        this.saveChats();
        console.log('Chats cleared for user:', userId);
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
        const userChats = this.getUserChats(userId);
        const totalMessages = userChats.length;
        const userMessages = userChats.filter(msg => msg.type === 'user').length;
        const aiMessages = userChats.filter(msg => msg.type === 'ai').length;
        
        return {
            totalMessages,
            userMessages,
            aiMessages,
            lastActivity: userChats.length > 0 ? userChats[userChats.length - 1].timestamp : null
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