import fetch from 'node-fetch';

const OLLAMA_URL = 'http://localhost:11434/api/embeddings';
const MODEL = 'nomic-embed-text';

// Cache for embeddings to reduce API calls
const embeddingsCache = new Map();
const CACHE_TTL = 86400000; // 24 hours in milliseconds

/**
 * Get embeddings for a text using Ollama with caching
 * @param {string} text - Text to get embeddings for
 * @returns {Promise<number[]>} - Array of embeddings
 */
async function getEmbeddings(text) {
    // Create a cache key from the text (truncate if too long)
    const cacheKey = text.length > 100 ? text.substring(0, 100) : text;

    // Check cache first
    if (embeddingsCache.has(cacheKey)) {
        const cachedData = embeddingsCache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < CACHE_TTL) {
            return cachedData.embedding;
        } else {
            // Cache expired, remove it
            embeddingsCache.delete(cacheKey);
        }
    }

    try {
        // Add timeout to fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL,
                prompt: text
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Store in cache
        embeddingsCache.set(cacheKey, {
            embedding: data.embedding,
            timestamp: Date.now()
        });

        return data.embedding;
    } catch (error) {
        console.error('Error getting embeddings:', error);
        if (error.name === 'AbortError') {
            throw new Error('Embedding request timed out');
        }
        throw new Error(`Failed to get embeddings: ${error.message}`);
    }
}

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vec1 - First vector
 * @param {number[]} vec2 - Second vector
 * @returns {number} - Cosine similarity score
 */
function cosineSimilarity(vec1, vec2) {
    // Check if vectors are valid
    if (!vec1 || !vec2 || !vec1.length || !vec2.length || vec1.length !== vec2.length) {
        console.error('Invalid vectors for similarity calculation');
        return 0;
    }

    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

    // Avoid division by zero
    if (mag1 === 0 || mag2 === 0) return 0;

    return dotProduct / (mag1 * mag2);
}

/**
 * Search tools using semantic search with optimized performance
 * @param {Object[]} tools - Array of tools to search
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise<Object[]>} - Sorted array of tools with scores
 */
async function semanticSearch(tools, query, limit = 10) {
    try {
        if (!tools || !tools.length) {
            return [];
        }

        // Get query embeddings
        const queryEmbedding = await getEmbeddings(query);

        // Process tools in batches to avoid overwhelming the API
        const batchSize = 5;
        const results = [];

        for (let i = 0; i < tools.length; i += batchSize) {
            const batch = tools.slice(i, i + batchSize);

            // Process batch in parallel
            const batchResults = await Promise.all(batch.map(async tool => {
                try {
                    // Create a combined text representation of the tool
                    const toolText = `${tool.name} ${tool.summary} ${Array.isArray(tool.categories) ? tool.categories.join(' ') : ''}`;
                    const toolEmbedding = await getEmbeddings(toolText);

                    const score = cosineSimilarity(queryEmbedding, toolEmbedding);
                    return { ...tool, score };
                } catch (error) {
                    console.error(`Error processing tool ${tool.name}:`, error);
                    // Return the tool with a low score instead of failing the whole search
                    return { ...tool, score: 0 };
                }
            }));

            results.push(...batchResults);
        }

        // Sort by score and return top results
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    } catch (error) {
        console.error('Error in semantic search:', error);
        throw new Error(`Failed to perform semantic search: ${error.message}`);
    }
}

/**
 * Clear the embeddings cache
 */
function clearEmbeddingsCache() {
    embeddingsCache.clear();
    console.log('Embeddings cache cleared');
}

export { semanticSearch, getEmbeddings, clearEmbeddingsCache };
