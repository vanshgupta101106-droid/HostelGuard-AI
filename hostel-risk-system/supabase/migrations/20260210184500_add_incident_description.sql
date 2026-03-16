-- Add description column to incident table
ALTER TABLE incident 
ADD COLUMN description text;

-- Add comment to describe the column
COMMENT ON COLUMN incident.description IS 'Detailed description of the incident';
