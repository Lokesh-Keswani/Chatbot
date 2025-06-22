// Utility functions for the chatbot application
const utils = {
    // Copy text to clipboard
    copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Copied to clipboard!');
            }).catch(() => {
                this.fallbackCopyToClipboard(text);
            });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    },

    // Fallback copy method for older browsers
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showToast('Copied to clipboard!');
        } catch (error) {
            console.error('Fallback copy failed:', error);
            this.showToast('Failed to copy to clipboard');
        }
        
        document.body.removeChild(textArea);
    },

    // Show toast notification
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        const bgColor = type === 'error' ? 'bg-red-500' : 
                       type === 'warning' ? 'bg-yellow-500' : 'bg-green-500';
        
        toast.className = `fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 fade-in`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    },

    // Export chat to PDF
    exportToPDF(chats, username) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Header
            doc.setFontSize(20);
            doc.text('Chat History', 20, 20);
            doc.setFontSize(12);
            doc.text(`User: ${username}`, 20, 35);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
            doc.text(`Total Messages: ${chats.length}`, 20, 55);

            let yPosition = 70;
            let pageNumber = 1;

            chats.forEach((chat, index) => {
                // Add new page if needed
                if (yPosition > 250) {
                    doc.addPage();
                    pageNumber++;
                    yPosition = 20;
                    
                    // Add page header
                    doc.setFontSize(10);
                    doc.text(`Page ${pageNumber}`, 20, 15);
                }

                // Message header
                doc.setFont(undefined, 'bold');
                const sender = chat.type === 'user' ? 'You' : 'AI';
                const timestamp = new Date(chat.timestamp).toLocaleString();
                doc.text(`${sender} (${timestamp}):`, 20, yPosition);
                
                // Message content
                doc.setFont(undefined, 'normal');
                const splitText = doc.splitTextToSize(chat.content, 170);
                doc.text(splitText, 20, yPosition + 10);
                
                yPosition += splitText.length * 5 + 20;
            });

            // Save the PDF
            const filename = `chat-history-${username}-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);
            
            this.showToast('PDF exported successfully!');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            this.showToast('Failed to export PDF', 'error');
        }
    },

    // Export chat to TXT
    exportToTXT(chats, username) {
        try {
            let content = `Chat History\n`;
            content += `User: ${username}\n`;
            content += `Generated: ${new Date().toLocaleString()}\n`;
            content += `Total Messages: ${chats.length}\n`;
            content += `\n`.repeat(2);

            chats.forEach(chat => {
                const sender = chat.type === 'user' ? 'You' : 'AI';
                const timestamp = new Date(chat.timestamp).toLocaleString();
                content += `${sender} (${timestamp}):\n`;
                content += `${chat.content}\n\n`;
            });

            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat-history-${username}-${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('Text file exported successfully!');
        } catch (error) {
            console.error('Error exporting TXT:', error);
            this.showToast('Failed to export text file', 'error');
        }
    },

    // Export chat to JSON
    exportToJSON(chats, username) {
        try {
            const data = {
                user: username,
                exportedAt: new Date().toISOString(),
                totalMessages: chats.length,
                messages: chats
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat-history-${username}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('JSON file exported successfully!');
        } catch (error) {
            console.error('Error exporting JSON:', error);
            this.showToast('Failed to export JSON file', 'error');
        }
    },

    // Format timestamp
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Sanitize HTML
    sanitizeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Generate random ID
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    },

    // Check if device is mobile
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    // Auto-scroll to bottom of element
    scrollToBottom(element) {
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    },

    // Smooth scroll to element
    smoothScrollTo(element, duration = 300) {
        if (!element) return;
        
        const targetPosition = element.offsetTop;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }

        function ease(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }

        requestAnimationFrame(animation);
    },

    // Theme management functions
    getCurrentTheme() {
        return localStorage.getItem('chatbot_theme') || 'light';
    },

    setTheme(theme) {
        localStorage.setItem('chatbot_theme', theme);
        this.applyTheme(theme);
        this.showToast(`Switched to ${theme} mode`, 'success');
    },

    toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        return newTheme;
    },

    applyTheme(theme) {
        const body = document.body;
        const html = document.documentElement;
        
        if (theme === 'dark') {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            html.classList.add('dark');
        } else {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            html.classList.remove('dark');
        }
        
        // Trigger a custom event for components to listen to theme changes
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme } 
        }));
    },

    initTheme() {
        const savedTheme = this.getCurrentTheme();
        this.applyTheme(savedTheme);
        console.log(`🎨 Theme initialized: ${savedTheme}`);
    }
};

// Make utils globally available
window.utils = utils; 