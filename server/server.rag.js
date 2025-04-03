import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression'; // Changed from express-compression to compression
import { scrapeWebsite, clearCache } from './utils/scraper.js';
import { analyzeToolContent, clearAnalysisCache } from './utils/ollama.js';
import { semanticSearch, clearEmbeddingsCache } from './utils/search.js';

// ES module dirname equivalent and load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables with explicit path
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize Express app
const app = express();
const router = express.Router();
const PORT = process.env.PORT || 3000;

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('Attempting to connect to Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Make sure SUPABASE_URL and SUPABASE_KEY are in your .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(compression()); // Add compression for better performance

// Request logging with timing
app.use((req, res, next) => {
    const start = Date.now();
    console.log(`${req.method} ${req.url}`);

    // Add response finished listener to log timing
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.url} completed in ${duration}ms with status ${res.statusCode}`);
    });

    next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// Add a new tool
app.post('/tools', async (req, res) => {
    try {
        const { name, url, summary, categories } = req.body;

        // Check if URL already exists
        const { data: existingTools } = await supabase
            .from('tools')
            .select('id, name')
            .eq('url', url);

        if (existingTools && existingTools.length > 0) {
            return res.status(400).json({
                success: false,
                error: `This tool already exists as "${existingTools[0].name}"`
            });
        }

        // Basic validation
        if (!name || !url || !summary) {
            return res.status(400).json({
                success: false,
                error: 'Name, URL, and summary are required'
            });
        }

        // Validate categories is an array
        const validCategories = Array.isArray(categories) ? categories : ['uncategorized'];

        const { data, error } = await supabase
            .from('tools')
            .insert([{
                name,
                url,
                summary,
                categories: validCategories
            }])
            .select();

        if (error) throw error;

        res.json({ success: true, tool: data[0] });
    } catch (error) {
        console.error('Error adding tool:', error);
        res.status(500).json({ success: false, error: 'Failed to add tool' });
    }
});

// Get all tools
app.get('/tools', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tools')
            .select('*');

        if (error) throw error;

        res.json({
            success: true,
            tools: data
        });
    } catch (error) {
        console.error('Error fetching tools:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Test Supabase vector setup
app.get('/test-vector', async (req, res) => {
    try {
        // Try to insert a test vector to verify vector support
        const testVector = Array(384).fill(0.1); // Create a test vector
        const { data: insertData, error: insertError } = await supabase
            .from('tools')
            .insert({
                name: 'test_tool',
                url: 'http://test.com',
                summary: 'Test tool for vector support',
                embedding: testVector
            })
            .select();

        if (insertError) {
            throw insertError;
        }

        // Clean up - delete the test entry
        await supabase
            .from('tools')
            .delete()
            .eq('name', 'test_tool');

        res.json({
            success: true,
            message: 'Vector operations working correctly',
            insertedData: insertData
        });
    } catch (error) {
        console.error('Vector setup test error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Test basic server
router.get('/test', (req, res) => {
    console.log('Test route hit');
    res.json({ message: 'Server is working!' });
});

// Test Supabase connection
router.get('/db-test', async (req, res) => {
    console.log('Testing Supabase connection...');
    try {
        const { data, error } = await supabase
            .from('tools')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        console.log('Supabase test successful:', data);
        res.json({
            success: true,
            message: 'Successfully connected to Supabase',
            data: data
        });
    } catch (error) {
        console.error('Connection test failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error
        });
    }
});

// Clear cache endpoint
router.post('/clear-cache', (req, res) => {
    try {
        clearCache(); // Clear scraper cache
        clearAnalysisCache(); // Clear analysis cache
        clearEmbeddingsCache(); // Clear embeddings cache

        res.json({
            success: true,
            message: 'All caches cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing caches:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear caches'
        });
    }
});

// Analyze endpoint
app.post('/analyze', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ success: false, error: 'URL is required' });
        }

        // Check if URL already exists
        const { data: existingTools } = await supabase
            .from('tools')
            .select('id, name')
            .eq('url', url);

        if (existingTools && existingTools.length > 0) {
            return res.status(400).json({
                success: false,
                error: `This tool already exists as "${existingTools[0].name}"`
            });
        }

        // Scrape website content
        const scrapedData = await scrapeWebsite(url);

        // Check if we have enough content to analyze
        const hasContent = scrapedData.textContent &&
                          scrapedData.textContent.length > 50 &&
                          !scrapedData.textContent.includes('Failed to load content');

        let analysis;
        if (hasContent) {
            // Analyze content with Ollama
            analysis = await analyzeToolContent(scrapedData);
        } else {
            // Create basic analysis with limited information
            analysis = {
                summary: `This appears to be a website at ${url}. We couldn't extract detailed information.`,
                categories: ['uncategorized']
            };
        }

        // Extract domain for name if title is missing
        let name = scrapedData.title || 'Untitled Tool';
        if (name === 'Untitled Tool' || name === 'Unknown Website') {
            try {
                const urlObj = new URL(url);
                name = urlObj.hostname.replace('www.', '');
            } catch (e) {
                // Keep the default name
            }
        }

        res.json({
            success: true,
            analysis: {
                name: name,
                url: scrapedData.url,
                summary: analysis.summary,
                categories: analysis.categories
            }
        });
    } catch (error) {
        console.error('Error analyzing URL:', error);

        // Provide more specific error messages based on the error type
        if (error.message && error.message.includes('Invalid URL format')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid URL format. Please enter a valid URL (e.g., example.com or https://example.com)'
            });
        } else if (error.message && error.message.includes('Navigation timeout')) {
            return res.status(504).json({
                success: false,
                error: 'Website took too long to respond. Please try again or try a different URL.'
            });
        } else if (error.name === 'TimeoutError') {
            return res.status(504).json({
                success: false,
                error: 'Connection timed out. The website may be down or blocking our requests.'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to analyze URL. Please check the URL and try again.'
        });
    }
});

// Update a tool
app.put('/tools/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, url, summary, categories } = req.body;

        // Check if URL already exists for a different tool
        const { data: existingTools } = await supabase
            .from('tools')
            .select('id, name')
            .eq('url', url)
            .neq('id', id);

        if (existingTools && existingTools.length > 0) {
            return res.status(400).json({
                success: false,
                error: `This URL is already used by "${existingTools[0].name}"`
            });
        }

        // Validate categories is an array
        const validCategories = Array.isArray(categories) ? categories : ['uncategorized'];

        const { data, error } = await supabase
            .from('tools')
            .update({
                name,
                url,
                summary,
                categories: validCategories
            })
            .eq('id', id)
            .select();

        if (error) throw error;

        res.json({ success: true, tool: data[0] });
    } catch (error) {
        console.error('Error updating tool:', error);
        res.status(500).json({ success: false, error: 'Failed to update tool' });
    }
});

// Delete a tool
app.delete('/tools/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('tools')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting tool:', error);
        res.status(500).json({ success: false, error: 'Failed to delete tool' });
    }
});

// Semantic search endpoint
app.post('/search', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ success: false, error: 'Search query is required' });
        }

        // Get all tools from database
        const { data: tools, error } = await supabase
            .from('tools')
            .select('*');

        if (error) throw error;

        // Perform semantic search
        const results = await semanticSearch(tools, query);
        res.json({ success: true, results });
    } catch (error) {
        console.error('Error searching tools:', error);
        res.status(500).json({ success: false, error: 'Failed to search tools' });
    }
});

// Mount API routes
app.use('/api', router);

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Available routes:');
    console.log('- http://localhost:3000/ (Frontend UI)');
    console.log('- http://localhost:3000/api/test (Basic server test)');
    console.log('- http://localhost:3000/api/db-test (Supabase connection test)');
    console.log('- http://localhost:3000/test-vector (Test vector setup)');
    console.log('- POST http://localhost:3000/tools (Add a new tool)');
    console.log('- GET http://localhost:3000/tools (List all tools)');
    console.log('- POST http://localhost:3000/analyze (Analyze a URL)');
    console.log('- PUT http://localhost:3000/tools/:id (Update a tool)');
    console.log('- DELETE http://localhost:3000/tools/:id (Delete a tool)');
    console.log('- POST http://localhost:3000/search (Semantic search)');
    console.log('- POST http://localhost:3000/api/clear-cache (Clear all caches)');
});
