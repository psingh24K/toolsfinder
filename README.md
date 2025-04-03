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

[Your chosen license]

## Acknowledgments 🙏

- Built with Express.js and Supabase
- Uses pgvector for semantic search
- Designed for simplicity and efficiency
