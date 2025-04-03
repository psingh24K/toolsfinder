# ToolsFinder

A tool for finding and categorizing developer tools using AI. This application allows you to discover, analyze, and categorize developer tools using AI-powered content analysis.

## Features ✨

- **URL Analysis**: Automatically extract information from tool websites
- **AI Categorization**: Uses Ollama (gemma3:12b) to categorize tools
- **Semantic Search**: Find tools based on meaning, not just keywords
- **Caching System**: Efficient performance with built-in caching
- **Responsive UI**: Clean interface for managing your tool collection

## Tech Stack 🛠️

- **Backend**: Node.js with Express
- **Database**: Supabase (PostgreSQL with pgvector)
- **AI**: Ollama with gemma3:12b for content analysis
- **Embeddings**: nomic-embed-text for semantic search
- **Frontend**: HTML/CSS/JavaScript with Tailwind CSS

## Installation 📦

### Prerequisites

- Node.js (v14+)
- Ollama with gemma3:12b and nomic-embed-text models installed
- Supabase account and project

### Setup

1. Clone the repository
   ```bash
   git clone https://github.com/psingh24K/toolsfinder.git
   cd toolsfinder
   ```

2. Install dependencies
   ```bash
   cd server
   npm install
   # or if using pnpm
   pnpm install
   ```

3. Create a `.env` file in the server directory with your Supabase credentials
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   OLLAMA_API=http://localhost:11434/api
   ```

4. Start the server
   ```bash
   npm start
   # or if using pnpm
   pnpm start
   ```

5. Access the application at `http://localhost:3000`

## API Endpoints 🔌

- `GET /api/tools` - Fetch all tools
- `GET /api/tools/search?query=<search-term>` - Search tools
- `POST /api/tools` - Add a new tool

## Database Schema 📊

```sql
CREATE TABLE tools (
    id bigint primary key generated always as identity,
    name text not null,
    url text not null,
    summary text not null,
    categories jsonb default '[]'::jsonb,
    embedding vector(384),
    created_at timestamp with time zone default timezone('utc'::text, now())
)
```

## Supabase Integration Notes 📝

### Connection Troubleshooting

Initially, we faced issues with Supabase connection when trying to check the database setup by querying system tables directly. Here's what we learned:

1. **What Didn't Work:**
   - Trying to query `pg_extension` table directly
   - Attempting to check internal database structure through client API
   - Over-engineering the connection verification

2. **What Worked:**
   - Direct feature testing instead of configuration checking
   - Using public tables and standard operations
   - "Fail fast" approach - trying actual operations instead of pre-checking

3. **Key Learnings:**
   - Supabase client API has limited access to system tables (by design)
   - It's better to test functionality directly than checking configuration
   - Vector operations work seamlessly when using the proper table structure

## Usage 📝

1. **Adding a Tool**
   - Send a POST request to `/tools` with:
     ```json
     {
       "name": "Tool Name",
       "url": "https://tool-url.com",
       "summary": "Tool description",
       "categories": ["category1", "category2"]
     }
     ```

2. **Viewing Tools**
   - GET `/tools` returns all tools
   - Tools include name, URL, summary, and categories
   - Vector embeddings are handled automatically

## Contributing 🤝

Feel free to submit issues and enhancement requests!

## License 📄

MIT License

## Acknowledgments 🙏

- Built with Express.js and Supabase
- Uses Ollama with gemma3:12b for AI analysis
- Uses nomic-embed-text for semantic search
- Designed for simplicity and efficiency
