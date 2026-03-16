-- HOSTEL STRUCTURE
create table hostel (
  hostel_id serial primary key,
  hostel_name text not null,
  gender_type text,
  total_capacity int
);

create table block (
  block_id serial primary key,
  hostel_id int not null references hostel(hostel_id) on delete cascade,
  block_name text not null
);

create table floor (
  floor_id serial primary key,
  block_id int not null references block(block_id) on delete cascade,
  floor_number int not null
);

create table room (
  room_id serial primary key,
  floor_id int not null references floor(floor_id) on delete cascade,
  room_number text not null,
  capacity int not null
);

-- STUDENT & WARDEN
create table student (
  student_id uuid primary key references auth.users(id) on delete cascade,
  roll_number text unique,
  full_name text not null,
  department text,
  year int,
  parent_contact text,
  room_id int references room(room_id),
  status text
);

create table warden (
  warden_id serial primary key,
  name text not null,
  contact text,
  assigned_block_id int references block(block_id)
);

-- COMPLAINTS (INDIVIDUAL)
create table complaint_log (
  complaint_id serial primary key,
  student_id uuid not null references student(student_id) on delete cascade,
  category text not null,
  severity text not null,
  description text,
  created_at timestamp with time zone default now()
);

-- DISCIPLINE / BAD HABITS
create table behavior_log (
  behavior_id serial primary key,
  student_id uuid not null references student(student_id) on delete cascade,
  behavior_type text not null,
  severity text not null,
  occurred_at timestamp with time zone not null,
  reported_by int references warden(warden_id),
  remarks text
);

-- 5️⃣ INCIDENTS
create table incident (
  incident_id serial primary key,
  student_id uuid not null references student(student_id) on delete cascade,
  category text not null,
  severity text not null,
  incident_date date not null,
  verified_by int references warden(warden_id)
);

-- 6️⃣ WELLBEING SURVEY
create table wellbeing_survey (
  survey_id serial primary key,
  student_id uuid not null references student(student_id) on delete cascade,
  stress_level int not null,
  mood text,
  submitted_week int not null
);

-- 7️⃣ ENVIRONMENT RISK SCORE
create table environment_risk_score (
  env_risk_id serial primary key,
  hostel_id int references hostel(hostel_id),
  block_id int references block(block_id),
  floor_id int references floor(floor_id),
  risk_score int not null,
  risk_level text not null,
  calculated_on date not null
);

-- 8️⃣ INDIVIDUAL RISK PROFILE
create table individual_risk_profile (
  risk_profile_id serial primary key,
  student_id uuid unique not null references student(student_id) on delete cascade,
  risk_score int not null,
  risk_level text not null,
  last_updated timestamp with time zone default now()
);

-- 9️⃣ ESCALATION & ALERTS
create table risk_ticket (
  ticket_id serial primary key,
  student_id uuid not null references student(student_id) on delete cascade,
  risk_score int not null,
  reason_summary text,
  status text not null,
  created_on timestamp with time zone default now()
);

create table notification_log (
  notification_id serial primary key,
  ticket_id int not null references risk_ticket(ticket_id) on delete cascade,
  sent_to text not null,
  channel text not null,
  sent_on timestamp with time zone default now()
);

-- 🔟 ROOM HIGHLIGHTING (DERIVED)
create table room_monitor_flag (
  flag_id serial primary key,
  room_id int not null references room(room_id) on delete cascade,
  risk_level text not null,
  reason text,
  flagged_on timestamp with time zone default now()
);

alter table student enable row level security;
alter table complaint_log enable row level security;
alter table behavior_log enable row level security;
alter table incident enable row level security;
