-- Enable the vector extension
create extension if not exists vector;

-- Create function to check table schema
create or replace function check_table_schema(table_name text)
returns jsonb
language plpgsql
as $$
declare
    result jsonb;
begin
    select jsonb_build_object(
        'table_exists', exists (
            select from information_schema.tables 
            where table_name = $1
        ),
        'columns', (
            select jsonb_object_agg(column_name, data_type)
            from information_schema.columns
            where table_name = $1
        )
    ) into result;
    
    return result;
end;
$$;

-- Drop existing table if it exists
drop table if exists tools;

-- Create the tools table with vector support
create table tools (
    id bigint primary key generated always as identity,
    name text not null,
    url text not null,
    summary text not null,
    categories jsonb default '[]'::jsonb,
    embedding vector(384),
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create the similarity search function
create or replace function match_tools (
    query_embedding vector(384),
    match_threshold float,
    match_count int
)
returns table (
    id bigint,
    name text,
    url text,
    summary text,
    categories jsonb,
    similarity float
)
language plpgsql
as $$
begin
    return query
    select
        tools.id,
        tools.name,
        tools.url,
        tools.summary,
        tools.categories,
        1 - (tools.embedding <=> query_embedding) as similarity
    from tools
    where 1 - (tools.embedding <=> query_embedding) > match_threshold
    order by tools.embedding <=> query_embedding
    limit match_count;
end;
$$;

-- Create the vector index
create index on tools
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
