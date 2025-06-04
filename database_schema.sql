-- =====================================================
-- CONTACTHUB IDENTITY RECONCILIATION - POSTGRESQL SCHEMA
-- =====================================================
-- Complete database schema for customer contact identity reconciliation
-- with comprehensive relationships, constraints, and advanced queries

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS contacts CASCADE;

-- =====================================================
-- MAIN CONTACTS TABLE
-- =====================================================
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(50),
    email VARCHAR(255),
    linked_id INTEGER,
    link_precedence VARCHAR(20) NOT NULL CHECK (link_precedence IN ('primary', 'secondary')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- FOREIGN KEY CONSTRAINTS
-- =====================================================
-- Self-referencing foreign key for linked contacts
ALTER TABLE contacts 
ADD CONSTRAINT fk_contacts_linked_id 
FOREIGN KEY (linked_id) REFERENCES contacts(id) 
ON DELETE SET NULL;

-- =====================================================
-- CHECK CONSTRAINTS
-- =====================================================
-- Ensure at least one contact method is provided
ALTER TABLE contacts 
ADD CONSTRAINT check_email_or_phone 
CHECK (email IS NOT NULL OR phone_number IS NOT NULL);

-- Primary contacts should not have linked_id
ALTER TABLE contacts 
ADD CONSTRAINT check_primary_no_link 
CHECK (link_precedence != 'primary' OR linked_id IS NULL);

-- Secondary contacts must have linked_id
ALTER TABLE contacts 
ADD CONSTRAINT check_secondary_has_link 
CHECK (link_precedence != 'secondary' OR linked_id IS NOT NULL);

-- Prevent self-referencing (contact cannot link to itself)
ALTER TABLE contacts 
ADD CONSTRAINT check_no_self_reference 
CHECK (id != linked_id);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
-- Index for email lookups (excluding soft-deleted records)
CREATE INDEX idx_contacts_email 
ON contacts(email) 
WHERE deleted_at IS NULL;

-- Index for phone number lookups (excluding soft-deleted records)
CREATE INDEX idx_contacts_phone 
ON contacts(phone_number) 
WHERE deleted_at IS NULL;

-- Index for linked_id lookups (excluding soft-deleted records)
CREATE INDEX idx_contacts_linked_id 
ON contacts(linked_id) 
WHERE deleted_at IS NULL;

-- Index for link precedence (excluding soft-deleted records)
CREATE INDEX idx_contacts_precedence 
ON contacts(link_precedence) 
WHERE deleted_at IS NULL;

-- Index for temporal queries
CREATE INDEX idx_contacts_created_at 
ON contacts(created_at);

CREATE INDEX idx_contacts_updated_at 
ON contacts(updated_at);

-- Composite index for email/phone queries
CREATE INDEX idx_contacts_email_phone 
ON contacts(email, phone_number) 
WHERE deleted_at IS NULL;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contacts_updated_at 
    BEFORE UPDATE ON contacts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ADVANCED QUERIES AND VIEWS
-- =====================================================

-- View: All contact relationships with hierarchy
CREATE OR REPLACE VIEW contact_relationships AS
WITH RECURSIVE contact_tree AS (
    -- Base case: primary contacts
    SELECT 
        id, 
        phone_number, 
        email, 
        linked_id, 
        link_precedence,
        created_at, 
        updated_at, 
        id as root_id, 
        0 as level,
        ARRAY[id] as path
    FROM contacts 
    WHERE link_precedence = 'primary' 
      AND deleted_at IS NULL
    
    UNION ALL
    
    -- Recursive case: secondary contacts
    SELECT 
        c.id, 
        c.phone_number, 
        c.email, 
        c.linked_id, 
        c.link_precedence,
        c.created_at, 
        c.updated_at, 
        ct.root_id, 
        ct.level + 1,
        ct.path || c.id
    FROM contacts c
    INNER JOIN contact_tree ct ON c.linked_id = ct.id
    WHERE c.deleted_at IS NULL
      AND NOT (c.id = ANY(ct.path)) -- Prevent infinite loops
)
SELECT * FROM contact_tree 
ORDER BY root_id, level, created_at;

-- View: Consolidated contact information
CREATE OR REPLACE VIEW consolidated_contacts AS
SELECT 
    p.id as primary_contact_id,
    p.email as primary_email,
    p.phone_number as primary_phone,
    p.created_at as primary_created_at,
    
    -- Aggregate all emails (remove duplicates and nulls)
    ARRAY_REMOVE(ARRAY_AGG(DISTINCT 
        CASE WHEN c.email IS NOT NULL THEN c.email END
    ), NULL) as all_emails,
    
    -- Aggregate all phone numbers (remove duplicates and nulls)
    ARRAY_REMOVE(ARRAY_AGG(DISTINCT 
        CASE WHEN c.phone_number IS NOT NULL THEN c.phone_number END
    ), NULL) as all_phone_numbers,
    
    -- Secondary contact IDs
    ARRAY_REMOVE(ARRAY_AGG(
        CASE WHEN c.link_precedence = 'secondary' THEN c.id END
    ), NULL) as secondary_contact_ids,
    
    -- Statistics
    COUNT(*) as total_contacts,
    COUNT(CASE WHEN c.link_precedence = 'secondary' THEN 1 END) as secondary_count,
    MIN(c.created_at) as first_contact_date,
    MAX(c.updated_at) as last_updated_date
    
FROM contacts p
LEFT JOIN contacts c ON (c.id = p.id OR c.linked_id = p.id)
WHERE p.link_precedence = 'primary' 
  AND p.deleted_at IS NULL
  AND (c.deleted_at IS NULL OR c.id IS NULL)
GROUP BY p.id, p.email, p.phone_number, p.created_at
ORDER BY p.created_at;

-- =====================================================
-- USEFUL QUERIES FOR IDENTITY RECONCILIATION
-- =====================================================

-- Query 1: Find all contacts that share email or phone with a given contact
CREATE OR REPLACE FUNCTION find_related_contacts(
    target_email VARCHAR DEFAULT NULL,
    target_phone VARCHAR DEFAULT NULL
)
RETURNS TABLE(
    contact_id INTEGER,
    email VARCHAR,
    phone_number VARCHAR,
    link_precedence VARCHAR,
    linked_id INTEGER,
    relationship_type VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH target_contacts AS (
        SELECT DISTINCT c.id, c.email, c.phone_number
        FROM contacts c
        WHERE c.deleted_at IS NULL
          AND (
              (target_email IS NOT NULL AND c.email = target_email) OR
              (target_phone IS NOT NULL AND c.phone_number = target_phone)
          )
    ),
    all_related AS (
        -- Direct matches
        SELECT 
            c.id,
            c.email,
            c.phone_number,
            c.link_precedence,
            c.linked_id,
            'direct_match' as relationship_type
        FROM contacts c
        INNER JOIN target_contacts tc ON (
            (c.email = tc.email AND c.email IS NOT NULL) OR
            (c.phone_number = tc.phone_number AND c.phone_number IS NOT NULL)
        )
        WHERE c.deleted_at IS NULL
        
        UNION
        
        -- Linked contacts (find primary if target is secondary)
        SELECT 
            c.id,
            c.email,
            c.phone_number,
            c.link_precedence,
            c.linked_id,
            'linked_primary' as relationship_type
        FROM contacts c
        WHERE c.deleted_at IS NULL
          AND c.id IN (
              SELECT DISTINCT tc_inner.linked_id 
              FROM contacts tc_inner
              INNER JOIN target_contacts tc ON tc_inner.id = tc.id
              WHERE tc_inner.linked_id IS NOT NULL
          )
        
        UNION
        
        -- Find all secondaries linked to the same primary
        SELECT 
            c.id,
            c.email,
            c.phone_number,
            c.link_precedence,
            c.linked_id,
            'linked_secondary' as relationship_type
        FROM contacts c
        WHERE c.deleted_at IS NULL
          AND c.linked_id IN (
              SELECT DISTINCT COALESCE(tc_inner.linked_id, tc_inner.id)
              FROM contacts tc_inner
              INNER JOIN target_contacts tc ON tc_inner.id = tc.id
          )
    )
    SELECT DISTINCT 
        ar.id::INTEGER,
        ar.email::VARCHAR,
        ar.phone_number::VARCHAR,
        ar.link_precedence::VARCHAR,
        ar.linked_id::INTEGER,
        ar.relationship_type::VARCHAR
    FROM all_related ar
    ORDER BY ar.link_precedence, ar.id;
END;
$$ LANGUAGE plpgsql;

-- Query 2: Get contact statistics
CREATE OR REPLACE FUNCTION get_contact_statistics()
RETURNS TABLE(
    metric_name VARCHAR,
    metric_value BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'total_contacts'::VARCHAR, COUNT(*)::BIGINT
    FROM contacts WHERE deleted_at IS NULL
    
    UNION ALL
    
    SELECT 'primary_contacts'::VARCHAR, COUNT(*)::BIGINT
    FROM contacts 
    WHERE deleted_at IS NULL AND link_precedence = 'primary'
    
    UNION ALL
    
    SELECT 'secondary_contacts'::VARCHAR, COUNT(*)::BIGINT
    FROM contacts 
    WHERE deleted_at IS NULL AND link_precedence = 'secondary'
    
    UNION ALL
    
    SELECT 'unique_emails'::VARCHAR, COUNT(DISTINCT email)::BIGINT
    FROM contacts 
    WHERE deleted_at IS NULL AND email IS NOT NULL
    
    UNION ALL
    
    SELECT 'unique_phones'::VARCHAR, COUNT(DISTINCT phone_number)::BIGINT
    FROM contacts 
    WHERE deleted_at IS NULL AND phone_number IS NOT NULL
    
    UNION ALL
    
    SELECT 'orphaned_secondaries'::VARCHAR, COUNT(*)::BIGINT
    FROM contacts c1
    WHERE c1.deleted_at IS NULL 
      AND c1.link_precedence = 'secondary'
      AND NOT EXISTS (
          SELECT 1 FROM contacts c2 
          WHERE c2.id = c1.linked_id 
            AND c2.deleted_at IS NULL
      );
END;
$$ LANGUAGE plpgsql;

-- Query 3: Find potential duplicate contacts
CREATE OR REPLACE VIEW potential_duplicates AS
WITH email_groups AS (
    SELECT email, COUNT(*) as email_count, ARRAY_AGG(id) as contact_ids
    FROM contacts 
    WHERE deleted_at IS NULL AND email IS NOT NULL
    GROUP BY email
    HAVING COUNT(*) > 1
),
phone_groups AS (
    SELECT phone_number, COUNT(*) as phone_count, ARRAY_AGG(id) as contact_ids
    FROM contacts 
    WHERE deleted_at IS NULL AND phone_number IS NOT NULL
    GROUP BY phone_number
    HAVING COUNT(*) > 1
)
SELECT 
    'email' as duplicate_type,
    email as duplicate_value,
    email_count as count,
    contact_ids
FROM email_groups

UNION ALL

SELECT 
    'phone' as duplicate_type,
    phone_number as duplicate_value,
    phone_count as count,
    contact_ids
FROM phone_groups

ORDER BY count DESC;

-- =====================================================
-- DATA INTEGRITY AND MAINTENANCE
-- =====================================================

-- Function to validate contact hierarchy integrity
CREATE OR REPLACE FUNCTION validate_contact_integrity()
RETURNS TABLE(
    issue_type VARCHAR,
    contact_id INTEGER,
    issue_description VARCHAR
) AS $$
BEGIN
    -- Check for orphaned secondary contacts
    RETURN QUERY
    SELECT 
        'orphaned_secondary'::VARCHAR,
        c.id,
        'Secondary contact points to non-existent or deleted primary'::VARCHAR
    FROM contacts c
    WHERE c.deleted_at IS NULL 
      AND c.link_precedence = 'secondary'
      AND (
          c.linked_id IS NULL 
          OR NOT EXISTS (
              SELECT 1 FROM contacts p 
              WHERE p.id = c.linked_id 
                AND p.deleted_at IS NULL
          )
      );
    
    -- Check for circular references (shouldn't happen with constraints, but good to verify)
    RETURN QUERY
    SELECT 
        'circular_reference'::VARCHAR,
        c.id,
        'Contact has circular reference in linking'::VARCHAR
    FROM contacts c
    WHERE c.deleted_at IS NULL 
      AND c.id = c.linked_id;
    
    -- Check for primary contacts with linked_id (violates business rules)
    RETURN QUERY
    SELECT 
        'invalid_primary_link'::VARCHAR,
        c.id,
        'Primary contact should not have linked_id'::VARCHAR
    FROM contacts c
    WHERE c.deleted_at IS NULL 
      AND c.link_precedence = 'primary'
      AND c.linked_id IS NOT NULL;
      
    -- Check for contacts without email or phone
    RETURN QUERY
    SELECT 
        'missing_contact_info'::VARCHAR,
        c.id,
        'Contact has neither email nor phone number'::VARCHAR
    FROM contacts c
    WHERE c.deleted_at IS NULL 
      AND c.email IS NULL 
      AND c.phone_number IS NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample data to demonstrate relationships
INSERT INTO contacts (email, phone_number, link_precedence) VALUES
('john.doe@example.com', '+1234567890', 'primary'),
('jane.smith@example.com', '+0987654321', 'primary'),
('admin@example.com', '+1111111111', 'primary');

-- Add some secondary contacts
INSERT INTO contacts (email, phone_number, linked_id, link_precedence) VALUES
('john.doe@work.com', '+1234567890', 1, 'secondary'),
('john@personal.com', '+1234567891', 1, 'secondary'),
('jane.smith@work.com', '+0987654321', 2, 'secondary');

-- =====================================================
-- EXAMPLE USAGE QUERIES
-- =====================================================

-- Example 1: Find all related contacts for a given email/phone
-- SELECT * FROM find_related_contacts('john.doe@example.com', NULL);

-- Example 2: Get system statistics
-- SELECT * FROM get_contact_statistics();

-- Example 3: View all contact relationships
-- SELECT * FROM contact_relationships LIMIT 10;

-- Example 4: View consolidated contact information
-- SELECT * FROM consolidated_contacts;

-- Example 5: Check for potential duplicates
-- SELECT * FROM potential_duplicates;

-- Example 6: Validate data integrity
-- SELECT * FROM validate_contact_integrity();

-- Example 7: Complex query - Find all contact groups and their sizes
-- SELECT 
--     primary_contact_id,
--     primary_email,
--     primary_phone,
--     total_contacts,
--     secondary_count,
--     all_emails,
--     all_phone_numbers
-- FROM consolidated_contacts
-- ORDER BY total_contacts DESC, primary_created_at;

COMMENT ON TABLE contacts IS 'Main table storing customer contact information with self-referencing relationships for identity reconciliation';
COMMENT ON COLUMN contacts.id IS 'Unique identifier for each contact record';
COMMENT ON COLUMN contacts.phone_number IS 'Customer phone number (optional if email provided)';
COMMENT ON COLUMN contacts.email IS 'Customer email address (optional if phone provided)';
COMMENT ON COLUMN contacts.linked_id IS 'Reference to primary contact ID for secondary contacts';
COMMENT ON COLUMN contacts.link_precedence IS 'Indicates if this is a primary or secondary contact';
COMMENT ON COLUMN contacts.created_at IS 'Timestamp when the contact was first created';
COMMENT ON COLUMN contacts.updated_at IS 'Timestamp when the contact was last modified';
COMMENT ON COLUMN contacts.deleted_at IS 'Soft delete timestamp (NULL for active records)';

-- End of schema
