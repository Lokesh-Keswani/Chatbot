// AI Service for Gemini API interactions with Document Generation Support
class AIService {
    constructor() {
        console.log('🔧 AI Service constructor called');
        console.log('🔍 CONFIG object check in constructor:');
        console.log('  - CONFIG exists:', typeof CONFIG !== 'undefined');
        console.log('  - CONFIG.GEMINI_API_KEY exists:', !!CONFIG?.GEMINI_API_KEY);
        
        this.apiKey = CONFIG?.GEMINI_API_KEY;
        this.apiUrl = CONFIG?.GEMINI_API_URL;
        
        console.log('🔧 AI Service initialized');
        console.log('🔑 API Key present:', !!this.apiKey);
        console.log('🔑 API Key starts with AIza:', this.apiKey?.startsWith('AIza'));
        console.log('🔑 API Key length:', this.apiKey?.length);
    }

    async generateResponse(message, options = {}) {
        // Always refresh API key before making a request
        if (!this.refreshApiKey()) {
            console.error('❌ API key validation failed');
            return "Please configure your Gemini API key in config.js to enable AI responses.";
        }

        // Extract options
        const { fileContent, userId, isSmartRequest } = options;
        
        // Check if this is a file-only request (auto-summary case)
        if ((!message || !message.trim()) && fileContent && typeof documentService !== 'undefined') {
            console.log('📄 File-only request detected, generating auto-summary');
            const smartResponse = await this.handleSmartDocumentRequest('', fileContent, userId);
            if (smartResponse) {
                return smartResponse;
            }
        }
        
        // If no message and no file content, return error
        if (!message || !message.trim()) {
            return "Please provide a message to get a response.";
        }

        try {
            // If we have document service available and this might be a smart request
            if (typeof documentService !== 'undefined' && (fileContent || isSmartRequest)) {
                const smartResponse = await this.handleSmartDocumentRequest(message, fileContent, userId);
                if (smartResponse) {
                    return smartResponse;
                }
            }

            console.log('🤖 Sending request to Gemini API...');
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{ 
                        parts: [{ 
                            text: message.trim() 
                        }] 
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                })
            });

            console.log('📡 API Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                console.error('❌ Gemini API error:', data.error);
                return `Error: ${data.error.message || 'Unknown API error'}`;
            }

            const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!aiResponse) {
                console.warn('⚠️ No AI response in data');
                console.log('🔍 Full API response data:', JSON.stringify(data, null, 2));
                return "Sorry, I couldn't generate a response at the moment. Please try again.";
            }

            console.log('✅ AI response generated successfully');
            console.log('📝 Response length:', aiResponse.length, 'characters');
            console.log('📝 Response preview:', aiResponse.substring(0, 100) + (aiResponse.length > 100 ? '...' : ''));
            
            // Check if response was potentially truncated
            if (data?.candidates?.[0]?.finishReason) {
                console.log('🏁 Finish reason:', data.candidates[0].finishReason);
                if (data.candidates[0].finishReason === 'MAX_TOKENS') {
                    console.warn('⚠️ Response was truncated due to max tokens limit');
                }
            }
            
            return aiResponse;

        } catch (error) {
            console.error('❌ Error contacting Gemini API:', error);
            
            if (error.message.includes('API key')) {
                return "API key error. Please check your configuration.";
            } else if (error.message.includes('network')) {
                return "Network error. Please check your internet connection.";
            } else {
                return "Sorry, I'm having trouble connecting right now. Please try again later.";
            }
        }
    }

    // Handle smart document generation requests
    async handleSmartDocumentRequest(message, fileContent, userId) {
        try {
            console.log('🔍 handleSmartDocumentRequest called with:', {
                message: message?.substring(0, 100),
                hasFileContent: !!fileContent,
                userId: userId
            });
            
            if (typeof documentService === 'undefined') {
                console.warn('⚠️ Document service not available');
                return null;
            }

            // Check if this is a document generation request
            console.log('🔍 Checking document type detection for message:', message);
            const documentType = documentService.detectDocumentType(message);
            console.log('📋 Document type detected:', documentType);
            
            // Handle file-only request (auto-summary)
            if (!message.trim() && fileContent) {
                console.log('📄 Generating detailed auto-summary for uploaded file');
                const summaryRequest = documentService.generateDocumentSummary(fileContent);
                const aiResponse = await this.generateResponse(summaryRequest.prompt);
                
                // Add context about the summary
                const enhancedResponse = `# 📄 Comprehensive Document Analysis

${aiResponse}

---

*This analysis was automatically generated from your uploaded file. You can now ask me specific questions about the content, request document modifications, or generate new documents based on this information.*`;
                
                return enhancedResponse;
            }
            
            // Handle file + prompt request
            if (fileContent && message.trim()) {
                console.log('📄 Generating document from file content and prompt');
                const docRequest = documentService.generateDocumentFromContent(message, fileContent, documentType);
                console.log('📋 Document request generated:', docRequest.type);
                const aiResponse = await this.generateResponse(docRequest.prompt);
                
                // Add download information
                return this.formatDocumentResponse(aiResponse, docRequest.type, true);
            }
            
            // Handle document generation from scratch
            if (documentType && !fileContent) {
                console.log(`📄 Generating ${documentType} from scratch`);
                const docRequest = documentService.generateDocumentFromScratch(message, documentType);
                console.log('📋 Document request prompt:', docRequest.prompt.substring(0, 200) + '...');
                const aiResponse = await this.generateResponse(docRequest.prompt);
                
                // Add download information
                return this.formatDocumentResponse(aiResponse, documentType, true);
            }
            
            console.log('🔍 No document generation detected, returning null for regular AI handling');
            return null; // Let regular AI service handle this
            
        } catch (error) {
            console.error('❌ Error in smart document handling:', error);
            return null; // Fallback to regular AI service
        }
    }

    // Format document response with download options
    formatDocumentResponse(content, documentType, includeDownload = false) {
        let formattedResponse = content;
        
        if (includeDownload) {
            formattedResponse += `\n\n---\n\n### 📥 Download Options\n\nThis ${documentType} is now ready for download. You can:\n- **Copy** the text above\n- **Download** as HTML file (formatted)\n- **Download** as TXT file (plain text)\n\nWould you like me to make any adjustments to this ${documentType}?`;
        }
        
        return formattedResponse;
    }

    // Process file upload and return extracted content
    async processFileUpload(file, userId) {
        try {
            console.log('📤 Processing file upload:', file.name);
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', userId);
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'File upload failed');
            }
            
            const result = await response.json();
            console.log('✅ File processed successfully:', result.fileName);
            
            return result;
            
        } catch (error) {
            console.error('❌ File upload error:', error);
            throw error;
        }
    }

    // Generate downloadable document
    async generateDownloadableDocument(content, format = 'html') {
        try {
            const response = await fetch('/api/generate-document', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: content,
                    format: format
                })
            });
            
            if (!response.ok) {
                throw new Error('Document generation failed');
            }
            
            const result = await response.json();
            return result;
            
        } catch (error) {
            console.error('❌ Document generation error:', error);
            throw error;
        }
    }

    // Download generated document
    async downloadDocument(content, filename, format = 'html') {
        try {
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: content,
                    filename: filename,
                    format: format
                })
            });
            
            if (!response.ok) {
                throw new Error('Download failed');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            console.log('✅ Document downloaded:', filename);
            
        } catch (error) {
            console.error('❌ Download error:', error);
            throw error;
        }
    }

    // Check if message is a document generation request
    isDocumentGenerationRequest(message) {
        const documentKeywords = [
            'generate', 'create', 'write', 'make', 'draft', 'compose',
            'resume', 'cv', 'cover letter', 'business letter', 'resignation',
            'blog', 'article', 'essay', 'report', 'proposal', 'summary',
            'email', 'letter', 'document'
        ];
        
        const lowerMessage = message.toLowerCase();
        return documentKeywords.some(keyword => lowerMessage.includes(keyword));
    }

    // Enhanced response generation with file context
    async generateResponseWithContext(message, fileContent, userId) {
        const options = {
            fileContent: fileContent,
            userId: userId,
            isSmartRequest: this.isDocumentGenerationRequest(message)
        };
        
        return await this.generateResponse(message, options);
    }

    // Method to validate API key format
    validateApiKey() {
        // Refresh API key from config in case it was updated
        this.apiKey = CONFIG?.GEMINI_API_KEY;
        
        console.log('🔍 Debugging API key validation:');
        console.log('  - CONFIG object exists:', typeof CONFIG !== 'undefined');
        console.log('  - CONFIG.GEMINI_API_KEY exists:', !!CONFIG?.GEMINI_API_KEY);
        console.log('  - API Key value:', this.apiKey);
        console.log('  - API Key type:', typeof this.apiKey);
        console.log('  - API Key length:', this.apiKey?.length);
        console.log('  - API Key starts with AIza:', this.apiKey?.startsWith('AIza'));
        
        if (!this.apiKey) {
            console.warn('❌ No API key found in config');
            return false;
        }
        
        // Basic validation - Gemini API keys are typically long strings starting with 'AIza'
        const isValid = this.apiKey.length > 20 && this.apiKey.startsWith('AIza');
        console.log('🔑 API Key validation result:', isValid);
        return isValid;
    }

    // Method to refresh API key from config
    refreshApiKey() {
        this.apiKey = CONFIG?.GEMINI_API_KEY;
        console.log('🔄 API Key refreshed from config');
        return this.validateApiKey();
    }

    // Method to test API connection
    async testConnection() {
        try {
            console.log('🧪 Testing API connection...');
            const testResponse = await this.generateResponse("Hello");
            const isWorking = testResponse && 
                            !testResponse.includes("Error") && 
                            !testResponse.includes("configure") &&
                            !testResponse.includes("trouble");
            
            console.log('🔍 API test result:', isWorking ? '✅ Working' : '❌ Not working');
            return isWorking;
        } catch (error) {
            console.error('❌ API test failed:', error);
            return false;
        }
    }

    // Method to get API status
    getApiStatus() {
        const hasValidKey = this.validateApiKey();
        return {
            hasValidKey,
            apiKey: hasValidKey ? this.apiKey.substring(0, 10) + '...' : 'Not configured',
            isConfigured: hasValidKey,
            supportsFileUpload: true,
            supportsDocumentGeneration: typeof documentService !== 'undefined'
        };
    }
}

// Create global instance
const aiService = new AIService();

// Make aiService globally available
window.aiService = aiService; 