// Smart Document Generation Service
class DocumentService {
    constructor() {
        this.fileCache = new Map(); // Store file contents temporarily
        this.contextCache = new Map(); // Store context per user
        this.documentPatterns = this.initializeDocumentPatterns();
        console.log('📄 Document Service initialized');
    }

    initializeDocumentPatterns() {
        return {
            resume: [
                /\b(resume|cv|curriculum vitae)\b/i,
                /\b(job application|employment|career)\b/i,
                /\b(work experience|professional experience)\b/i
            ],
            coverLetter: [
                /\b(cover letter|application letter)\b/i,
                /\b(job application|position|vacancy)\b/i,
                /\b(dear (hiring manager|sir|madam))\b/i
            ],
            businessLetter: [
                /\b(business letter|formal letter|official letter)\b/i,
                /\b(complaint|inquiry|request|proposal)\b/i,
                /\b(sincerely|regards|yours (truly|faithfully))\b/i
            ],
            resignationLetter: [
                /\b(resignation|resign|quit|leave|departure)\b/i,
                /\b(last (day|working day)|notice period)\b/i,
                /\b(step down|move on|career change)\b/i
            ],
            blog: [
                /\b(blog|article|post)\b/i,
                /\b(write about|topic|subject)\b/i,
                /\b(content|editorial|piece)\b/i
            ],
            essay: [
                /\b(essay|paper|thesis|dissertation)\b/i,
                /\b(argument|analysis|discussion)\b/i,
                /\b(academic|scholarly|research)\b/i
            ],
            summary: [
                /\b(summary|summarize|overview)\b/i,
                /\b(brief|concise|condensed)\b/i,
                /\b(key points|main ideas|highlights)\b/i
            ],
            report: [
                /\b(report|analysis|findings)\b/i,
                /\b(data|statistics|research)\b/i,
                /\b(conclusion|recommendation)\b/i
            ],
            email: [
                /\b(email|message|correspondence)\b/i,
                /\b(send|compose|draft)\b/i,
                /\b(subject|recipient|attach)\b/i
            ],
            proposal: [
                /\b(proposal|project|plan)\b/i,
                /\b(budget|timeline|scope)\b/i,
                /\b(solution|approach|strategy)\b/i
            ]
        };
    }

    // Detect document type from user input - Enhanced to handle ANY document type
    detectDocumentType(text) {
        const normalizedText = text.toLowerCase();
        
        // Enhanced patterns to catch ANY document creation request
        const documentCreationKeywords = [
            'create', 'generate', 'write', 'make', 'draft', 'compose', 'build', 'develop',
            'prepare', 'design', 'construct', 'produce', 'form', 'establish', 'craft'
        ];
        
        const documentTypeKeywords = [
            'document', 'file', 'paper', 'report', 'letter', 'note', 'memo', 'guide',
            'manual', 'handbook', 'tutorial', 'article', 'essay', 'story', 'script',
            'proposal', 'plan', 'strategy', 'roadmap', 'outline', 'summary', 'review',
            'analysis', 'research', 'study', 'presentation', 'speech', 'contract',
            'agreement', 'policy', 'procedure', 'checklist', 'template', 'format',
            'specification', 'requirements', 'instructions', 'guidelines', 'framework',
            'methodology', 'workflow', 'process', 'schedule', 'timeline', 'agenda',
            'minutes', 'bulletin', 'newsletter', 'announcement', 'notice', 'flyer',
            'brochure', 'catalog', 'portfolio', 'resume', 'cv', 'bio', 'profile'
        ];
        
        // Check for creation keywords
        const hasCreationKeyword = documentCreationKeywords.some(keyword => 
            normalizedText.includes(keyword)
        );
        
        // Check for document type keywords
        const hasDocumentKeyword = documentTypeKeywords.some(keyword => 
            normalizedText.includes(keyword)
        );
        
        // Enhanced pattern matching for any document type
        if (hasCreationKeyword || hasDocumentKeyword) {
            // Try to extract the specific document type from the text
            const extractedType = this.extractDocumentTypeFromText(normalizedText);
            if (extractedType) {
                console.log(`📋 Detected document type: ${extractedType}`);
                return extractedType;
            }
        }
        
        // Fallback: Check for specific predefined patterns
        for (const [docType, patterns] of Object.entries(this.documentPatterns)) {
            for (const pattern of patterns) {
                if (pattern.test(normalizedText)) {
                    console.log(`📋 Detected document type: ${docType}`);
                    return docType;
                }
            }
        }
        
        // If we detected creation intent but no specific type, return generic
        if (hasCreationKeyword && hasDocumentKeyword) {
            console.log(`📋 Detected generic document creation request`);
            return 'custom_document';
        }
        
        return null;
    }
    
    // Extract specific document type from user text
    extractDocumentTypeFromText(text) {
        // Common document type patterns with variations
        const typePatterns = {
            'resume': /\b(resume|cv|curriculum vitae)\b/,
            'cover_letter': /\b(cover letter|covering letter|application letter)\b/,
            'business_letter': /\b(business letter|formal letter|official letter)\b/,
            'resignation_letter': /\b(resignation letter|resignation|quit letter)\b/,
            'blog_post': /\b(blog post|blog|article|web article)\b/,
            'essay': /\b(essay|composition|paper|academic paper)\b/,
            'report': /\b(report|analysis|study|research)\b/,
            'proposal': /\b(proposal|project proposal|business proposal)\b/,
            'email': /\b(email|e-mail|message|correspondence)\b/,
            'memo': /\b(memo|memorandum|internal note)\b/,
            'manual': /\b(manual|handbook|guide|tutorial)\b/,
            'presentation': /\b(presentation|slides|slideshow|ppt)\b/,
            'script': /\b(script|screenplay|dialogue)\b/,
            'story': /\b(story|narrative|fiction|tale)\b/,
            'poem': /\b(poem|poetry|verse|rhyme)\b/,
            'song': /\b(song|lyrics|music|verse)\b/,
            'speech': /\b(speech|address|remarks|oration)\b/,
            'contract': /\b(contract|agreement|terms|legal document)\b/,
            'policy': /\b(policy|procedure|guidelines|rules)\b/,
            'checklist': /\b(checklist|todo|task list|action items)\b/,
            'schedule': /\b(schedule|timeline|calendar|agenda)\b/,
            'invoice': /\b(invoice|bill|receipt|statement)\b/,
            'newsletter': /\b(newsletter|bulletin|update|announcement)\b/,
            'press_release': /\b(press release|news release|announcement)\b/,
            'job_description': /\b(job description|job posting|position description)\b/,
            'meeting_minutes': /\b(meeting minutes|minutes|meeting notes)\b/,
            'summary': /\b(summary|overview|synopsis|abstract)\b/,
            'outline': /\b(outline|structure|framework|plan)\b/,
            'specification': /\b(specification|spec|requirements|details)\b/,
            'readme': /\b(readme|documentation|docs|help)\b/,
            'faq': /\b(faq|frequently asked questions|q&a)\b/,
            'biography': /\b(biography|bio|life story|profile)\b/,
            'review': /\b(review|evaluation|assessment|critique)\b/,
            'recommendation': /\b(recommendation|endorsement|reference)\b/,
            'complaint': /\b(complaint|grievance|issue|problem)\b/,
            'thank_you_note': /\b(thank you|thanks|appreciation|gratitude)\b/,
            'apology': /\b(apology|sorry|regret|excuse)\b/,
            'invitation': /\b(invitation|invite|event|gathering)\b/,
            'announcement': /\b(announcement|notice|alert|update)\b/
        };
        
        // Try to match specific document types
        for (const [type, pattern] of Object.entries(typePatterns)) {
            if (pattern.test(text)) {
                return type;
            }
        }
        
        // Try to extract custom type from phrases like "create a [type]" or "write a [type]"
        const customTypeMatch = text.match(/(?:create|write|make|generate|draft|compose|build|develop|prepare|design)\s+(?:a|an|the)?\s*([a-zA-Z\s]{2,30})(?:\s+(?:document|file|paper|for|about|on))?/);
        if (customTypeMatch && customTypeMatch[1]) {
            let extractedType = customTypeMatch[1].trim();
            // Clean up common words
            extractedType = extractedType.replace(/\b(document|file|paper|for|about|on|the|a|an)\b/g, '').trim();
            if (extractedType.length > 1) {
                return extractedType.replace(/\s+/g, '_');
            }
        }
        
        return null;
    }

    // Process uploaded file and extract text
    async processUploadedFile(file, userId) {
        try {
            console.log(`📤 Processing file: ${file.name} (${file.type})`);
            
            let extractedText = '';
            const fileExtension = file.name.split('.').pop().toLowerCase();
            
            switch (fileExtension) {
                case 'pdf':
                    extractedText = await this.extractPDFText(file);
                    break;
                case 'docx':
                    extractedText = await this.extractDocxText(file);
                    break;
                case 'doc':
                    extractedText = await this.extractDocText(file);
                    break;
                case 'txt':
                    extractedText = await this.extractTxtText(file);
                    break;
                default:
                    throw new Error(`Unsupported file type: ${fileExtension}`);
            }

            // Cache the extracted content
            const fileKey = `${userId}_${Date.now()}`;
            this.fileCache.set(fileKey, {
                fileName: file.name,
                content: extractedText,
                timestamp: Date.now(),
                fileType: fileExtension
            });

            // Store in user context
            this.setUserContext(userId, 'lastUploadedFile', {
                key: fileKey,
                name: file.name,
                content: extractedText,
                type: fileExtension
            });

            console.log(`✅ File processed successfully: ${extractedText.length} characters extracted`);
            return { fileKey, content: extractedText, fileName: file.name };

        } catch (error) {
            console.error('❌ Error processing file:', error);
            throw error;
        }
    }

    // Extract text from PDF
    async extractPDFText(file) {
        try {
            // This would need to be implemented server-side with pdf-parse
            // For now, return a placeholder for client-side
            return `[PDF content from ${file.name} - Processing requires server-side implementation]`;
        } catch (error) {
            throw new Error(`PDF processing failed: ${error.message}`);
        }
    }

    // Extract text from DOCX
    async extractDocxText(file) {
        try {
            // This would need to be implemented server-side with mammoth
            // For now, return a placeholder for client-side
            return `[DOCX content from ${file.name} - Processing requires server-side implementation]`;
        } catch (error) {
            throw new Error(`DOCX processing failed: ${error.message}`);
        }
    }

    // Extract text from DOC (legacy format)
    async extractDocText(file) {
        try {
            // DOC format is more complex, would need specialized library
            return `[DOC content from ${file.name} - Legacy format, consider converting to DOCX]`;
        } catch (error) {
            throw new Error(`DOC processing failed: ${error.message}`);
        }
    }

    // Extract text from TXT
    async extractTxtText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read text file'));
            reader.readAsText(file);
        });
    }

    // Generate smart response based on file content and user prompt
    async generateSmartResponse(userId, userPrompt, fileContent = null) {
        try {
            let context = '';
            let detectedDocType = null;
            
            // Check if we have file content
            if (fileContent) {
                context = `File content:\n${fileContent}\n\n`;
            } else {
                // Check for cached file content
                const userContext = this.getUserContext(userId);
                if (userContext && userContext.lastUploadedFile) {
                    context = `Previously uploaded file (${userContext.lastUploadedFile.name}):\n${userContext.lastUploadedFile.content}\n\n`;
                    fileContent = userContext.lastUploadedFile.content;
                }
            }

            // Detect document type from prompt
            detectedDocType = this.detectDocumentType(userPrompt);

            // Generate appropriate response
            if (!userPrompt.trim() && fileContent) {
                // Only file uploaded, generate summary
                return this.generateDocumentSummary(fileContent);
            } else if (userPrompt.trim() && fileContent) {
                // File + prompt, generate based on intent
                return this.generateDocumentFromContent(userPrompt, fileContent, detectedDocType);
            } else if (detectedDocType) {
                // Document generation request without file
                return this.generateDocumentFromScratch(userPrompt, detectedDocType);
            } else {
                // Regular AI response
                return null; // Let the AI service handle this
            }

        } catch (error) {
            console.error('❌ Error generating smart response:', error);
            throw error;
        }
    }

    // Generate summary of uploaded document
    generateDocumentSummary(content) {
        const prompt = `Please provide a comprehensive and detailed analysis of the following document content. Structure your response with these sections:

🔍 **DOCUMENT ANALYSIS OVERVIEW**
- Document type classification
- Primary purpose and context
- Target audience
- Overall document quality assessment

📊 **DOCUMENT STATISTICS**
- Estimated word count
- Character count
- Number of sections/topics covered
- Reading difficulty level

🗂️ **CONTENT STRUCTURE & ORGANIZATION**
- Main sections identified
- Hierarchical organization
- Information flow pattern
- Document completeness

⏰ **TIMELINE ANALYSIS** (if applicable)
- Chronological events mentioned
- Important dates and milestones
- Sequential processes or steps
- Historical context or progression

🎯 **KEY FINDINGS & INSIGHTS**
- 5-7 most important points
- Critical information extracted
- Unique insights or findings
- Notable patterns or trends

📋 **MAIN TOPICS BREAKDOWN**
- Primary subject areas (with brief explanations)
- Secondary themes
- Supporting details and examples
- Cross-references between topics

🔗 **RELATIONSHIPS & CONNECTIONS**
- How different sections relate
- Cause-and-effect relationships
- Dependencies and prerequisites
- Logical flow of information

💡 **ACTIONABLE INTELLIGENCE**
- Key takeaways for action
- Recommendations or next steps mentioned
- Opportunities identified
- Potential challenges or risks

📈 **QUALITY & COMPLETENESS ASSESSMENT**
- Information completeness
- Areas that might need clarification
- Strengths of the document
- Potential gaps or missing information

🏷️ **TAGS & CATEGORIZATION**
- Relevant tags for organization
- Category classification
- Subject matter expertise required
- Complexity level

📝 **EXECUTIVE SUMMARY**
Provide a comprehensive 3-4 paragraph executive summary that captures the essence, purpose, and value of this document.

Document Content:
${content}

Please format your response with clear headers, bullet points, and professional structure for easy reading and reference.`;

        return { type: 'detailed_summary', prompt, originalContent: content };
    }

    // Generate document based on existing content and user prompt - Enhanced for ANY document type
    generateDocumentFromContent(userPrompt, fileContent, docType) {
        // If document type detected, create specific prompts
        if (docType) {
            const cleanDocType = docType.replace(/_/g, ' ');
            
            const contentBasedTemplates = {
                resume: `Based on the provided content and the request "${userPrompt}", create a professional resume. Use the information from the uploaded file to:
- Extract and organize professional experience
- Highlight relevant skills and achievements
- Structure education and certifications
- Create a compelling professional summary
- Format it professionally and make it ATS-friendly
Incorporate any specific requirements mentioned in the request.`,

                cover_letter: `Using the content provided and the request "${userPrompt}", write a professional cover letter that:
- References relevant information from the uploaded document
- Addresses the specific position or opportunity
- Highlights matching qualifications from the file content
- Creates a compelling narrative
- Maintains professional formatting
Tailor it to the specific request and available information.`,

                summary: `Create a comprehensive summary based on the request "${userPrompt}" and the provided file content:
- Extract key points and main themes
- Organize information logically
- Add analysis or insights as requested
- Include relevant details and examples
- Structure it professionally
Focus on what was specifically requested in the prompt.`,

                report: `Generate a detailed report based on the request "${userPrompt}" using the provided file content:
- Create an executive summary
- Organize findings from the file
- Add analysis and interpretation
- Include data and examples from the content
- Structure with appropriate sections
- Provide conclusions and recommendations
Make it comprehensive and well-structured.`,

                analysis: `Perform a thorough analysis based on the request "${userPrompt}" using the provided content:
- Break down key components from the file
- Identify patterns and trends
- Provide insights and interpretation
- Compare different aspects or sections
- Draw meaningful conclusions
- Support findings with evidence from the content
Structure it as a professional analysis document.`,

                proposal: `Create a comprehensive proposal based on the request "${userPrompt}" and the provided file content:
- Use relevant information from the file
- Structure as a professional proposal
- Include background from the content
- Develop solutions or recommendations
- Add timeline and implementation details
- Make it persuasive and actionable
Incorporate specific elements mentioned in the request.`,

                custom_document: `Create a professional document based on the request "${userPrompt}" using the provided file content. 
Analyze both the request and the content to determine the most appropriate structure and approach:
- Extract relevant information from the uploaded file
- Organize it according to the request
- Add analysis, insights, or additional content as needed
- Structure it professionally for its intended purpose
- Ensure it meets the specific requirements mentioned
Make it comprehensive and well-tailored to the request.`
            };
            
            // Get specific template or create dynamic one
            let template = contentBasedTemplates[docType];
            
            if (!template) {
                template = `Based on the provided file content and the request "${userPrompt}", create a professional ${cleanDocType} that:
- Uses relevant information from the uploaded document
- Addresses the specific requirements in your request
- Structures the content appropriately for a ${cleanDocType}
- Maintains professional formatting and tone
- Incorporates industry standards and best practices
- Provides comprehensive coverage of the topic

Make it well-organized, professional, and fit for its intended purpose.`;
            }
            
            return { type: docType, prompt: template, originalContent: fileContent };
        }
        
        // If no specific document type, create a general response
        const generalTemplate = `Based on the provided file content and your request "${userPrompt}", please:
- Analyze the uploaded document content
- Address your specific request or question
- Provide relevant insights and information
- Structure the response appropriately
- Include supporting details from the file
- Make it comprehensive and useful

Here's the file content to work with:
${fileContent.substring(0, 3000)}${fileContent.length > 3000 ? '...\n[Content truncated for processing]' : ''}`;
        
        return { type: 'general_response', prompt: generalTemplate, originalContent: fileContent };
    }

    // Generate document from scratch based on user prompt - Enhanced for ANY document type
    generateDocumentFromScratch(userPrompt, docType) {
        // Enhanced templates for common document types
        const templates = {
            resume: `Create a professional resume template based on this request: "${userPrompt}". Include sections for:
- Contact Information
- Professional Summary
- Work Experience
- Skills
- Education
- Additional sections as relevant
Make it modern and ATS-friendly.`,

            cover_letter: `Write a professional cover letter based on this request: "${userPrompt}". Include:
- Header with contact information
- Proper salutation
- Engaging opening paragraph
- Body paragraphs highlighting relevant qualifications
- Strong closing
- Professional sign-off
Make it compelling and tailored.`,

            resignation_letter: `Create a professional resignation letter based on this request: "${userPrompt}". Include:
- Date and recipient details
- Clear statement of resignation
- Last working day
- Reason (if appropriate)
- Gratitude and positive tone
- Offer to help with transition
- Professional closing
Keep it respectful and professional.`,

            business_letter: `Write a formal business letter based on this request: "${userPrompt}". Include:
- Professional letterhead format
- Date and recipient address
- Appropriate salutation
- Clear purpose in opening
- Detailed body with supporting information
- Call to action or next steps
- Professional closing
Maintain formal business tone throughout.`,

            blog_post: `Create an engaging blog post based on this request: "${userPrompt}". Include:
- Compelling headline
- Engaging introduction
- Well-structured body with subheadings
- Examples or case studies
- Actionable insights
- Strong conclusion
- Call-to-action
Make it informative and reader-friendly.`,

            email: `Compose a professional email based on this request: "${userPrompt}". Include:
- Clear subject line
- Appropriate greeting
- Concise introduction
- Main message with clear points
- Action items or next steps
- Professional closing
Keep it clear and actionable.`,

            proposal: `Create a comprehensive project proposal based on this request: "${userPrompt}". Include:
- Executive Summary
- Problem/Opportunity Statement
- Proposed Solution
- Timeline and Milestones
- Budget and Resources
- Expected Outcomes
- Next Steps
Make it persuasive and detailed.`,

            report: `Generate a detailed report based on this request: "${userPrompt}". Include:
- Executive Summary
- Introduction and Background
- Methodology (if applicable)
- Findings and Analysis
- Conclusions
- Recommendations
- Appendices (if needed)
Make it comprehensive and well-structured.`,

            essay: `Write a well-structured essay based on this request: "${userPrompt}". Include:
- Engaging introduction with thesis statement
- Body paragraphs with supporting evidence
- Clear topic sentences and transitions
- Conclusion that reinforces main points
- Proper academic formatting
Make it compelling and well-argued.`,

            memo: `Create a professional memorandum based on this request: "${userPrompt}". Include:
- TO/FROM/DATE/SUBJECT headers
- Purpose statement
- Background information
- Key points or recommendations
- Next steps or action items
- Professional closing
Keep it concise and actionable.`,

            manual: `Develop a comprehensive manual based on this request: "${userPrompt}". Include:
- Table of Contents
- Introduction and Overview
- Step-by-step procedures
- Safety guidelines (if applicable)
- Troubleshooting section
- Reference materials
- Index
Make it user-friendly and comprehensive.`,

            presentation: `Create a presentation outline based on this request: "${userPrompt}". Include:
- Title slide with key message
- Agenda/outline slide
- Introduction slides
- Main content slides with key points
- Supporting data/examples
- Conclusion and next steps
- Q&A slide
Make it engaging and well-structured.`,

            policy: `Draft a policy document based on this request: "${userPrompt}". Include:
- Policy statement and purpose
- Scope and applicability
- Definitions
- Policy details and procedures
- Responsibilities
- Compliance and enforcement
- Review and revision process
Make it clear and comprehensive.`,

            checklist: `Create a comprehensive checklist based on this request: "${userPrompt}". Include:
- Clear title and purpose
- Categorized sections (if applicable)
- Step-by-step items with checkboxes
- Priority indicators
- Notes or additional information
- Completion criteria
Make it practical and easy to follow.`,

            custom_document: `Create a professional document based on this request: "${userPrompt}". 
Analyze the request to determine the most appropriate structure and format. Include:
- Appropriate headers and sections
- Clear introduction
- Well-organized content
- Professional formatting
- Logical flow and structure
- Appropriate conclusion
Make it comprehensive and well-structured for its intended purpose.`
        };

        // Get template or create dynamic one
        let template = templates[docType];
        
        // If no predefined template, create a dynamic one based on the document type
        if (!template) {
            const cleanDocType = docType.replace(/_/g, ' ');
            template = `Create a professional ${cleanDocType} based on this request: "${userPrompt}".

Please structure this ${cleanDocType} with appropriate sections and formatting for its intended purpose. Consider:
- Professional presentation and formatting
- Clear organization and logical flow
- Relevant content sections
- Appropriate tone and style
- Complete and comprehensive coverage
- Industry standards and best practices

Make it well-structured, professional, and fit for its intended use.`;
        }
        
        return { type: docType, prompt: template, originalContent: null };
    }

    // Context management
    setUserContext(userId, key, value) {
        if (!this.contextCache.has(userId)) {
            this.contextCache.set(userId, {});
        }
        const userContext = this.contextCache.get(userId);
        userContext[key] = value;
        userContext.lastUpdated = Date.now();
        
        // Clean up old contexts (keep for 1 hour)
        setTimeout(() => {
            if (userContext.lastUpdated < Date.now() - 3600000) {
                this.contextCache.delete(userId);
            }
        }, 3600000);
    }

    getUserContext(userId) {
        return this.contextCache.get(userId) || null;
    }

    clearUserContext(userId) {
        this.contextCache.delete(userId);
        // Also clear file cache for this user
        for (const [key, value] of this.fileCache.entries()) {
            if (key.startsWith(userId + '_')) {
                this.fileCache.delete(key);
            }
        }
    }

    // File validation
    isValidFileType(fileName) {
        const allowedExtensions = ['pdf', 'docx', 'doc', 'txt'];
        const extension = fileName.split('.').pop().toLowerCase();
        return allowedExtensions.includes(extension);
    }

    isValidFileSize(fileSize, maxSizeMB = 10) {
        return fileSize <= maxSizeMB * 1024 * 1024;
    }

    // Generate downloadable content
    generateDownloadableContent(content, format = 'txt') {
        const timestamp = new Date().toISOString().slice(0, 10);
        
        switch (format) {
            case 'txt':
                return {
                    content: content,
                    filename: `generated_document_${timestamp}.txt`,
                    mimeType: 'text/plain'
                };
            case 'html':
                const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Generated Document</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1, h2, h3 { color: #333; }
        p { margin-bottom: 1em; }
    </style>
</head>
<body>
    ${content.replace(/\n/g, '<br>')}
</body>
</html>`;
                return {
                    content: htmlContent,
                    filename: `generated_document_${timestamp}.html`,
                    mimeType: 'text/html'
                };
            default:
                return {
                    content: content,
                    filename: `generated_document_${timestamp}.txt`,
                    mimeType: 'text/plain'
                };
        }
    }

    // Get status information
    getStatus() {
        return {
            activeCaches: this.contextCache.size,
            cachedFiles: this.fileCache.size,
            supportedFormats: ['pdf', 'docx', 'doc', 'txt'],
            documentTypes: Object.keys(this.documentPatterns)
        };
    }
}

// Create global instance
const documentService = new DocumentService();
window.documentService = documentService;

console.log('📄 Document Service loaded');
console.log('🔧 Supported formats:', documentService.getStatus().supportedFormats);
console.log('📋 Document types:', documentService.getStatus().documentTypes); 