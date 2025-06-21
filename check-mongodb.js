// Simple MongoDB Connection Checker
import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://keswani399:270778eshnali@cluster0.fvmbrtz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function checkMongoDB() {
    console.log('🔍 Checking MongoDB Connection...\n');
    console.log('📋 Connection Details:');
    console.log('Username: keswani399');
    console.log('Cluster: cluster0.fvmbrtz.mongodb.net');
    console.log('Database: chatbot (will be created if not exists)\n');
    
    let client;
    
    try {
        console.log('🔌 Attempting to connect...');
        client = new MongoClient(MONGODB_URI);
        
        // Test connection
        await client.connect();
        console.log('✅ Connection successful!');
        
        // Test database access
        const db = client.db('chatbot');
        console.log('✅ Database access successful!');
        
        // Test collections
        const collections = await db.listCollections().toArray();
        console.log('📋 Available collections:', collections.map(c => c.name));
        
        // Test basic operation
        const testCollection = db.collection('test');
        const result = await testCollection.insertOne({ test: 'connection', timestamp: new Date() });
        console.log('✅ Write operation successful!');
        
        // Clean up test data
        await testCollection.deleteOne({ _id: result.insertedId });
        console.log('✅ Delete operation successful!');
        
        console.log('\n🎉 All MongoDB tests passed! Your setup is working correctly.');
        
    } catch (error) {
        console.error('\n❌ MongoDB test failed!');
        console.error('Error:', error.message);
        
        if (error.message.includes('bad auth')) {
            console.log('\n🔧 Authentication Error - Possible issues:');
            console.log('1. Wrong username or password');
            console.log('2. User does not exist in MongoDB Atlas');
            console.log('3. User does not have proper permissions');
        } else if (error.message.includes('ENOTFOUND')) {
            console.log('\n🔧 Network Error - Possible issues:');
            console.log('1. Internet connection problem');
            console.log('2. MongoDB Atlas cluster is down');
            console.log('3. Wrong cluster URL');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('\n🔧 Connection Error - Possible issues:');
            console.log('1. Network access not configured');
            console.log('2. IP address not whitelisted');
        }
        
        console.log('\n📖 To fix:');
        console.log('1. Go to MongoDB Atlas dashboard');
        console.log('2. Check Database Access (username/password)');
        console.log('3. Check Network Access (IP whitelist)');
        console.log('4. Verify cluster is running');
    } finally {
        if (client) {
            await client.close();
            console.log('\n🔌 Connection closed.');
        }
    }
}

checkMongoDB().catch(console.error); 