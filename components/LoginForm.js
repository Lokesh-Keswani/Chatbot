// Login Form Component - Simplified Direct DOM Approach
class LoginForm {
    constructor(props) {
        this.props = props;
        this.state = {
            email: '',
            password: '',
            name: '',
            isRegistering: false,
            error: null,
            isLoading: false
        };
        
        console.log('🎯 LoginForm initialized');
    }

    mount(container) {
        this.container = container;
        this.render();
        this.setupEventListeners();
        console.log('✅ LoginForm mounted successfully');
    }

    render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
                <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                    <div class="text-center mb-8">
                        <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span class="text-2xl text-white">🤖</span>
                        </div>
                        <h1 class="text-3xl font-bold text-gray-800 mb-2">AI Chatbot</h1>
                        <p class="text-gray-600">
                            ${this.state.isRegistering ? 'Create your account' : 'Welcome back! Please sign in'}
                        </p>
                    </div>

                    ${this.state.error ? `
                        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p class="text-red-600 text-sm">${this.state.error}</p>
                        </div>
                    ` : ''}

                    <form id="login-form" class="space-y-6">
                        ${this.state.isRegistering ? `
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                <input type="text" 
                                       id="name-input"
                                       placeholder="Enter your full name"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors">
                            </div>
                        ` : ''}

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <input type="email" 
                                   id="email-input"
                                   placeholder="Enter your email"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <input type="password" 
                                   id="password-input"
                                   placeholder="Enter your password"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors">
                        </div>

                        <button type="submit" 
                                id="submit-btn"
                                ${this.state.isLoading ? 'disabled' : ''}
                                class="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 rounded-lg transition-colors">
                            ${this.state.isLoading ? 'Processing...' : (this.state.isRegistering ? 'Create Account' : 'Sign In')}
                        </button>
                    </form>

                    <div class="mt-6 text-center">
                        <button id="toggle-mode-btn" class="text-blue-500 hover:text-blue-600 text-sm font-medium">
                            ${this.state.isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
                        </button>
                    </div>

                    <div class="mt-8 pt-6 border-t border-gray-200">
                        <div class="bg-blue-50 rounded-lg p-4">
                            <h3 class="font-medium text-blue-800 mb-2">Demo Account</h3>
                            <p class="text-sm text-blue-600 mb-2">Try the app with demo credentials:</p>
                            <div class="text-sm text-blue-700">
                                <p><strong>Email:</strong> demo@example.com</p>
                                <p><strong>Password:</strong> demo123</p>
                            </div>
                            <button id="demo-login-btn" class="mt-3 w-full bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-lg text-sm font-medium transition-colors">
                                Use Demo Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        console.log('✅ LoginForm rendered');
    }

    setupEventListeners() {
        try {
            // Form submission
            const form = document.getElementById('login-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleSubmit();
                });
            }

            // Input handling
            const emailInput = document.getElementById('email-input');
            if (emailInput) {
                emailInput.addEventListener('input', (e) => {
                    this.state.email = e.target.value;
                });
            }

            const passwordInput = document.getElementById('password-input');
            if (passwordInput) {
                passwordInput.addEventListener('input', (e) => {
                    this.state.password = e.target.value;
                });
            }

            const nameInput = document.getElementById('name-input');
            if (nameInput) {
                nameInput.addEventListener('input', (e) => {
                    this.state.name = e.target.value;
                });
            }

            // Toggle mode button
            const toggleBtn = document.getElementById('toggle-mode-btn');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    this.toggleMode();
                });
            }

            // Demo login button
            const demoBtn = document.getElementById('demo-login-btn');
            if (demoBtn) {
                demoBtn.addEventListener('click', () => {
                    this.loginWithDemo();
                });
            }

            console.log('✅ LoginForm event listeners attached');
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    async handleSubmit() {
        try {
            this.state.isLoading = true;
            this.state.error = null;
            this.updateSubmitButton();

            if (this.state.isRegistering) {
                await this.handleRegister();
            } else {
                await this.handleLogin();
            }
        } catch (error) {
            console.error('Form submission error:', error);
            this.state.error = error.message || 'An error occurred. Please try again.';
            this.updateError();
        } finally {
            this.state.isLoading = false;
            this.updateSubmitButton();
        }
    }

    async handleLogin() {
        if (!this.state.email || !this.state.password) {
            throw new Error('Please fill in all fields');
        }

        const result = authService.login(this.state.email, this.state.password);
        if (result.success) {
            console.log('✅ Login successful');
            utils.showToast(`Welcome, ${result.user.name}!`, 'success');
            this.props.onLogin(result.user);
        } else {
            throw new Error(result.message || 'Invalid email or password');
        }
    }

    async handleRegister() {
        if (!this.state.name || !this.state.email || !this.state.password) {
            throw new Error('Please fill in all fields');
        }

        if (this.state.password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        const result = authService.signup({
            name: this.state.name,
            email: this.state.email,
            password: this.state.password
        });

        if (result.success) {
            console.log('✅ Registration successful');
            utils.showToast(`Welcome, ${result.user.name}! Your account has been created.`, 'success');
            this.props.onLogin(result.user);
        } else {
            throw new Error(result.message || 'Registration failed. Email might already be in use.');
        }
    }

    loginWithDemo() {
        try {
            this.state.email = 'demo@example.com';
            this.state.password = 'demo123';
            
            // Update input values
            const emailInput = document.getElementById('email-input');
            const passwordInput = document.getElementById('password-input');
            
            if (emailInput) emailInput.value = this.state.email;
            if (passwordInput) passwordInput.value = this.state.password;
            
            this.handleLogin();
        } catch (error) {
            console.error('Demo login error:', error);
            this.state.error = 'Demo login failed';
            this.updateError();
        }
    }

    toggleMode() {
        this.state.isRegistering = !this.state.isRegistering;
        this.state.error = null;
        this.state.name = '';
        this.state.email = '';
        this.state.password = '';
        this.render();
        this.setupEventListeners();
    }

    updateSubmitButton() {
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.disabled = this.state.isLoading;
            submitBtn.textContent = this.state.isLoading ? 'Processing...' : (this.state.isRegistering ? 'Create Account' : 'Sign In');
            
            if (this.state.isLoading) {
                submitBtn.classList.add('bg-blue-300');
                submitBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
            } else {
                submitBtn.classList.remove('bg-blue-300');
                submitBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
            }
        }
    }

    updateError() {
        // Re-render to show error
        this.render();
        this.setupEventListeners();
    }
}

// Make LoginForm globally available
window.LoginForm = LoginForm; 