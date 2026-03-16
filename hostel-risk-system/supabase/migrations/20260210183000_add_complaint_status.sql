-- Add status column to complaint_log table
alter table complaint_log 
add column status text not null default 'pending';

-- Add index for better performance on status queries
create index idx_complaint_log_status on complaint_log(status);
