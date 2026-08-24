
insert into public.tracker_profiles (user_id, display_name, show_personal_schedule, account_type, comfort_item_name, guardian_read_only)
values ('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', 'Google reviewer cozy', true, 'little', 'Biscuit the bear', true)
on conflict (user_id) do update set display_name = excluded.display_name, comfort_item_name = excluded.comfort_item_name;

insert into public.app_preferences (user_id, onboarding_complete, notifications_enabled, nickname_style, weekly_intention_intro_seen, focus_mode, gentle_streaks)
values ('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', true, true, 'warm', true, false, true)
on conflict (user_id) do update set onboarding_complete = true;

insert into public.user_achievements (user_id, visit_streak, best_visit_streak, last_visit_date, unlocked_ids, selected_mascot, earned_badge_ids)
values ('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', 9, 15, '2026-08-01', array['classic','founders-ribbon'], 'classic', array['week-one','comeback','consistent-mornings'])
on conflict (user_id) do update set unlocked_ids = excluded.unlocked_ids, earned_badge_ids = excluded.earned_badge_ids;

insert into public.tracker_tasks (user_id, task_key, day_id, section, task, detail, sort_order, is_bonus, schedule_type, why_note, soft_label, tiny_label, essential_on_low_capacity) values
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', 'water', 'daily', 'Morning', 'Drink a glass of water', '', 0, false, 'weekly', 'Helps with the morning headaches.', 'Just a few sips', 'Have water nearby', true),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', 'morning_meds', 'daily', 'Morning', 'Take morning medication', '', 1, false, 'weekly', 'Keeps my mood steadier through the day.', null, null, true),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', 'brush_teeth', 'daily', 'Morning', 'Brush my teeth', '', 2, false, 'weekly', '', 'Just a quick brush', null, false),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', 'evening_meds', 'daily', 'Evening', 'Take evening medication', '', 0, false, 'weekly', '', null, null, true),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', 'phone_away', 'daily', 'Evening', 'Put my phone away before bed', '', 1, false, 'weekly', 'Sleep comes easier without the scrolling.', 'Just set it face-down', null, false),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', 'run', 'tue', 'Movement', 'Go for a run', '', 0, false, 'weekly', '', 'Short walk instead', 'Step outside for a minute', false),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', 'run_fri', 'fri', 'Movement', 'Go for a run', '', 0, false, 'weekly', '', 'Short walk instead', 'Step outside for a minute', false),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', 'read_bonus', 'daily', 'Bonus', 'Read for pleasure', '', 0, true, 'weekly', '', null, null, false),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', 'prep_week', 'daily', 'This week', 'Prep one meal for the week', '', 0, false, 'once', '', null, null, false)
on conflict (user_id, task_key) do nothing;

update public.tracker_tasks set one_time_date = '2026-08-03' where user_id = '3e74a673-b6e1-4c3b-9f05-3ca848047eb5' and task_key = 'prep_week';

insert into public.tracker_schedules (user_id, day_id, label, wake, morning, work, workout, home) values
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', 'mon', 'Workday', '7:00 AM', 'Water, meds, brush teeth', '9-5', '', 'Evening wind-down'),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', 'tue', 'Workday + run', '7:00 AM', 'Water, meds, brush teeth', '9-5', 'Evening run', 'Evening wind-down'),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', 'sat', 'Weekend reset', '8:30 AM', 'Slow morning', '', '', 'Meal prep for the week')
on conflict (user_id, day_id) do nothing;

insert into public.daily_progress (user_id, progress_date, completed_keys) values
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-07-21', '["water","morning_meds","brush_teeth","evening_meds","phone_away"]'),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-07-22', '["water","morning_meds","brush_teeth","evening_meds","phone_away","read_bonus"]'),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-07-23', '["water","morning_meds"]'),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-07-25', '["water","morning_meds","brush_teeth","evening_meds","phone_away","run"]'),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-07-26', '["water","morning_meds","brush_teeth","evening_meds","phone_away"]'),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-07-27', '["water","morning_meds","brush_teeth"]'),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-07-28', '["water","morning_meds","brush_teeth","evening_meds","phone_away","read_bonus"]'),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-07-29', '["water","morning_meds","brush_teeth","evening_meds","phone_away"]'),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-07-30', '["water","morning_meds"]'),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-07-31', '["water","morning_meds","brush_teeth","evening_meds","phone_away"]'),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-08-01', '["water","morning_meds"]')
on conflict (user_id, progress_date) do nothing;

insert into public.daily_check_ins (user_id, check_date, capacity, soft_day, mood, energy, day_type, note) values
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-07-21', 'usual', false, 'calm', 'steady', 'full', ''),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-07-22', 'high', false, 'happy', 'high', 'full', 'Felt like a good day overall.'),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-07-23', 'low', true, 'tired', 'low', 'soft', 'Rough morning, took it easy.'),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-07-25', 'usual', false, 'calm', 'steady', 'full', ''),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-07-26', 'usual', false, 'calm', 'steady', 'full', ''),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-07-27', 'usual', false, 'okay', 'steady', 'full', ''),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-07-28', 'high', false, 'happy', 'high', 'full', ''),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-07-29', 'usual', false, 'calm', 'steady', 'full', ''),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-07-30', 'low', true, 'tired', 'low', 'soft', 'Mondays are hard lately.'),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-07-31', 'usual', false, 'calm', 'steady', 'full', ''),
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-08-01', 'usual', false, 'okay', 'steady', 'full', 'Getting started a bit later today.')
on conflict (user_id, check_date) do nothing;

insert into public.rest_days (user_id, rest_date) values
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-07-24')
on conflict (user_id, rest_date) do nothing;

insert into public.private_notes (user_id, body, note_date) values
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', 'Feeling a bit more steady this week. The morning routine is starting to feel automatic instead of like a chore.', '2026-07-27')
on conflict (user_id, note_date) do nothing;

insert into public.weekly_intention_checkins (user_id, week_start, feeling) values
('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', '2026-07-27', 'Steady and a little proud of the small stuff.')
on conflict (user_id, week_start) do nothing;

insert into public.caregiver_links (owner_user_id, caregiver_email, label, active, can_view_progress, can_send_notes, can_add_rewards, can_suggest_tasks, can_view_mood, accepted_at, last_viewed_at)
values ('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', 'plushlife.app+guardian@gmail.com', 'Guardian', true, true, true, true, true, true, now() - interval '5 days', now() - interval '6 hours')
on conflict do nothing;

insert into public.support_notes (owner_user_id, caregiver_user_id, caregiver_name, body, is_read)
values ('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', 'cabb4879-24dd-422b-be16-3cc98ced7ad1', 'Guardian', 'Proud of you for sticking with the morning routine this week - even the soft days count!', false);

insert into public.support_rewards (owner_user_id, caregiver_user_id, title, details, target_percent, active)
values ('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', 'cabb4879-24dd-422b-be16-3cc98ced7ad1', 'Movie night pick', 'Your choice of movie this weekend, no arguments.', 70, true);

insert into public.task_suggestions (owner_user_id, caregiver_user_id, caregiver_name, task, suggested_day_id, status)
values ('3e74a673-b6e1-4c3b-9f05-3ca848047eb5', 'cabb4879-24dd-422b-be16-3cc98ced7ad1', 'Guardian', 'Try the 5-minute stretch video together sometime this week', 'daily', 'pending');
