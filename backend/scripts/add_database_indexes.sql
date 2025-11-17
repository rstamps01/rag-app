-- Add Database Indexes for Performance Optimization
-- Run this script to add indexes on frequently queried fields

-- Indexes for documents table
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date);
-- Note: idx_documents_filename and idx_documents_department already exist in model

-- Indexes for query_history table
CREATE INDEX IF NOT EXISTS idx_query_history_timestamp ON query_history(query_timestamp);
CREATE INDEX IF NOT EXISTS idx_query_history_user_id ON query_history(user_id);
-- Note: idx_query_history_department_filter already exists in model

-- Composite index for common query pattern (timestamp + department)
CREATE INDEX IF NOT EXISTS idx_query_history_timestamp_department 
    ON query_history(query_timestamp, department_filter);

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('documents', 'query_history')
ORDER BY tablename, indexname;

