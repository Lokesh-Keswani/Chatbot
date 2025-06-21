// Main Application Component
class App {
    constructor() {
        this.state = {
            isAuthenticated: authService.isAuthenticated(),
            currentUser: authService.getCurrentUser()
        };
        
        // Make globally available
        window.app = this;
        
        console.log('🎯 App initialized with auth state:', this.state.isAuthenticated);
    }

    render() {
        const appContainer = document.getElementById('app');
        if (!appContainer) {
            console.error('App container not found');
            return;
        }

        // Update state
        this.state.isAuthenticated = authService.isAuthenticated();
        this.state.currentUser = authService.getCurrentUser();

        if (this.state.isAuthenticated && this.state.currentUser) {
            console.log('✅ User authenticated, rendering chat app');
            
            // Create chat app container
            appContainer.innerHTML = '<div id="chat-app-container"></div>';
            
            // Initialize and mount chat app
            const chatContainer = document.getElementById('chat-app-container');
            if (chatContainer) {
                this.chatApp = new ChatApp({ user: this.state.currentUser });
                this.chatApp.mount(chatContainer);
            }
        } else {
            console.log('❌ User not authenticated, rendering login form');
            
            // Create login form container
            appContainer.innerHTML = '<div id="login-form-container"></div>';
            
            // Initialize and mount login form
            const loginContainer = document.getElementById('login-form-container');
            if (loginContainer) {
                this.loginForm = new LoginForm({
                    onLogin: (user) => {
                        console.log('🔐 User logged in:', user.name);
                        this.state.isAuthenticated = true;
                        this.state.currentUser = user;
                        this.render();
                    }
                });
                this.loginForm.mount(loginContainer);
            }
        }
    }
}

// Make App globally available
window.App = App; 