-- stdskillupps — seed data: realistic campus placements
-- Run after schema.sql. 15 rows across SWE, Data Science, Frontend, Backend, DevOps, Mobile.

INSERT INTO public.placements
  (company, role, job_field, languages, skills, notes, package_lpa, location, drive_date)
VALUES
-- ---------- SWE ----------
('Google', 'Software Engineer', 'SWE',
  ARRAY['Python','C++','Java'],
  ARRAY['DSA','System Design','Algorithms','Graph Theory'],
  'L4/L5 ladder. Strong DSA bar: 250+ medium/hard. Onsite rounds on algorithms + design.',
  58, 'Hyderabad', '2026-11-10'),
('Amazon', 'SDE I', 'SWE',
  ARRAY['Java','C++','Python'],
  ARRAY['DSA','System Design','OOP','Distributed Systems Basics'],
  'Leadership principles matter as much as code. LP stories + medium/hard DSA.',
  45, 'Bengaluru', '2026-10-28'),
('Flipkart', 'SDE I', 'SWE',
  ARRAY['Java','Python','Go'],
  ARRAY['DSA','System Design','Concurrency'],
  'Machine-coding round first, then DSA + HLD. Go is a plus for platform teams.',
  36, 'Bengaluru', '2026-12-05'),

-- ---------- Data Science ----------
('Microsoft', 'Data Scientist', 'Data Science',
  ARRAY['Python','SQL','R'],
  ARRAY['Statistics','Machine Learning','Pandas','Experiment Design'],
  'A/B testing and stats depth are deciding factors. Expect probability puzzles.',
  52, 'Hyderabad', '2026-11-18'),
('Zerodha', 'Data Analyst', 'Data Science',
  ARRAY['Python','SQL'],
  ARRAY['Statistics','Data Visualization','Excel','Business Metrics'],
  'SQL window functions + a product case study. Stats fundamentals over fancy ML.',
  24, 'Bengaluru', '2027-01-12'),
('Swiggy', 'ML Engineer', 'Data Science',
  ARRAY['Python','SQL','C++'],
  ARRAY['Machine Learning','Deep Learning','MLOps','Recommendation Systems'],
  'Deploy models, not just train them. MLOps and serving latency questions common.',
  38, 'Bengaluru', '2026-12-15'),

-- ---------- Frontend ----------
('Razorpay', 'Frontend Engineer', 'Frontend',
  ARRAY['JavaScript','TypeScript'],
  ARRAY['React','CSS','DOM','Web Performance'],
  'Heavy React: hooks, reconciliation, perf. Build a mini app in the machine-coding round.',
  32, 'Bengaluru', '2026-11-25'),
('Freshworks', 'UI Engineer', 'Frontend',
  ARRAY['JavaScript','TypeScript'],
  ARRAY['React','HTML','CSS','Accessibility'],
  'Accessibility and responsive CSS carry weight. Portfolio of shipped UIs helps.',
  20, 'Chennai', '2027-01-20'),

-- ---------- Backend ----------
('PhonePe', 'Backend Developer', 'Backend',
  ARRAY['Java','Go','SQL'],
  ARRAY['System Design','Databases','Caching','Message Queues'],
  'Design a payment ledger at scale. Redis/Kafka knowledge expected.',
  40, 'Bengaluru', '2026-11-08'),
('Zoho', 'Software Developer (Backend)', 'Backend',
  ARRAY['Java','C++','SQL'],
  ARRAY['DSA','Databases','OOP','Linux'],
  'Classic product-company bar: C/DSA puzzles + SQL joins + OOP design.',
  18, 'Chennai', '2026-12-20'),

-- ---------- DevOps ----------
('Amazon', 'Cloud Support / DevOps Engineer', 'DevOps',
  ARRAY['Python','Bash','SQL'],
  ARRAY['AWS','Docker','Kubernetes','Linux','Networking'],
  'Hands-on troubleshooting > certs. Know networking and Linux cold.',
  22, 'Hyderabad', '2027-01-05'),
('TCS', 'DevOps Engineer', 'DevOps',
  ARRAY['Python','Bash'],
  ARRAY['CI/CD','Docker','Jenkins','Git'],
  'Large enterprise pipelines. Jenkins + scripting + incident hygiene.',
  7.5, 'Pan-India', '2026-10-30'),

-- ---------- Mobile ----------
('PhonePe', 'Android Developer', 'Mobile',
  ARRAY['Kotlin','Java'],
  ARRAY['Android SDK','Jetpack Compose','MVVM','REST APIs'],
  'Jetpack Compose is the default ask now. Ship an app on the Play Store if you can.',
  40, 'Bengaluru', '2026-11-08'),
('Swiggy', 'iOS Developer', 'Mobile',
  ARRAY['Swift','Objective-C'],
  ARRAY['UIKit','SwiftUI','Combine','REST APIs'],
  'SwiftUI + Combine. Expect a small take-home: offline-first list + detail flow.',
  36, 'Bengaluru', '2026-12-15'),

-- extra SWE row for breadth
('Infosys', 'Systems Engineer', 'SWE',
  ARRAY['Java','Python','SQL'],
  ARRAY['OOP','DBMS','Aptitude','Communication'],
  'Mass-recruiter pattern: aptitude + basic coding + HR. Great safety option.',
  9.5, 'Pan-India', '2027-02-01');
