// Authentication Service for user management
class AuthService {
    constructor() {
        this.currentUser = databaseService.getCurrentUser();
    }

    // Input validation
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        // At least 6 characters, can include letters, numbers, and special characters
        return password && password.length >= 6;
    }

    validateName(name) {
        return name && name.trim().length >= 2;
    }

    // Login functionality
    login(email, password) {
        // Validate inputs
        if (!this.validateEmail(email)) {
            return { success: false, message: 'Please enter a valid email address' };
        }

        if (!this.validatePassword(password)) {
            return { success: false, message: 'Password must be at least 6 characters long' };
        }

        // Find user
        const user = databaseService.findUser(email);
        if (!user) {
            return { success: false, message: 'User not found. Please check your email or sign up' };
        }

        // Check password
        if (user.password !== password) {
            return { success: false, message: 'Incorrect password' };
        }

        // Update last login and set current user
        databaseService.updateUserLastLogin(user.id);
        this.currentUser = user;
        databaseService.saveCurrentUser(user);

        console.log('User logged in:', user.email);
        return { success: true, user };
    }

    // Signup functionality
    signup(userData) {
        const { name, email, password } = userData;

        // Validate inputs
        if (!this.validateName(name)) {
            return { success: false, message: 'Name must be at least 2 characters long' };
        }

        if (!this.validateEmail(email)) {
            return { success: false, message: 'Please enter a valid email address' };
        }

        if (!this.validatePassword(password)) {
            return { success: false, message: 'Password must be at least 6 characters long' };
        }

        // Check if user already exists
        if (databaseService.findUser(email)) {
            return { success: false, message: 'An account with this email already exists' };
        }

        // Create new user
        const user = databaseService.createUser({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: password
        });

        // Set as current user
        this.currentUser = user;
        databaseService.saveCurrentUser(user);

        console.log('User signed up:', user.email);
        return { success: true, user };
    }

    // Logout functionality
    logout() {
        if (this.currentUser) {
            console.log('User logged out:', this.currentUser.email);
        }
        
        this.currentUser = null;
        databaseService.clearCurrentUser();
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Change password
    changePassword(userId, currentPassword, newPassword) {
        const user = databaseService.findUserById(userId);
        
        if (!user) {
            return { success: false, message: 'User not found' };
        }

        if (user.password !== currentPassword) {
            return { success: false, message: 'Current password is incorrect' };
        }

        if (!this.validatePassword(newPassword)) {
            return { success: false, message: 'New password must be at least 6 characters long' };
        }

        // Update password
        user.password = newPassword;
        databaseService.saveUsers();

        console.log('Password changed for user:', user.email);
        return { success: true, message: 'Password changed successfully' };
    }

    // Delete account
    deleteAccount(userId, password) {
        const user = databaseService.findUserById(userId);
        
        if (!user) {
            return { success: false, message: 'User not found' };
        }

        if (user.password !== password) {
            return { success: false, message: 'Password is incorrect' };
        }

        console.log('Deleting account for user:', user.email);

        // Remove all user data
        // 1. Remove user from users array
        databaseService.users = databaseService.users.filter(u => u.id !== userId);
        
        // 2. Remove all chat sessions for this user
        if (databaseService.chats[userId]) {
            delete databaseService.chats[userId];
        }
        
        // 3. Clear any cached current user data if it's this user
        const currentUser = databaseService.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            databaseService.clearCurrentUser();
        }
        
        // 4. Save all changes
        databaseService.saveUsers();
        databaseService.saveChats();

        // 5. Logout if it's the current user
        if (this.currentUser && this.currentUser.id === userId) {
            this.logout();
        }

        console.log('Account and all associated data deleted for user:', user.email);
        return { success: true, message: 'Account and all chat history deleted successfully' };
    }

    // Reset session (for page refresh)
    resetSession() {
        this.currentUser = databaseService.getCurrentUser();
    }
}

// Create global instance
const authService = new AuthService();

// Make authService globally available
window.authService = authService; 