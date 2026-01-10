-- migration_reorder_nisn.sql
-- Step 1: Create a backup table with the new column order
CREATE TABLE students_new (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nisn varchar(20) UNIQUE,
    name varchar NOT NULL,
    gender varchar,
    class_id uuid REFERENCES classes(id),
    created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 2: Copy data from the old table to the new table
INSERT INTO students_new (id, nisn, name, gender, class_id, created_at)
SELECT id, nisn, name, gender, class_id, created_at FROM students;

-- Step 3: Remove references from other tables (e.g., records)
-- We need to handle constraints if there are any.
-- Assuming 'records' table has a foreign key to students(id)

-- Step 4: Drop old table and rename new one
DROP TABLE students CASCADE; -- CASCADE will drop dependent views/policies/constraints
ALTER TABLE students_new RENAME TO students;

-- Step 5: Restore constraints and policies
-- Re-add foreign key from records to students
ALTER TABLE records 
ADD CONSTRAINT records_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- Re-apply RLS if it was active
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Note: You might need to re-create specific RLS policies if CASCADE dropped them.
-- Check your original supabase_schema.sql for the policies.
