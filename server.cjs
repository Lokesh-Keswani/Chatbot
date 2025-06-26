// Express server for the AI Chatbot application with file upload support
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static('.'));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOCX, DOC, and TXT files are allowed.'));
        }
    }
});

// File processing functions
async function extractTextFromPDF(buffer) {
    try {
        const data = await pdfParse(buffer);
        return data.text;
    } catch (error) {
        throw new Error(`PDF processing failed: ${error.message}`);
    }
}

async function extractTextFromDocx(buffer) {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } catch (error) {
        throw new Error(`DOCX processing failed: ${error.message}`);
    }
}

async function extractTextFromDoc(buffer) {
    // DOC format is more complex and requires specialized handling
    // For now, return an error message
    throw new Error('DOC format is not fully supported. Please convert to DOCX format.');
}

async function extractTextFromTxt(buffer) {
    try {
        return buffer.toString('utf8');
    } catch (error) {
        throw new Error(`TXT processing failed: ${error.message}`);
    }
}

// Routes

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { originalname, mimetype, buffer, size } = req.file;
        const { userId } = req.body;

        console.log(`📤 Processing file upload: ${originalname} (${mimetype}, ${size} bytes)`);

        let extractedText = '';
        const fileExtension = originalname.split('.').pop().toLowerCase();

        // Extract text based on file type
        switch (fileExtension) {
            case 'pdf':
                extractedText = await extractTextFromPDF(buffer);
                break;
            case 'docx':
                extractedText = await extractTextFromDocx(buffer);
                break;
            case 'doc':
                extractedText = await extractTextFromDoc(buffer);
                break;
            case 'txt':
                extractedText = await extractTextFromTxt(buffer);
                break;
            default:
                return res.status(400).json({ error: `Unsupported file type: ${fileExtension}` });
        }

        // Return the extracted content
        res.json({
            success: true,
            fileName: originalname,
            fileType: fileExtension,
            content: extractedText,
            wordCount: extractedText.split(/\s+/).length,
            characterCount: extractedText.length
        });

        console.log(`✅ File processed successfully: ${originalname} (${extractedText.length} characters)`);

    } catch (error) {
        console.error('❌ File upload error:', error);
        res.status(500).json({ 
            error: 'File processing failed', 
            details: error.message 
        });
    }
});

// Document generation endpoint
app.post('/api/generate-document', async (req, res) => {
    try {
        const { prompt, fileContent, documentType, format = 'html' } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Here you would typically call your AI service
        // For now, we'll return a structured response
        let generatedContent = '';
        
        if (documentType === 'summary' && fileContent) {
            generatedContent = generateSummary(fileContent);
        } else {
            generatedContent = `Generated ${documentType || 'document'} based on: ${prompt}`;
            if (fileContent) {
                generatedContent += `\n\nBased on uploaded content: ${fileContent.substring(0, 200)}...`;
            }
        }

        const downloadableContent = generateDownloadableContent(generatedContent, format);

        res.json({
            success: true,
            content: generatedContent,
            downloadable: downloadableContent,
            documentType: documentType || 'custom'
        });

    } catch (error) {
        console.error('❌ Document generation error:', error);
        res.status(500).json({ 
            error: 'Document generation failed', 
            details: error.message 
        });
    }
});

// Download endpoint for generated documents
app.post('/api/download', (req, res) => {
    try {
        const { content, filename, format = 'txt' } = req.body;

        if (!content || !filename) {
            return res.status(400).json({ error: 'Content and filename are required' });
        }

        const downloadableContent = generateDownloadableContent(content, format);
        
        res.setHeader('Content-Type', downloadableContent.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${downloadableContent.filename}"`);
        res.send(downloadableContent.content);

    } catch (error) {
        console.error('❌ Download error:', error);
        res.status(500).json({ 
            error: 'Download failed', 
            details: error.message 
        });
    }
});

// Helper functions
function generateSummary(content) {
    const words = content.split(/\s+/);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return `# Document Summary

## Overview
This document contains ${words.length} words and ${sentences.length} sentences.

## Key Information
${content.substring(0, 500)}${content.length > 500 ? '...' : ''}

## Document Statistics
- **Word Count**: ${words.length}
- **Character Count**: ${content.length}
- **Estimated Reading Time**: ${Math.ceil(words.length / 200)} minutes

## Content Preview
The document appears to be a ${detectDocumentType(content)} containing information about various topics. Please refer to the full content for complete details.`;
}

function detectDocumentType(content) {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('resume') || lowerContent.includes('cv') || 
        lowerContent.includes('work experience') || lowerContent.includes('education')) {
        return 'resume/CV';
    }
    if (lowerContent.includes('dear') && lowerContent.includes('sincerely')) {
        return 'formal letter';
    }
    if (lowerContent.includes('introduction') && lowerContent.includes('conclusion')) {
        return 'academic paper or report';
    }
    
    return 'general document';
}

function generateDownloadableContent(content, format) {
    const timestamp = new Date().toISOString().slice(0, 10);
    
    switch (format) {
        case 'html':
            const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Generated Document</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            margin: 40px; 
            color: #333;
        }
        h1, h2, h3 { color: #2c3e50; margin-top: 30px; }
        h1 { border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        p { margin-bottom: 1em; }
        .header { text-align: center; margin-bottom: 30px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Generated Document</h1>
        <p>Created on ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="content">
        ${content.replace(/\n/g, '<br>').replace(/#{1,6}\s+(.+)/g, '<h2>$1</h2>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}
    </div>
    
    <div class="footer">
        <p>Generated by AI Chatbot - ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>`;
            return {
                content: htmlContent,
                filename: `generated_document_${timestamp}.html`,
                mimeType: 'text/html'
            };
        
        case 'txt':
        default:
            return {
                content: content,
                filename: `generated_document_${timestamp}.txt`,
                mimeType: 'text/plain'
            };
    }
}

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
    }
    
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 AI Chatbot server running at http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`📤 File upload endpoint: /api/upload`);
    console.log(`📄 Document generation endpoint: /api/generate-document`);
    console.log(`💾 Download endpoint: /api/download`);
    console.log(`🔧 Press Ctrl+C to stop the server`);
    console.log(`\n📖 Make sure to configure your Gemini API key in config.js`);
    console.log(`🎯 Demo account: demo@example.com / demo123`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server...');
        process.exit(0);
    });

module.exports = app; 