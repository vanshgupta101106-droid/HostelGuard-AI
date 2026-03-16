-- Enable RLS on ALL tables (Required by Supabase)
alter table hostel enable row level security;
alter table block enable row level security;
alter table floor enable row level security;
alter table room enable row level security;
alter table student enable row level security;
alter table warden enable row level security;
alter table complaint_log enable row level security;
alter table behavior_log enable row level security;
alter table incident enable row level security;
alter table wellbeing_survey enable row level security;
alter table environment_risk_score enable row level security;
alter table individual_risk_profile enable row level security;
alter table risk_ticket enable row level security;
alter table notification_log enable row level security;
alter table room_monitor_flag enable row level security;

-- Single SIMPLE Policy (Admin = Any Authenticated User)

create policy "authenticated_full_access_hostel"
on hostel
for all
to authenticated
using (true)
with check (true);
create policy "authenticated_full_access_block" on block for all to authenticated using (true) with check (true);
create policy "authenticated_full_access_floor" on floor for all to authenticated using (true) with check (true);
create policy "authenticated_full_access_room" on room for all to authenticated using (true) with check (true);
create policy "authenticated_full_access_student" on student for all to authenticated using (true) with check (true);
create policy "authenticated_full_access_warden" on warden for all to authenticated using (true) with check (true);
create policy "authenticated_full_access_complaint" on complaint_log for all to authenticated using (true) with check (true);
create policy "authenticated_full_access_behavior" on behavior_log for all to authenticated using (true) with check (true);
create policy "authenticated_full_access_incident" on incident for all to authenticated using (true) with check (true);
create policy "authenticated_full_access_wellbeing" on wellbeing_survey for all to authenticated using (true) with check (true);
create policy "authenticated_full_access_env_risk" on environment_risk_score for all to authenticated using (true) with check (true);
create policy "authenticated_full_access_ind_risk" on individual_risk_profile for all to authenticated using (true) with check (true);
create policy "authenticated_full_access_ticket" on risk_ticket for all to authenticated using (true) with check (true);
create policy "authenticated_full_access_notification" on notification_log for all to authenticated using (true) with check (true);
create policy "authenticated_full_access_room_flag" on room_monitor_flag for all to authenticated using (true) with check (true);
