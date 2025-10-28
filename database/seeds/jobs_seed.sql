-- Basic seed data for jobs
insert into public.jobs (title, employer, description, location, country, job_type, accommodation, visa_status_required, service_type, requirements, languages_required, urgent, salary_min, salary_max, currency)
values
('Live-in Housemaid', 'Al Zahra Family', 'Full-time live-in maid for household chores, cleaning, and childcare.', 'Dubai', 'UAE', 'live_in', 'provided', ARRAY['resident'], ARRAY['housekeeping','childcare'], ARRAY['non_smoker','good_communication'], ARRAY['English','Amharic'], true, 1500, 2200, 'AED'),
('Nanny (Experienced)', 'Family of 4', 'Seeking experienced nanny for two children (ages 4 and 7).', 'Riyadh', 'Saudi Arabia', 'full_time', 'provided', ARRAY['work_permit'], ARRAY['childcare'], ARRAY['first_aid','patient'], ARRAY['English','Arabic'], false, 3000, 4000, 'SAR'),
('Cook & Housekeeper', 'Modern Household', 'Cook with experience in Ethiopian and Middle Eastern cuisine; light cleaning.', 'Doha', 'Qatar', 'live_out', 'not_provided', ARRAY['resident'], ARRAY['cooking','housekeeping'], ARRAY['hygiene','organized'], ARRAY['English'], false, 2500, 3500, 'QAR');

