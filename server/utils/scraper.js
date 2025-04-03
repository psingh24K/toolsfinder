import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

// Simple in-memory cache for scraped content
const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Extract relevant text content from HTML while preserving some structure
 * @param {string} html - Raw HTML content
 * @returns {string} - Cleaned text content
 */
function extractTextFromHtml(html) {
    const $ = cheerio.load(html);

    // Remove unwanted elements more comprehensively
    $('script, style, noscript, iframe, img, svg, [aria-hidden="true"], .hidden, .visually-hidden, meta, link, head > *').remove();

    // Get text from important elements
    const title = $('title').text().trim();
    const metaDescription = $('meta[name="description"]').attr('content') || '';

    // Get headings with priority
    const h1Text = $('h1').map((_, el) => $(el).text().trim()).get().join(' ');
    const h2Text = $('h2').map((_, el) => $(el).text().trim()).get().join(' ');

    // Extract main content more intelligently
    let mainContent = '';

    // Try to find main content containers
    const contentSelectors = ['main', 'article', '.content', '#content', '.main', '#main'];
    for (const selector of contentSelectors) {
        if ($(selector).length) {
            mainContent = $(selector).text().trim();
            break;
        }
    }

    // If no main content found, use body
    if (!mainContent) {
        mainContent = $('body').text().trim();
    }

    // Clean up the text
    const cleanedText = mainContent
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .trim();

    // Combine all text with priority
    const combinedText = [
        title,
        metaDescription,
        h1Text,
        h2Text,
        cleanedText
    ].filter(Boolean).join('\n\n');

    return combinedText;
}

/**
 * Normalize URL by adding protocol if missing
 * @param {string} url - URL to normalize
 * @returns {string} - Normalized URL
 */
function normalizeUrl(url) {
    // Trim whitespace
    url = url.trim();

    // Check if URL has a protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // Add https:// as default protocol
        url = 'https://' + url;
    }

    try {
        // Validate URL format
        new URL(url);
        return url;
    } catch (error) {
        throw new Error(`Invalid URL format: ${url}`);
    }
}

/**
 * Scrape a website and extract relevant content
 * @param {string} url - URL to scrape
 * @returns {Promise<Object>} - Scraped data
 */
async function scrapeWebsite(url) {
    try {
        // Normalize and validate URL
        url = normalizeUrl(url);

        // Check cache first
        if (cache.has(url)) {
            const cachedData = cache.get(url);
            if (Date.now() - cachedData.timestamp < CACHE_TTL) {
                console.log(`Using cached data for ${url}`);
                return cachedData.data;
            } else {
                // Cache expired, remove it
                cache.delete(url);
            }
        }
    } catch (error) {
        console.error('URL validation error:', error);
        throw error;
    }

    try {
        // Fetch the HTML content with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        console.log(`Fetching URL: ${url}`);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Check if response is OK
        if (!response.ok) {
            throw new Error(`Website returned error status: ${response.status} for ${url}`);
        }

        // Get the HTML content
        const html = await response.text();
        console.log(`Received HTML content (${html.length} bytes)`);

        // Load the HTML with cheerio
        const $ = cheerio.load(html);

        // Extract title
        const title = $('title').text().trim() || new URL(url).hostname.replace('www.', '');

        // Extract meta description
        const description = $('meta[name="description"]').attr('content') || '';

        // Extract text content
        const textContent = extractTextFromHtml(html);

        const result = {
            title,
            description,
            textContent,
            url
        };

        // Store in cache
        cache.set(url, {
            data: result,
            timestamp: Date.now()
        });

        return result;
    } catch (error) {
        console.error('Error scraping website:', error);

        // Extract domain from URL for fallback title
        let fallbackTitle = 'Unknown Website';
        try {
            const urlObj = new URL(url);
            fallbackTitle = urlObj.hostname.replace('www.', '');
        } catch (e) {
            // If URL parsing fails, use the original URL as fallback
            fallbackTitle = url;
        }

        // Return basic information even if scraping failed
        if (error.name === 'AbortError') {
            return {
                title: fallbackTitle,
                description: '',
                textContent: `Failed to load content: Request timed out`,
                url: url
            };
        } else if (error.message.includes('error status') ||
                  error.message.includes('ENOTFOUND') ||
                  error.message.includes('ECONNREFUSED')) {
            return {
                title: fallbackTitle,
                description: '',
                textContent: `Failed to load content: ${error.message}`,
                url: url
            };
        }

        // For other errors, throw to be handled by the caller
        throw new Error(`Failed to scrape website: ${error.message}`);
    }
}

/**
 * Clear the scraper cache
 */
function clearCache() {
    cache.clear();
    console.log('Scraper cache cleared');
}

export { scrapeWebsite, clearCache };
