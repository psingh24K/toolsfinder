import fetch from 'node-fetch';

const OLLAMA_URL = process.env.OLLAMA_API || 'http://localhost:11434/api/generate';
const MODEL = 'gemma3:12b';  // Updated to use gemma3:12b model

// Cache for analysis results
const analysisCache = new Map();
const CACHE_TTL = 86400000; // 24 hours in milliseconds

/**
 * Generate a response from Ollama with timeout and error handling
 * @param {string} prompt - The prompt to send to Ollama
 * @returns {Promise<string>} - The generated response
 */
async function generateResponse(prompt) {
    try {
        // Add timeout to fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL,
                prompt,
                stream: false
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error calling Ollama:', error);
        if (error.name === 'AbortError') {
            throw new Error('Ollama request timed out');
        }
        throw new Error(`Failed to generate response from Ollama: ${error.message}`);
    }
}

/**
 * Extract categories from AI response with improved pattern matching
 * @param {string} response - The AI response text
 * @returns {string[]} - Array of categories
 */
function extractCategories(response) {
    // Try different patterns to find categories
    const patterns = [
        /CATEGORIES:\s*(.*?)(?:\n|$)/i,
        /Categories:\s*(.*?)(?:\n|$)/i,
        /\[(.*?)\]/,  // Look for bracketed lists
        /([\w\s,-]+)(?:\n|$)/  // Look for comma-separated values
    ];

    for (const pattern of patterns) {
        const match = response.match(pattern);
        if (match && match[1]) {
            return match[1]
                .split(/[,\n]/)  // Split by comma or newline
                .map(cat => cat.trim())
                .filter(cat => cat && cat !== '.' && cat.length > 1);  // Remove empty and single-char categories
        }
    }

    // If no categories found, try to extract keywords from the response
    const keywords = response
        .split(/\s+/)
        .filter(word => word.length > 5 && /^[a-z]+$/i.test(word))
        .slice(0, 3);

    if (keywords.length > 0) {
        return keywords;
    }

    return ['uncategorized'];
}

/**
 * Extract summary from AI response
 * @param {string} response - The AI response text
 * @returns {string} - Extracted summary
 */
function extractSummary(response) {
    const summaryMatch = response.match(/SUMMARY:\s*([\s\S]*?)(?=CATEGORIES:|$)/i);
    return summaryMatch ? summaryMatch[1].trim() : '';
}

/**
 * Analyze tool content and generate summary and categories with caching
 * @param {Object} content - The tool content to analyze
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeToolContent(content) {
    const { title, description, textContent, url } = content;

    // Create a cache key from the URL
    if (url && analysisCache.has(url)) {
        const cachedData = analysisCache.get(url);
        if (Date.now() - cachedData.timestamp < CACHE_TTL) {
            console.log(`Using cached analysis for ${url}`);
            return cachedData.analysis;
        } else {
            // Cache expired, remove it
            analysisCache.delete(url);
        }
    }

    // Create a prompt for the summary and categories
    const summaryPrompt = `
You are analyzing a tool/website. Based on this content, provide a summary and categorization:

Title: ${title}
URL: ${url}
Description: ${description}
Content: ${textContent ? textContent.slice(0, 2000) : 'No content available'}

Respond in this exact format:

SUMMARY: Write a concise 100-word summary of what this tool does, its key features, and why it's useful.

CATEGORIES: List 3-5 relevant categories as comma-separated values. Choose from: development, productivity, automation, collaboration, design, analytics, security, communication, cloud, database, testing, monitoring, documentation, devops, ai, other.

Example categories response:
CATEGORIES: development, collaboration, automation

Keep it simple and focused on the tool's main purpose.
`;

    try {
        const response = await generateResponse(summaryPrompt);

        // Extract summary and categories
        const summary = extractSummary(response);
        const categories = extractCategories(response);

        // Ensure we have at least one category
        if (categories.length === 0) {
            categories.push('uncategorized');
        }

        const result = {
            summary: summary || description || title || 'No description available',
            categories: categories
        };

        // Cache the result if URL is provided
        if (url) {
            analysisCache.set(url, {
                analysis: result,
                timestamp: Date.now()
            });
        }

        return result;
    } catch (error) {
        console.error('Error analyzing content:', error);
        // Fallback to basic information if analysis fails
        return {
            summary: description || title || 'No description available',
            categories: ['uncategorized']
        };
    }
}

/**
 * Clear the analysis cache
 */
function clearAnalysisCache() {
    analysisCache.clear();
    console.log('Analysis cache cleared');
}

export { analyzeToolContent, clearAnalysisCache };
