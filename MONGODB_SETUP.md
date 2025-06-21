# MongoDB Setup Guide for AI Chatbot

This guide will help you set up MongoDB for your AI Chatbot application.

## 🗄️ **MongoDB Options**

### **Option 1: MongoDB Atlas (Cloud - Recommended) ⭐**

**Pros:**
- Free tier available (512MB storage)
- No installation required
- Automatic backups
- Scalable
- Managed service

**Cons:**
- Requires internet connection
- Limited free tier

---

### **Option 2: Local MongoDB Installation**

**Pros:**
- No internet required
- Full control
- No storage limits

**Cons:**
- Requires installation
- Manual maintenance
- No automatic backups

---

## 🚀 **Option 1: MongoDB Atlas Setup (Recommended)**

### **Step 1: Create MongoDB Atlas Account**

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click **"Try Free"**
3. Fill in your details and create an account
4. Verify your email address

### **Step 2: Create a Cluster**

1. Click **"Build a Database"**
2. Choose **"FREE"** tier (M0)
3. Select your preferred cloud provider:
   - **AWS** (Amazon Web Services)
   - **Google Cloud**
   - **Azure**
4. Choose a region close to your location
5. Click **"Create"**

### **Step 3: Set Up Database Access**

1. In the left sidebar, click **"Database Access"**
2. Click **"Add New Database User"**
3. Create a username (e.g., `chatbot_user`)
4. Create a strong password (save this!)
5. Select **"Read and write to any database"**
6. Click **"Add User"**

### **Step 4: Set Up Network Access**

1. In the left sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. For development, click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

### **Step 5: Get Your Connection String**

1. Go back to **"Database"** in the left sidebar
2. Click **"Connect"**
3. Choose **"Connect your application"**
4. Copy the connection string

**Example connection string:**
```
mongodb+srv://chatbot_user:yourpassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### **Step 6: Configure Your Application**

1. Open `config.js`
2. Replace the MongoDB URI with your connection string:

```javascript
const CONFIG = {
    // ... other settings
    
    // MongoDB Configuration
    MONGODB_URI: 'mongodb+srv://chatbot_user:yourpassword@cluster0.xxxxx.mongodb.net/chatbot?retryWrites=true&w=majority',
    
    // ... rest of settings
};
```

**Important:** Replace `yourpassword` with your actual password and `cluster0.xxxxx.mongodb.net` with your actual cluster URL.

---

## 💻 **Option 2: Local MongoDB Installation**

### **Windows Installation**

1. **Download MongoDB Community Server:**
   - Go to [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Select "Windows" and download the MSI installer

2. **Install MongoDB:**
   - Run the downloaded MSI file
   - Follow the installation wizard
   - Choose "Complete" installation
   - Install MongoDB Compass (optional but recommended)

3. **Start MongoDB Service:**
   - Open Command Prompt as Administrator
   - Run: `net start MongoDB`

4. **Configure Your Application:**
   ```javascript
   const CONFIG = {
       // ... other settings
       
       // MongoDB Configuration
       MONGODB_URI: 'mongodb://localhost:27017/chatbot',
       
       // ... rest of settings
   };
   ```

### **macOS Installation**

1. **Using Homebrew (Recommended):**
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   ```

2. **Start MongoDB Service:**
   ```bash
   brew services start mongodb/brew/mongodb-community
   ```

3. **Configure Your Application:**
   ```javascript
   const CONFIG = {
       // ... other settings
       
       // MongoDB Configuration
       MONGODB_URI: 'mongodb://localhost:27017/chatbot',
       
       // ... rest of settings
   };
   ```

### **Linux Installation (Ubuntu/Debian)**

1. **Install MongoDB:**
   ```bash
   sudo apt update
   sudo apt install mongodb
   ```

2. **Start MongoDB Service:**
   ```bash
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

3. **Configure Your Application:**
   ```javascript
   const CONFIG = {
       // ... other settings
       
       // MongoDB Configuration
       MONGODB_URI: 'mongodb://localhost:27017/chatbot',
       
       // ... rest of settings
   };
   ```

---

## 🔧 **Install MongoDB Driver**

After setting up MongoDB, install the Node.js driver:

```bash
npm install mongodb
```

---

## 🧪 **Test Your MongoDB Connection**

1. **Start your application:**
   ```bash
   node server.js
   ```

2. **Check the console output:**
   - You should see: `✅ Connected to MongoDB successfully!`
   - If there's an error, check your connection string

3. **Test with demo account:**
   - Use: `demo@example.com` / `demo123`
   - Your data should now be stored in MongoDB

---

## 🔒 **Security Best Practices**

### **For MongoDB Atlas:**
1. **Use Strong Passwords:** Create complex passwords for database users
2. **Network Access:** Only allow access from your application's IP addresses
3. **Database Users:** Create separate users for different environments
4. **Encryption:** Enable encryption at rest (enabled by default in Atlas)

### **For Local MongoDB:**
1. **Authentication:** Enable authentication for production use
2. **Firewall:** Configure firewall rules
3. **Regular Updates:** Keep MongoDB updated
4. **Backups:** Set up regular backups

---

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"MongoDB connection failed"**
   - Check your connection string
   - Verify username and password
   - Ensure network access is configured (for Atlas)

2. **"Authentication failed"**
   - Double-check username and password
   - Ensure user has proper permissions

3. **"Network timeout"**
   - Check your internet connection (for Atlas)
   - Verify firewall settings
   - Check if MongoDB service is running (for local)

4. **"Port 27017 already in use"**
   - Stop other MongoDB instances
   - Check if MongoDB is already running

### **Debug Mode:**

Enable detailed logging by adding this to your `config.js`:

```javascript
const CONFIG = {
    // ... other settings
    
    MONGODB_OPTIONS: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        // Add this for debugging:
        loggerLevel: 'debug'
    },
    
    // ... rest of settings
};
```

---

## 📊 **MongoDB Compass (Optional)**

MongoDB Compass is a GUI for MongoDB that makes it easy to:
- Browse your data
- Run queries
- Monitor performance
- Manage indexes

**Download:** [MongoDB Compass](https://www.mongodb.com/try/download/compass)

---

## 🎯 **Next Steps**

1. **Configure your MongoDB URI** in `config.js`
2. **Install dependencies:** `npm install`
3. **Start the application:** `node server.js`
4. **Test with demo account:** `demo@example.com` / `demo123`
5. **Check MongoDB Compass** to see your data

---

**Need Help?** Check the console output for detailed error messages or refer to the [MongoDB documentation](https://docs.mongodb.com/). 