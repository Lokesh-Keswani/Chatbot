// MongoDB Connection Test Script
import { MongoClient } from 'mongodb';

// Test configuration - using the same URI as config.js
const testConfig = {
    // Use the same MongoDB URI as in config.js
    MONGODB_URI: 'mongodb+srv://keswani399:<270778eshnali>@cluster0.fvmbrtz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    MONGODB_OPTIONS: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    }
};

async function testMongoDBConnection() {
    console.log('🧪 Testing MongoDB Connection...\n');
    
    let client;
    
    try {
        // Check if URI is configured
        if (testConfig.MONGODB_URI.includes('username:password')) {
            console.log('❌ Please configure your MongoDB URI in test-mongodb.js');
            console.log('📖 See MONGODB_SETUP.md for setup instructions');
            return;
        }

        // Create client
        client = new MongoClient(testConfig.MONGODB_URI, testConfig.MONGODB_OPTIONS);
        
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await client.connect();
        console.log('✅ Connected to MongoDB successfully!');
        
        // Get database
        const db = client.db('chatbot');
        console.log('📊 Database: chatbot');
        
        // Test collections
        const usersCollection = db.collection('users');
        const chatsCollection = db.collection('chats');
        
        console.log('📋 Collections: users, chats');
        
        // Test basic operations
        console.log('\n🧪 Testing basic operations...');
        
        // Test user creation
        const testUser = {
            id: 'test-user-' + Date.now(),
            name: 'Test User',
            email: 'test@example.com',
            password: 'test123',
            createdAt: new Date(),
            lastLogin: new Date()
        };
        
        const userResult = await usersCollection.insertOne(testUser);
        console.log('✅ User created:', userResult.insertedId);
        
        // Test message creation
        const testMessage = {
            id: 'test-message-' + Date.now(),
            userId: testUser.id,
            type: 'user',
            content: 'Hello, this is a test message!',
            timestamp: new Date()
        };
        
        const messageResult = await chatsCollection.insertOne(testMessage);
        console.log('✅ Message created:', messageResult.insertedId);
        
        // Test queries
        const foundUser = await usersCollection.findOne({ email: 'test@example.com' });
        console.log('✅ User query successful:', foundUser ? 'User found' : 'User not found');
        
        const userMessages = await chatsCollection.find({ userId: testUser.id }).toArray();
        console.log('✅ Messages query successful:', userMessages.length, 'messages found');
        
        // Test aggregation
        const stats = await chatsCollection.aggregate([
            { $match: { userId: testUser.id } },
            {
                $group: {
                    _id: null,
                    totalMessages: { $sum: 1 },
                    userMessages: { $sum: { $cond: [{ $eq: ['$type', 'user'] }, 1, 0] } },
                    aiMessages: { $sum: { $cond: [{ $eq: ['$type', 'ai'] }, 1, 0] } }
                }
            }
        ]).toArray();
        
        console.log('✅ Aggregation successful:', stats[0] || 'No stats');
        
        // Clean up test data
        await usersCollection.deleteOne({ id: testUser.id });
        await chatsCollection.deleteMany({ userId: testUser.id });
        console.log('🧹 Test data cleaned up');
        
        console.log('\n🎉 All MongoDB tests passed successfully!');
        console.log('✅ Your MongoDB connection is working perfectly!');
        
    } catch (error) {
        console.error('\n❌ MongoDB test failed:', error.message);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('1. Check your MongoDB URI in config.js');
        console.log('2. Ensure MongoDB Atlas is running (if using cloud)');
        console.log('3. Check network access settings');
        console.log('4. Verify username and password');
        console.log('5. See MONGODB_SETUP.md for detailed instructions');
    } finally {
        if (client) {
            await client.close();
            console.log('\n🔌 MongoDB connection closed');
        }
    }
}

// Run the test
testMongoDBConnection().catch(console.error); 