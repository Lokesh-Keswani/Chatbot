// MongoDB Service for cloud database operations
class MongoService {
    constructor() {
        this.client = null;
        this.db = null;
        this.isConnected = false;
        this.connectionPromise = null;
    }

    // Initialize MongoDB connection
    async connect() {
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = this._connect();
        return this.connectionPromise;
    }

    async _connect() {
        try {
            // Check if MongoDB URI is configured
            if (!CONFIG.MONGODB_URI || CONFIG.MONGODB_URI.includes('username:password')) {
                console.warn('MongoDB URI not configured. Using local storage only.');
                return false;
            }

            // Import MongoDB driver dynamically
            const { MongoClient } = await import('mongodb');
            
            // Create client
            this.client = new MongoClient(CONFIG.MONGODB_URI, CONFIG.MONGODB_OPTIONS);
            
            // Connect to MongoDB
            await this.client.connect();
            
            // Get database
            this.db = this.client.db('chatbot');
            
            this.isConnected = true;
            console.log('✅ Connected to MongoDB successfully!');
            
            // Create indexes for better performance
            await this.createIndexes();
            
            return true;
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error.message);
            this.isConnected = false;
            return false;
        }
    }

    // Create database indexes
    async createIndexes() {
        try {
            const usersCollection = this.db.collection('users');
            const chatsCollection = this.db.collection('chats');

            // Create indexes
            await usersCollection.createIndex({ email: 1 }, { unique: true });
            await usersCollection.createIndex({ id: 1 });
            await chatsCollection.createIndex({ userId: 1 });
            await chatsCollection.createIndex({ timestamp: -1 });
            await chatsCollection.createIndex({ userId: 1, timestamp: -1 });

            console.log('✅ Database indexes created successfully!');
        } catch (error) {
            console.error('❌ Error creating indexes:', error.message);
        }
    }

    // User operations
    async createUser(userData) {
        if (!this.isConnected) return null;

        try {
            const usersCollection = this.db.collection('users');
            const result = await usersCollection.insertOne({
                ...userData,
                createdAt: new Date(),
                lastLogin: new Date()
            });
            
            console.log('✅ User created in MongoDB:', userData.email);
            return result.insertedId;
        } catch (error) {
            console.error('❌ Error creating user in MongoDB:', error.message);
            return null;
        }
    }

    async findUserByEmail(email) {
        if (!this.isConnected) return null;

        try {
            const usersCollection = this.db.collection('users');
            return await usersCollection.findOne({ email });
        } catch (error) {
            console.error('❌ Error finding user in MongoDB:', error.message);
            return null;
        }
    }

    async findUserById(id) {
        if (!this.isConnected) return null;

        try {
            const usersCollection = this.db.collection('users');
            return await usersCollection.findOne({ id });
        } catch (error) {
            console.error('❌ Error finding user by ID in MongoDB:', error.message);
            return null;
        }
    }

    async updateUserLastLogin(userId) {
        if (!this.isConnected) return false;

        try {
            const usersCollection = this.db.collection('users');
            await usersCollection.updateOne(
                { id: userId },
                { $set: { lastLogin: new Date() } }
            );
            return true;
        } catch (error) {
            console.error('❌ Error updating user last login in MongoDB:', error.message);
            return false;
        }
    }

    // Chat operations
    async addMessage(userId, message) {
        if (!this.isConnected) return null;

        try {
            const chatsCollection = this.db.collection('chats');
            const messageWithId = {
                ...message,
                userId,
                timestamp: new Date()
            };
            
            const result = await chatsCollection.insertOne(messageWithId);
            console.log('✅ Message added to MongoDB for user:', userId);
            return result.insertedId;
        } catch (error) {
            console.error('❌ Error adding message to MongoDB:', error.message);
            return null;
        }
    }

    async getUserChats(userId, limit = 100) {
        if (!this.isConnected) return [];

        try {
            const chatsCollection = this.db.collection('chats');
            return await chatsCollection
                .find({ userId })
                .sort({ timestamp: -1 })
                .limit(limit)
                .toArray();
        } catch (error) {
            console.error('❌ Error getting user chats from MongoDB:', error.message);
            return [];
        }
    }

    async clearUserChats(userId) {
        if (!this.isConnected) return false;

        try {
            const chatsCollection = this.db.collection('chats');
            await chatsCollection.deleteMany({ userId });
            console.log('✅ User chats cleared in MongoDB:', userId);
            return true;
        } catch (error) {
            console.error('❌ Error clearing user chats in MongoDB:', error.message);
            return false;
        }
    }

    async getUserStats(userId) {
        if (!this.isConnected) return null;

        try {
            const chatsCollection = this.db.collection('chats');
            
            const pipeline = [
                { $match: { userId } },
                {
                    $group: {
                        _id: null,
                        totalMessages: { $sum: 1 },
                        userMessages: { $sum: { $cond: [{ $eq: ['$type', 'user'] }, 1, 0] } },
                        aiMessages: { $sum: { $cond: [{ $eq: ['$type', 'ai'] }, 1, 0] } },
                        lastActivity: { $max: '$timestamp' }
                    }
                }
            ];

            const result = await chatsCollection.aggregate(pipeline).toArray();
            return result[0] || { totalMessages: 0, userMessages: 0, aiMessages: 0, lastActivity: null };
        } catch (error) {
            console.error('❌ Error getting user stats from MongoDB:', error.message);
            return null;
        }
    }

    // Migration from local storage to MongoDB
    async migrateFromLocalStorage(localUsers, localChats) {
        if (!this.isConnected) return false;

        try {
            console.log('🔄 Starting migration from local storage to MongoDB...');
            
            // Migrate users
            for (const user of localUsers) {
                await this.createUser(user);
            }
            
            // Migrate chats
            for (const [userId, chats] of Object.entries(localChats)) {
                for (const chat of chats) {
                    await this.addMessage(userId, chat);
                }
            }
            
            console.log('✅ Migration completed successfully!');
            return true;
        } catch (error) {
            console.error('❌ Migration failed:', error.message);
            return false;
        }
    }

    // Close connection
    async disconnect() {
        if (this.client) {
            try {
                await this.client.close();
                this.isConnected = false;
                console.log('✅ MongoDB connection closed');
            } catch (error) {
                console.error('❌ Error closing MongoDB connection:', error.message);
            }
        }
    }

    // Health check
    async healthCheck() {
        if (!this.isConnected) return false;

        try {
            await this.db.admin().ping();
            return true;
        } catch (error) {
            console.error('❌ MongoDB health check failed:', error.message);
            return false;
        }
    }
}

// Create global instance
const mongoService = new MongoService();

// Make mongoService globally available
window.mongoService = mongoService; 