-- Remove any length constraint on excerpt column for posts table
-- The excerpt column is TEXT type which has no inherent limit, 
-- but there might be a CHECK constraint

-- First, drop any existing check constraint on excerpt length
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE rel.relname = 'posts'
        AND nsp.nspname = 'public'
        AND con.contype = 'c'
        AND pg_get_constraintdef(con.oid) LIKE '%excerpt%'
    LOOP
        EXECUTE format('ALTER TABLE public.posts DROP CONSTRAINT %I', constraint_name);
    END LOOP;
END $$;

-- Add new constraint allowing up to 770 characters for excerpt
ALTER TABLE public.posts ADD CONSTRAINT posts_excerpt_length CHECK (char_length(excerpt) <= 770);